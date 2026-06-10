import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext, isAuthContext } from '@/lib/auth'
import { lockDevice, notifyStoreUsers } from '@/lib/fcm'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext()
  if (!isAuthContext(auth)) return auth

  const { id } = await params
  const { reason } = await request.json()
  const supabase = createServiceClient()

  const { data: device, error } = await supabase
    .from('devices')
    .select('*, stores(name, phone, address), customers(name), emi_plans(emi_amount, emi_payments(*))')
    .eq('id', id)
    .eq('store_id', auth.storeId)
    .single()

  if (error || !device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }

  if (device.status === 'locked') {
    return NextResponse.json({ error: 'Device is already locked' }, { status: 409 })
  }

  const missedPayments = device.emi_plans?.[0]?.emi_payments?.filter(
    (p: { status: string }) => p.status === 'missed'
  ) ?? []
  const outstanding = missedPayments.reduce(
    (sum: number, p: { amount_due: number }) => sum + Number(p.amount_due), 0
  ) || Number(device.emi_plans?.[0]?.emi_amount ?? 0)

  const store = device.stores ?? { name: 'Store', phone: '', address: null }

  // Write lock_payload to devices row — Supabase Realtime delivers it to the Android app
  await lockDevice(id, device.hmac_secret, store, outstanding)

  await supabase.from('lock_events').insert({
    device_id: id,
    lock_reason: reason ?? 'MANUAL',
  })

  await notifyStoreUsers(auth.storeId, {
    id,
    customer_name: device.customers?.name ?? 'Customer',
    model: device.model,
    due_amount: outstanding,
  })

  return NextResponse.json({ ok: true })
}
