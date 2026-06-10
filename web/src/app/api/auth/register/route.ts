import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { store_name, store_phone, store_address, owner_name, email, password } =
    await request.json()

  if (!store_name || !store_phone || !owner_name || !email || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Check email not already registered
  const { data: existing } = await supabase
    .from('store_users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  // Create the Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 500 })
  }

  // Create the store
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert({ name: store_name, phone: store_phone, address: store_address ?? null, email })
    .select()
    .single()

  if (storeError || !store) {
    // Rollback auth user
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: storeError?.message ?? 'Failed to create store' }, { status: 500 })
  }

  // Create the store_user record linking auth user → store
  const { error: userError } = await supabase
    .from('store_users')
    .insert({ store_id: store.id, name: owner_name, email, role: 'owner' })

  if (userError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    await supabase.from('stores').delete().eq('id', store.id)
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
