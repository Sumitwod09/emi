'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SuperAdminNav({ adminName }: { adminName: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header style={{
      background: '#1a1a1a', borderBottom: '1px solid #333',
      padding: '12px 16px', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>EMI Manager</span>
            <span style={{
              marginLeft: 8, fontSize: 11, background: '#d32f2f', color: '#fff',
              padding: '2px 7px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.05em',
            }}>SUPER ADMIN</span>
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#9e9e9e' }}>{adminName}</span>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid #444', borderRadius: 6,
              padding: '7px 12px', fontSize: 13, cursor: 'pointer', color: '#9e9e9e',
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
