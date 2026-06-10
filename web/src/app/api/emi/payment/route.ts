import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext, isAuthContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const auth = await getAuthContext()
  if (!isAuthContext(auth)) return auth

  const { device_id, amount, method } = await request.json()

  if (!device_id || !amount || !method) {
    return NextResponse.json({ error: 'device_id, amount, method required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify device belongs to store
  const { data: device } = await supabase
    .from('devices')
    .select('id, emi_plans(emi_payments(*))')
    .eq('id', device_id)
    .eq('store_id', auth.storeId)
    .single()

  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }

  const missedPayments = (device.emi_plans?.[0]?.emi_payments ?? [])
    .filter((p: { status: string }) => p.status === 'missed' || p.status === 'pending')
    .sort((a: { due_date: string }, b: { due_date: string }) => a.due_date.localeCompare(b.due_date))

  if (!missedPayments.length) {
    return NextResponse.json({ error: 'No outstanding payments' }, { status: 409 })
  }

  const { data: payment, error } = await supabase
    .from('emi_payments')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString(),
      amount_paid: amount,
      payment_method: method,
      recorded_by: auth.userId,
    })
    .eq('id', missedPayments[0].id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ payment })
}
