import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext, isAuthContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ device_id: string }> }
) {
  const auth = await getAuthContext()
  if (!isAuthContext(auth)) return auth

  const { device_id } = await params
  const supabase = createServiceClient()

  // Verify device belongs to store
  const { data: device } = await supabase
    .from('devices')
    .select('id')
    .eq('id', device_id)
    .eq('store_id', auth.storeId)
    .single()

  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }

  const { data: plan } = await supabase
    .from('emi_plans')
    .select('*, emi_payments(*)')
    .eq('device_id', device_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!plan) {
    return NextResponse.json({ error: 'EMI plan not found' }, { status: 404 })
  }

  const payments = (plan.emi_payments ?? []).sort(
    (a: { due_date: string }, b: { due_date: string }) => a.due_date.localeCompare(b.due_date)
  )

  return NextResponse.json({ plan: { ...plan, emi_payments: payments } })
}
