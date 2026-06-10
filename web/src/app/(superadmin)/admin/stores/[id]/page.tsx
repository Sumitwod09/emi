'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface StoreUser {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

interface StoreDetail {
  id: string
  name: string
  phone: string
  email: string
  address: string | null
  users: StoreUser[]
  device_count: number
}

const ROLES = ['owner', 'manager', 'employee'] as const

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [store, setStore] = useState<StoreDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'employee' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [removeLoading, setRemoveLoading] = useState<string | null>(null)

  const fetchStore = useCallback(async () => {
    const res = await fetch(`/api/admin/stores/${id}`)
    if (res.ok) setStore(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { fetchStore() }, [fetchStore])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)
    try {
      const res = await fetch(`/api/admin/stores/${id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (!res.ok) { setAddError(data.error ?? 'Failed'); return }
      setShowAdd(false)
      setAddForm({ name: '', email: '', password: '', role: 'employee' })
      fetchStore()
    } catch {
      setAddError('Could not connect.')
    } finally {
      setAddLoading(false)
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Remove this user from the store?')) return
    setRemoveLoading(userId)
    await fetch(`/api/admin/stores/${id}/users/${userId}`, { method: 'DELETE' })
    setRemoveLoading(null)
    fetchStore()
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
  if (!store) return <div style={{ padding: 40 }}>Store not found</div>

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14 }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{store.name}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{store.phone} · {store.device_count} devices</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
          Team ({store.users.length})
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            background: 'var(--primary)', color: '#fff', border: 'none',
            borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Add User
        </button>
      </div>

      {store.users.map(u => (
        <div key={u.id} style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
          padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '3px 8px', borderRadius: 4,
              background: u.role === 'owner' ? 'var(--active-bg)' : 'var(--inactive-bg)',
              color: u.role === 'owner' ? 'var(--active-text)' : 'var(--inactive-text)',
            }}>
              {u.role}
            </span>
            {u.role !== 'owner' && (
              <button
                onClick={() => handleRemove(u.id)}
                disabled={removeLoading === u.id}
                style={{
                  background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                  padding: '5px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--locked-text)',
                  opacity: removeLoading === u.id ? 0.5 : 1,
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}

      {showAdd && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={() => setShowAdd(false)}
        >
          <div
            style={{ background: 'var(--surface)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 380 }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Add User to {store.name}</h2>
            <form onSubmit={handleAdd}>
              {[
                { key: 'name',     label: 'Name',     type: 'text' },
                { key: 'email',    label: 'Email',    type: 'email' },
                { key: 'password', label: 'Password', type: 'password' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={addForm[f.key as keyof typeof addForm]}
                    onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required
                    placeholder={f.key === 'password' ? 'Min 8 characters' : undefined}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Role</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))}
                  style={{ ...inputStyle, background: '#fff' }}
                >
                  {ROLES.filter(r => r !== 'owner').map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              {addError && <p style={{ color: 'var(--locked-text)', marginBottom: 12, fontSize: 13 }}>{addError}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={addLoading} style={{ flex: 2, padding: 12, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: addLoading ? 'not-allowed' : 'pointer', opacity: addLoading ? 0.7 : 1 }}>
                  {addLoading ? 'Adding…' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
