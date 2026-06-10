'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface StoreRow {
  id: string
  name: string
  phone: string
  email: string
  created_at: string
  user_count: number
  device_count: number
}

export default function AdminDashboard() {
  const [stores, setStores] = useState<StoreRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stores')
      if (!res.ok) throw new Error('Failed')
      setStores(await res.json())
      setError('')
    } catch {
      setError('Failed to load stores')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStores() }, [fetchStores])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>All Stores</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stores.length} store{stores.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Link
          href="/admin/stores/create"
          style={{
            background: 'var(--primary)', color: '#fff', padding: '10px 16px',
            borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600,
          }}
        >
          + Add Store
        </Link>
      </div>

      {error && <p style={{ color: 'var(--locked-text)', marginBottom: 16 }}>{error}</p>}

      {stores.length === 0 && !error ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
          padding: 40, textAlign: 'center', color: 'var(--text-secondary)',
        }}>
          No stores yet. Click <strong>+ Add Store</strong> to create the first one.
        </div>
      ) : (
        stores.map(store => (
          <div key={store.id} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 16, marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>{store.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {store.phone} · {store.email}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {store.user_count} user{store.user_count !== 1 ? 's' : ''} · {store.device_count} device{store.device_count !== 1 ? 's' : ''}
                  {' · '}Added {new Date(store.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <Link
                href={`/admin/stores/${store.id}`}
                style={{
                  padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 6,
                  textDecoration: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
                }}
              >
                Manage
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
