import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext, isAuthContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await getAuthContext()
  if (!isAuthContext(auth)) return auth

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('store_users')
    .select('id, name, email, role, created_at')
    .eq('store_id', auth.storeId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const auth = await getAuthContext()
  if (!isAuthContext(auth)) return auth

  if (auth.role !== 'owner') {
    return NextResponse.json({ error: 'Only store owners can add team members' }, { status: 403 })
  }

  const { name, email, password, role } = await request.json()

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'name, email, password, role required' }, { status: 400 })
  }
  if (!['manager', 'employee'].includes(role)) {
    return NextResponse.json({ error: 'Role must be manager or employee' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('store_users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 500 })
  }

  const { error: insertError } = await supabase
    .from('store_users')
    .insert({ store_id: auth.storeId, name, email, role })

  if (insertError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: Request) {
  const auth = await getAuthContext()
  if (!isAuthContext(auth)) return auth

  if (auth.role !== 'owner') {
    return NextResponse.json({ error: 'Only store owners can remove team members' }, { status: 403 })
  }

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: target } = await supabase
    .from('store_users')
    .select('id, email, role')
    .eq('id', userId)
    .eq('store_id', auth.storeId)
    .single()

  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (target.role === 'owner') return NextResponse.json({ error: 'Cannot remove store owner' }, { status: 400 })

  await supabase.from('store_users').delete().eq('id', userId)

  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const authUser = authUsers?.users?.find((u: { email?: string; id: string }) => u.email === target.email)
  if (authUser) await supabase.auth.admin.deleteUser(authUser.id)

  return NextResponse.json({ ok: true })
}
