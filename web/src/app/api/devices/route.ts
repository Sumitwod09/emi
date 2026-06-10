import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext, isAuthContext } from '@/lib/auth'
import { hashImei, generateDeviceSecret } from '@/lib/hmac'
import { NextResponse } from 'next/server'
import type { RegisterDeviceInput } from '@/types'

export async function GET() {
  const auth = await getAuthContext()
  if (!isAuthContext(auth)) return auth

  const supabase = createServiceClient()

  const { data: devices, error } = await supabase
    .from('devices')
    .select(`
      *,
      customers(id, name, phone),
      emi_plans(
        id, emi_amount, tenure_months, start_date, grace_period_days,
        emi_payments(id, due_date, amount_due, status, paid_date)
      ),
      lock_events(id, locked_at, unlocked_at)
    `)
    .eq('store_id', auth.storeId)
    .neq('status', 'deregistered')
    .order('registered_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched = (devices ?? []).map((d) => {
    const payments = d.emi_plans?.[0]?.emi_payments ?? []
    const missedOrPending = payments.filter(
      (p: { status: string }) => p.status === 'missed' || p.status === 'pending'
    )
    const outstanding = missedOrPending
      .filter((p: { status: string }) => p.status === 'missed')
      .reduce((sum: number, p: { amount_due: number }) => sum + Number(p.amount_due), 0)
    const nextDue = payments
      .filter((p: { status: string }) => p.status === 'pending')
      .sort((a: { due_date: string }, b: { due_date: string }) =>
        a.due_date.localeCompare(b.due_date)
      )[0]
    const nextDueDays = nextDue
      ? Math.ceil(
          (new Date(nextDue.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : null

    return {
      ...d,
      outstanding_amount: outstanding,
      next_due_date: nextDue?.due_date ?? null,
      next_due_days: nextDueDays,
    }
  })

  return NextResponse.json(enriched)
}

export async function POST(request: Request) {
  const auth = await getAuthContext()
  if (!isAuthContext(auth)) return auth

  const body: RegisterDeviceInput = await request.json()

  const {
    imei, model,
    customer_name, customer_phone, customer_aadhaar_last4,
    total_amount, down_payment, emi_amount, tenure_months, start_date, grace_period_days,
  } = body

  if (!imei || !model || !customer_name || !customer_phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const imeiHash = hashImei(imei)
  const hmacSecret = generateDeviceSecret()

  // Create customer
  const { data: customer, error: cErr } = await supabase
    .from('customers')
    .insert({ store_id: auth.storeId, name: customer_name, phone: customer_phone, aadhaar_last4: customer_aadhaar_last4 ?? null })
    .select()
    .single()

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  // Create device
  const { data: device, error: dErr } = await supabase
    .from('devices')
    .insert({ store_id: auth.storeId, customer_id: customer.id, imei_hash: imeiHash, model, hmac_secret: hmacSecret })
    .select()
    .single()

  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 })

  // Create EMI plan
  const { data: plan, error: pErr } = await supabase
    .from('emi_plans')
    .insert({ device_id: device.id, total_amount, down_payment: down_payment ?? 0, emi_amount, tenure_months, start_date, grace_period_days: grace_period_days ?? 3 })
    .select()
    .single()

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  // Generate payment schedule
  const payments = []
  for (let i = 0; i < tenure_months; i++) {
    const due = new Date(start_date)
    due.setMonth(due.getMonth() + i)
    payments.push({
      emi_plan_id: plan.id,
      due_date: due.toISOString().split('T')[0],
      amount_due: emi_amount,
      status: 'pending',
    })
  }

  const { error: payErr } = await supabase.from('emi_payments').insert(payments)
  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 })

  return NextResponse.json({ device, customer, plan }, { status: 201 })
}
