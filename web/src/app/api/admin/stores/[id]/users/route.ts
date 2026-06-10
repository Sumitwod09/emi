import { createServiceClient } from '@/lib/supabase/server'
import { getSuperAdminContext, isSuperAdminContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSuperAdminContext()
  if (!isSuperAdminContext(auth)) return auth

  const { id: storeId } = await params
  const { name, email, password, role } = await request.json()

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'name, email, password, role are required' }, { status: 400 })
  }
  if (!['owner', 'manager', 'employee'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
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
    .insert({ store_id: storeId, name, email, role })

  if (insertError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
