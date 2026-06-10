'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateStorePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    store_name: '', store_phone: '', store_address: '',
    owner_name: '', email: '', password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      router.push('/admin')
    } catch {
      setError('Could not connect.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
    borderRadius: 6, fontSize: 14, outline: 'none',
  }
  const labelStyle = { display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Add New Store</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 14 }}>Store Details</div>
          {[
            { key: 'store_name',    label: 'Store Name',    req: true },
            { key: 'store_phone',   label: 'Store Phone',   req: true },
            { key: 'store_address', label: 'Store Address', req: false },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{f.label}{f.req && <span style={{ color: 'var(--locked-text)' }}> *</span>}</label>
              <input
                value={form[f.key as keyof typeof form]}
                onChange={e => set(f.key as keyof typeof form, e.target.value)}
                required={f.req}
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 14 }}>Store Owner Account</div>
          {[
            { key: 'owner_name', label: 'Owner Name',  type: 'text',     req: true },
            { key: 'email',      label: 'Email',        type: 'email',    req: true },
            { key: 'password',   label: 'Password',     type: 'password', req: true },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{f.label}{f.req && <span style={{ color: 'var(--locked-text)' }}> *</span>}</label>
              <input
                type={f.type}
                value={form[f.key as keyof typeof form]}
                onChange={e => set(f.key as keyof typeof form, e.target.value)}
                required={f.req}
                placeholder={f.key === 'password' ? 'Min 8 characters' : undefined}
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        {error && <p style={{ color: 'var(--locked-text)', marginBottom: 12, fontSize: 13 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '14px', background: 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Creating…' : 'Create Store & Owner Account'}
        </button>
      </form>
    </div>
  )
}
