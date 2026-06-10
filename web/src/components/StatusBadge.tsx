type Status = 'locked' | 'active' | 'due_soon' | 'deregistered'

const BADGE_STYLES: Record<Status, { bg: string; color: string; label: string }> = {
  locked:       { bg: 'var(--locked-bg)',   color: 'var(--locked-text)',   label: 'LOCKED' },
  active:       { bg: 'var(--active-bg)',   color: 'var(--active-text)',   label: 'ACTIVE' },
  due_soon:     { bg: 'var(--due-bg)',      color: 'var(--due-text)',      label: 'DUE SOON' },
  deregistered: { bg: 'var(--inactive-bg)', color: 'var(--inactive-text)', label: 'INACTIVE' },
}

export default function StatusBadge({ status }: { status: Status }) {
  const s = BADGE_STYLES[status] ?? BADGE_STYLES.active
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.color}`,
      padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.05em', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}
