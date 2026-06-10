import { createClient, createServiceClient } from './supabase/server'
import { NextResponse } from 'next/server'

export interface AuthContext {
  userId: string
  storeId: string
  role: 'owner' | 'manager' | 'employee'
  userEmail: string
  isSuperAdmin: false
}

export interface SuperAdminContext {
  userId: string
  userEmail: string
  isSuperAdmin: true
}

export type AnyAuthContext = AuthContext | SuperAdminContext

export async function getAuthContext(): Promise<AuthContext | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  // Super admins are not in store_users — reject them from store-scoped routes
  const { data: superAdmin } = await service
    .from('super_admins')
    .select('id')
    .eq('email', user.email!)
    .maybeSingle()

  if (superAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: storeUser } = await service
    .from('store_users')
    .select('id, store_id, role')
    .eq('email', user.email!)
    .single()

  if (!storeUser) {
    return NextResponse.json({ error: 'Store user not found' }, { status: 403 })
  }

  return {
    userId: storeUser.id,
    storeId: storeUser.store_id,
    role: storeUser.role,
    userEmail: user.email!,
    isSuperAdmin: false,
  }
}

export async function getSuperAdminContext(): Promise<SuperAdminContext | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data: superAdmin } = await service
    .from('super_admins')
    .select('id')
    .eq('email', user.email!)
    .maybeSingle()

  if (!superAdmin) {
    return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 })
  }

  return { userId: superAdmin.id, userEmail: user.email!, isSuperAdmin: true }
}

export function isAuthContext(val: AuthContext | NextResponse): val is AuthContext {
  return !(val instanceof NextResponse)
}

export function isSuperAdminContext(val: SuperAdminContext | NextResponse): val is SuperAdminContext {
  return !(val instanceof NextResponse)
}
