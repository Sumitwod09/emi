import { createServiceClient } from '@/lib/supabase/server'
import { getSuperAdminContext, isSuperAdminContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const auth = await getSuperAdminContext()
  if (!isSuperAdminContext(auth)) return auth

  const { id: storeId, userId } = await params
  const supabase = createServiceClient()

  // Verify the user belongs to this store and is not the owner
  const { data: storeUser } = await supabase
    .from('store_users')
    .select('id, email, role')
    .eq('id', userId)
    .eq('store_id', storeId)
    .single()

  if (!storeUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (storeUser.role === 'owner') return NextResponse.json({ error: 'Cannot remove store owner' }, { status: 400 })

  // Remove from store_users
  await supabase.from('store_users').delete().eq('id', userId)

  // Also delete the Supabase Auth user
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const authUser = authUsers?.users?.find(u => u.email === storeUser.email)
  if (authUser) await supabase.auth.admin.deleteUser(authUser.id)

  return NextResponse.json({ ok: true })
}
