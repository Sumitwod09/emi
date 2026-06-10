import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext, isAuthContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext()
  if (!isAuthContext(auth)) return auth

  const { id } = await params
  const supabase = createServiceClient()

  const { data: device, error } = await supabase
    .from('devices')
    .select(`
      *,
      customers(id, name, phone, aadhaar_last4),
      emi_plans(
        *,
        emi_payments(* )
      ),
      lock_events(*)
    `)
    .eq('id', id)
    .eq('store_id', auth.storeId)
    .single()

  if (error || !device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }

  const payments = device.emi_plans?.[0]?.emi_payments ?? []
  const outstanding = payments
    .filter((p: { status: string }) => p.status === 'missed')
    .reduce((sum: number, p: { amount_due: number }) => sum + Number(p.amount_due), 0)

  return NextResponse.json({ ...device, outstanding_amount: outstanding })
}
