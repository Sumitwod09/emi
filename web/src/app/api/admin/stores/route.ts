import { createServiceClient } from '@/lib/supabase/server'
import { getSuperAdminContext, isSuperAdminContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await getSuperAdminContext()
  if (!isSuperAdminContext(auth)) return auth

  const supabase = createServiceClient()

  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, phone, email, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach user and device counts
  const enriched = await Promise.all((stores ?? []).map(async (store) => {
    const [{ count: userCount }, { count: deviceCount }] = await Promise.all([
      supabase.from('store_users').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
      supabase.from('devices').select('id', { count: 'exact', head: true }).eq('store_id', store.id).neq('status', 'deregistered'),
    ])
    return { ...store, user_count: userCount ?? 0, device_count: deviceCount ?? 0 }
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: Request) {
  const auth = await getSuperAdminContext()
  if (!isSuperAdminContext(auth)) return auth

  const { store_name, store_phone, store_address, owner_name, email, password } =
    await request.json()

  if (!store_name || !store_phone || !owner_name || !email || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Check email not already used
  const { data: existing } = await supabase
    .from('store_users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  // Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create auth user' }, { status: 500 })
  }

  // Create store
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert({ name: store_name, phone: store_phone, address: store_address ?? null, email })
    .select()
    .single()

  if (storeError || !store) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: storeError?.message ?? 'Failed to create store' }, { status: 500 })
  }

  // Create store_user record (owner)
  const { error: userError } = await supabase
    .from('store_users')
    .insert({ store_id: store.id, name: owner_name, email, role: 'owner' })

  if (userError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    await supabase.from('stores').delete().eq('id', store.id)
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, store_id: store.id }, { status: 201 })
}
