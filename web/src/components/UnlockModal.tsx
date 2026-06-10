'use client'

import { useState } from 'react'

interface Props {
  deviceId: string
  customerName: string
  outstandingAmount: number
  onClose: () => void
  onSuccess: () => void
}

const METHODS = ['Cash', 'UPI', 'Card'] as const
type PaymentMethod = typeof METHODS[number]

export default function UnlockModal({ deviceId, customerName, outstandingAmount, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('Cash')
  const [amount, setAmount] = useState(String(outstandingAmount))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid amount')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/devices/${deviceId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_paid: Number(amount), payment_method: method.toLowerCase() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to unlock. Try again.')
        return
      }
      onSuccess()
    } catch {
      setError('Could not connect. Check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 12, padding: 24,
          width: '100%', maxWidth: 360,
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Unlock Device</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
          Customer: {customerName} · Amount due: ₹{outstandingAmount.toLocaleString('en-IN')}
        </p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Payment Method</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {METHODS.map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid',
                  borderColor: method === m ? 'var(--primary)' : 'var(--border)',
                  background: method === m ? 'var(--locked-bg)' : 'var(--surface)',
                  color: method === m ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: method === m ? 600 : 400, fontSize: 13, cursor: 'pointer',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Amount Collected (₹)</div>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
              borderRadius: 6, fontSize: 16, fontWeight: 600,
            }}
          />
        </div>

        {error && <p style={{ color: 'var(--locked-text)', marginBottom: 12, fontSize: 13 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', border: '1px solid var(--border)',
              borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 2, padding: '12px', background: 'var(--primary)', color: '#fff',
              border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Sending…' : 'Confirm Unlock'}
          </button>
        </div>
      </div>
    </div>
  )
}
