import { getAuthContext, isAuthContext } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await getAuthContext()
  if (!isAuthContext(auth)) return auth
  return NextResponse.json({ role: auth.role, storeId: auth.storeId })
}
