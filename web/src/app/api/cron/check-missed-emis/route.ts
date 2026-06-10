import { createServiceClient } from '@/lib/supabase/server'
import { lockDevice, notifyStoreUsers } from '@/lib/fcm'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]
  const supabase = createServiceClient()

  const { data: payments, error } = await supabase
    .from('emi_payments')
    .select(`
      *,
      emi_plans(
        grace_period_days,
        device_id,
        devices(
          id, status, hmac_secret, store_id, model,
          stores(name, phone, address),
          customers(name)
        )
      )
    `)
    .eq('status', 'pending')
    .lt('due_date', today)

  if (error) {
    console.error('Cron query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let locked = 0

  for (const payment of payments ?? []) {
    const plan = payment.emi_plans
    const device = plan?.devices
    if (!device || device.status === 'locked') continue

    const graceDays = plan.grace_period_days ?? 3
    const lockAfter = new Date(payment.due_date)
    lockAfter.setDate(lockAfter.getDate() + graceDays)
    if (new Date() < lockAfter) continue

    const store = device.stores ?? { name: 'Store', phone: '', address: null }

    await supabase.from('emi_payments').update({ status: 'missed' }).eq('id', payment.id)

    // Write lock_payload to devices row — Supabase Realtime delivers it to the Android app
    await lockDevice(device.id, device.hmac_secret, store, Number(payment.amount_due))

    await supabase.from('lock_events').insert({
      device_id: device.id,
      lock_reason: 'EMI_MISSED',
      emi_payment_id: payment.id,
    })

    await notifyStoreUsers(device.store_id, {
      id: device.id,
      customer_name: device.customers?.name ?? 'Customer',
      model: device.model,
      due_amount: Number(payment.amount_due),
    })

    locked++
  }

  return NextResponse.json({ ok: true, locked })
}
