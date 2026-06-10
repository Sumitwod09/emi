import { createServiceClient } from '@/lib/supabase/server'
import { notifyStoreUsers } from '@/lib/fcm'
import { NextResponse } from 'next/server'

// Called when the Android app cannot complete an integrity check (network failure, API error).
// Conservative alert — notifies the store but does not auto-lock.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { reason } = await request.json()

  const supabase = createServiceClient()
  const { data: device } = await supabase
    .from('devices')
    .select('store_id, model, customers(name)')
    .eq('id', id)
    .single()

  if (device) {
    await notifyStoreUsers(
      device.store_id,
      { id, customer_name: (device.customers as { name: string } | null)?.name ?? 'Customer', model: device.model, due_amount: 0 },
      { title: '⚠️ Security Alert', body: `${(device.customers as { name: string } | null)?.name ?? 'Customer'}'s ${device.model}: device admin disabled. Verify device immediately.` }
    )
  }

  console.warn(`Integrity alert for device ${id}: ${reason}`)
  return NextResponse.json({ ok: true })
}
