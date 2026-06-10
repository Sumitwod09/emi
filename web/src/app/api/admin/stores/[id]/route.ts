import { createServiceClient } from '@/lib/supabase/server'
import { getSuperAdminContext, isSuperAdminContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSuperAdminContext()
  if (!isSuperAdminContext(auth)) return auth

  const { id } = await params
  const supabase = createServiceClient()

  const { data: store, error } = await supabase
    .from('stores')
    .select('id, name, phone, email, address, created_at')
    .eq('id', id)
    .single()

  if (error || !store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const [{ data: users }, { count: deviceCount }] = await Promise.all([
    supabase.from('store_users').select('id, name, email, role, created_at').eq('store_id', id).order('created_at'),
    supabase.from('devices').select('id', { count: 'exact', head: true }).eq('store_id', id).neq('status', 'deregistered'),
  ])

  return NextResponse.json({ ...store, users: users ?? [], device_count: deviceCount ?? 0 })
}
