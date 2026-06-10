import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext, isAuthContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const auth = await getAuthContext()
  if (!isAuthContext(auth)) return auth

  const { token } = await request.json()
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('store_users')
    .update({ expo_push_token: token })
    .eq('id', auth.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
