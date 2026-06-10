'use client'

import Link from 'next/link'
import StatusBadge from './StatusBadge'
import type { DeviceWithDetails } from '@/types'

interface Props {
  device: DeviceWithDetails
  onUnlockClick?: () => void
}

export default function DeviceCard({ device, onUnlockClick }: Props) {
  const isLocked = device.status === 'locked'
  const isDueSoon = !isLocked && (device.next_due_days ?? 999) <= 3

  const badgeStatus = isLocked ? 'locked' : isDueSoon ? 'due_soon' : 'active'

  const subtitle = isLocked
    ? `₹${(device.outstanding_amount ?? 0).toLocaleString('en-IN')} due`
    : device.next_due_date
      ? `Next: ${new Date(device.next_due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : 'All paid'

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: 16, marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
            {device.customers?.name}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {device.model} · {subtitle}
          </div>
          {isLocked && (
            <div style={{ color: 'var(--locked-text)', fontSize: 12, marginTop: 2 }}>
              Locked since{' '}
              {device.lock_events?.[0]?.locked_at
                ? new Date(device.lock_events[0].locked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : '—'}
            </div>
          )}
        </div>
        <StatusBadge status={badgeStatus} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <Link
          href={`/dashboard/device/${device.id}`}
          style={{
            padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 6,
            textDecoration: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
          }}
        >
          View
        </Link>
        {isLocked && onUnlockClick && (
          <button
            onClick={onUnlockClick}
            style={{
              padding: '8px 16px', background: 'var(--primary)', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Unlock
          </button>
        )}
      </div>
    </div>
  )
}
