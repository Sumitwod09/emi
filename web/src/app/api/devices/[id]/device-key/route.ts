import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Called by the Android app on first launch to register its Supabase device key.
// No user session required — the device identifies itself by its device_id in the URL.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { device_key } = await request.json()

  if (!device_key) {
    return NextResponse.json({ error: 'device_key required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('devices')
    .update({ supabase_device_key: device_key, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
