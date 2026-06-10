'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Field {
  name: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
}

const FIELDS: Field[] = [
  { name: 'store_name',    label: 'Store Name',         required: true, placeholder: 'e.g. Sharma Mobile Store' },
  { name: 'store_phone',   label: 'Store Phone',         required: true, type: 'tel', placeholder: '10-digit mobile number' },
  { name: 'store_address', label: 'Store Address',       placeholder: 'Full address (optional)' },
  { name: 'owner_name',    label: 'Your Name',           required: true },
  { name: 'email',         label: 'Email',               required: true, type: 'email' },
  { name: 'password',      label: 'Password (min 8 chars)', required: true, type: 'password', placeholder: '••••••••' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(name: string, value: string) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Registration failed')
        return
      }
      router.push('/login?registered=1')
    } catch {
      setError('Could not connect. Check your internet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '32px 24px', width: '100%', maxWidth: 400,
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Create Store Account</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Register your store to start managing EMI devices
      </p>

      <form onSubmit={handleSubmit}>
        {FIELDS.map(field => (
          <div key={field.name} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              {field.label}{field.required && <span style={{ color: 'var(--locked-text)' }}> *</span>}
            </label>
            <input
              type={field.type ?? 'text'}
              value={form[field.name] ?? ''}
              onChange={e => handleChange(field.name, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
                borderRadius: 6, fontSize: 14, outline: 'none',
              }}
            />
          </div>
        ))}

        {error && (
          <p style={{ color: 'var(--locked-text)', marginBottom: 16, fontSize: 13 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '12px', background: 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            marginTop: 8,
          }}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}
