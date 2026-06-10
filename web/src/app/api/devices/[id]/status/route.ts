import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Polled by the Android app's WorkManager every 15 min as a Realtime fallback.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: device, error } = await supabase
    .from('devices')
    .select('id, status, lock_payload, updated_at')
    .eq('id', id)
    .single()

  if (error || !device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }

  return NextResponse.json({
    status: device.status,
    lock_payload: device.lock_payload,
    updated_at: device.updated_at,
  })
}
