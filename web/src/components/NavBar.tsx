'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  storeName: string
  userName: string
  isOwner?: boolean
}

export default function NavBar({ storeName, userName, isOwner }: Props) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '12px 16px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>EMI Manager</span>
          </Link>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{storeName}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {isOwner && (
            <Link
              href="/dashboard/team"
              style={{
                padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 6,
                textDecoration: 'none', fontSize: 13, color: 'var(--text-secondary)',
              }}
            >
              Team
            </Link>
          )}
          <Link
            href="/dashboard/device/register"
            style={{
              background: 'var(--primary)', color: '#fff',
              padding: '8px 14px', borderRadius: 6, textDecoration: 'none',
              fontSize: 13, fontWeight: 600,
            }}
          >
            + Add Device
          </Link>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              padding: '7px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)',
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
