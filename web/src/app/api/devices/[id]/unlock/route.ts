import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext, isAuthContext } from '@/lib/auth'
import { unlockDevice } from '@/lib/fcm'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext()
  if (!isAuthContext(auth)) return auth

  const { id } = await params
  const { amount_paid, payment_method } = await request.json()

  if (!amount_paid || !payment_method) {
    return NextResponse.json({ error: 'amount_paid and payment_method required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: device, error } = await supabase
    .from('devices')
    .select('*, emi_plans(emi_payments(*))')
    .eq('id', id)
    .eq('store_id', auth.storeId)
    .single()

  if (error || !device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }

  if (device.status !== 'locked') {
    return NextResponse.json({ error: 'Device is not locked' }, { status: 409 })
  }

  const paymentRef = `PAY_${Date.now()}`

  // Write unlock payload to devices row — Supabase Realtime delivers it to the Android app
  await unlockDevice(id, device.hmac_secret, paymentRef)

  // Mark the oldest missed payment as paid
  const missedPayments = (device.emi_plans?.[0]?.emi_payments ?? [])
    .filter((p: { status: string }) => p.status === 'missed')
    .sort((a: { due_date: string }, b: { due_date: string }) => a.due_date.localeCompare(b.due_date))

  if (missedPayments.length > 0) {
    await supabase
      .from('emi_payments')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        amount_paid,
        payment_method,
        recorded_by: auth.userId,
      })
      .eq('id', missedPayments[0].id)
  }

  // Close the open lock event
  const { data: lockEvent } = await supabase
    .from('lock_events')
    .select('id')
    .eq('device_id', id)
    .is('unlocked_at', null)
    .order('locked_at', { ascending: false })
    .limit(1)
    .single()

  if (lockEvent) {
    await supabase
      .from('lock_events')
      .update({ unlocked_at: new Date().toISOString(), unlocked_by: auth.userId })
      .eq('id', lockEvent.id)
  }

  return NextResponse.json({ ok: true, payment_ref: paymentRef })
}
