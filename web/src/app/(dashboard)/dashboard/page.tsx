'use client'

import { useEffect, useState, useCallback } from 'react'
import DeviceCard from '@/components/DeviceCard'
import UnlockModal from '@/components/UnlockModal'
import type { DeviceWithDetails } from '@/types'

export default function DashboardPage() {
  const [devices, setDevices] = useState<DeviceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unlockTarget, setUnlockTarget] = useState<DeviceWithDetails | null>(null)

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/devices')
      if (!res.ok) throw new Error('Failed to load')
      setDevices(await res.json())
      setError('')
    } catch {
      setError('Failed to load devices. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  const locked = devices.filter(d => d.status === 'locked')
  const active = devices.filter(d => d.status !== 'locked')

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading…</div>
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: 'var(--locked-text)' }}>{error}</p>
        <button onClick={fetchDevices} style={{ marginTop: 12, padding: '8px 16px', cursor: 'pointer' }}>Retry</button>
      </div>
    )
  }

  return (
    <div>
      {locked.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--locked-text)', marginBottom: 10 }}>
            LOCKED ({locked.length})
          </h2>
          {locked.map(d => (
            <DeviceCard
              key={d.id}
              device={d}
              onUnlockClick={() => setUnlockTarget(d)}
            />
          ))}
        </section>
      )}

      <section>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--active-text)', marginBottom: 10 }}>
          ACTIVE ({active.length})
        </h2>
        {active.length === 0 && locked.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32 }}>
            No devices registered yet. Tap <strong>+ Add Device</strong> to get started.
          </p>
        )}
        {active.map(d => <DeviceCard key={d.id} device={d} />)}
      </section>

      {locked.length === 0 && active.length > 0 && (
        <p style={{ textAlign: 'center', color: 'var(--active-text)', marginTop: 16, fontSize: 14 }}>
          No locked devices right now
        </p>
      )}

      {unlockTarget && (
        <UnlockModal
          deviceId={unlockTarget.id}
          customerName={unlockTarget.customers?.name ?? ''}
          outstandingAmount={unlockTarget.outstanding_amount ?? 0}
          onClose={() => setUnlockTarget(null)}
          onSuccess={() => {
            setUnlockTarget(null)
            fetchDevices()
          }}
        />
      )}
    </div>
  )
}
