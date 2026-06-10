import { createServiceClient } from '@/lib/supabase/server'
import { notifyStoreUsers } from '@/lib/fcm'
import { NextResponse } from 'next/server'

// Called by the Android app when it detects the SIM serial changed.
// Notifies the store — store can investigate and manually lock if needed.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      { title: '⚠️ SIM Change Detected', body: `${(device.customers as { name: string } | null)?.name ?? 'Customer'}'s ${device.model}: SIM card was swapped. Verify the customer.` }
    )
  }

  console.warn(`SIM change detected on device ${id}`)
  return NextResponse.json({ ok: true })
}
