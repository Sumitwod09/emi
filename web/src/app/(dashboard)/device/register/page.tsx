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
  { name: 'imei',                  label: 'IMEI Number',       required: true, placeholder: '15-digit IMEI' },
  { name: 'model',                 label: 'Phone Model',        required: true, placeholder: 'e.g. Samsung Galaxy A15' },
  { name: 'customer_name',         label: 'Customer Name',      required: true },
  { name: 'customer_phone',        label: 'Customer Phone',     required: true, type: 'tel' },
  { name: 'customer_aadhaar_last4',label: 'Aadhaar Last 4 (optional)', type: 'text', placeholder: '####' },
  { name: 'total_amount',          label: 'Total Price (₹)',    required: true, type: 'number' },
  { name: 'down_payment',          label: 'Down Payment (₹)',   type: 'number', placeholder: '0' },
  { name: 'emi_amount',            label: 'Monthly EMI (₹)',    required: true, type: 'number' },
  { name: 'tenure_months',         label: 'Tenure (months)',    required: true, type: 'number' },
  { name: 'start_date',            label: 'EMI Start Date',     required: true, type: 'date' },
  { name: 'grace_period_days',     label: 'Grace Period (days)', type: 'number', placeholder: '3' },
]

export default function RegisterDevicePage() {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string>>({
    down_payment: '0',
    grace_period_days: '3',
    start_date: new Date().toISOString().split('T')[0],
  })
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
      const body = {
        ...form,
        total_amount: Number(form.total_amount),
        down_payment: Number(form.down_payment ?? 0),
        emi_amount: Number(form.emi_amount),
        tenure_months: Number(form.tenure_months),
        grace_period_days: Number(form.grace_period_days ?? 3),
      }
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Registration failed')
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Could not connect. Check your internet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Register New Device</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Device & Customer
          </div>
          {FIELDS.map(field => (
            <div key={field.name} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
                {field.label} {field.required && <span style={{ color: 'var(--locked-text)' }}>*</span>}
              </label>
              <input
                type={field.type ?? 'text'}
                value={form[field.name] ?? ''}
                onChange={e => handleChange(field.name, e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
                  borderRadius: 6, fontSize: 14,
                }}
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
            border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Registering…' : 'Register Device'}
        </button>
      </form>
    </div>
  )
}
