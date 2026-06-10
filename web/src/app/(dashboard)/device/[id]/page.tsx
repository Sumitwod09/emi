'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import EmiSchedule from '@/components/EmiSchedule'
import UnlockModal from '@/components/UnlockModal'
import type { DeviceWithDetails } from '@/types'

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [device, setDevice] = useState<DeviceWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUnlock, setShowUnlock] = useState(false)
  const [locking, setLocking] = useState(false)
  const [error, setError] = useState('')

  const fetchDevice = useCallback(async () => {
    try {
      const res = await fetch(`/api/devices/${id}`)
      if (!res.ok) throw new Error('Not found')
      setDevice(await res.json())
      setError('')
    } catch {
      setError('Device not found')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchDevice() }, [fetchDevice])

  async function handleLock() {
    setLocking(true)
    try {
      await fetch(`/api/devices/${id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'MANUAL' }),
      })
      fetchDevice()
    } finally {
      setLocking(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
  if (error || !device) return <div style={{ padding: 40, textAlign: 'center' }}>{error || 'Device not found'}</div>

  const payments = device.emi_plans?.[0]?.emi_payments ?? []
  const outstanding = device.outstanding_amount ?? 0
  const isLocked = device.status === 'locked'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{device.customers?.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{device.model}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StatusBadge status={isLocked ? 'locked' : 'active'} />
        </div>
      </div>

      {isLocked && outstanding > 0 && (
        <div style={{
          background: 'var(--locked-bg)', border: '1px solid var(--locked-text)',
          borderRadius: 8, padding: 16, marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--locked-text)' }}>Outstanding</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--locked-text)' }}>
            ₹{outstanding.toLocaleString('en-IN')}
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <EmiSchedule payments={payments} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {isLocked && (
          <button
            onClick={() => setShowUnlock(true)}
            style={{
              padding: '14px', background: 'var(--primary)', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Collect & Unlock
          </button>
        )}
        {!isLocked && (
          <button
            onClick={handleLock}
            disabled={locking}
            style={{
              padding: '12px', background: 'none', border: '1px solid var(--locked-text)',
              borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
              color: 'var(--locked-text)', opacity: locking ? 0.6 : 1,
            }}
          >
            {locking ? 'Sending lock…' : 'Lock Manually'}
          </button>
        )}
      </div>

      {device.customers && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 10 }}>
            Customer
          </div>
          <div style={{ fontSize: 15 }}>{device.customers.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{device.customers.phone}</div>
        </div>
      )}

      {showUnlock && (
        <UnlockModal
          deviceId={id}
          customerName={device.customers?.name ?? ''}
          outstandingAmount={outstanding}
          onClose={() => setShowUnlock(false)}
          onSuccess={() => { setShowUnlock(false); fetchDevice() }}
        />
      )}
    </div>
  )
}
