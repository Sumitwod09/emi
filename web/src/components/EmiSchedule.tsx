import type { EmiPayment } from '@/types'

const STATUS_ICON: Record<string, string> = {
  paid: '✅',
  missed: '❌',
  pending: '⏳',
}

export default function EmiSchedule({ payments }: { payments: EmiPayment[] }) {
  const sorted = [...payments].sort((a, b) => a.due_date.localeCompare(b.due_date))

  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, color: 'var(--text-secondary)' }}>
        EMI Schedule
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((p) => {
          const date = new Date(p.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
          return (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
              <span>{STATUS_ICON[p.status] ?? '⏳'} {date}</span>
              <span style={{ fontWeight: p.status === 'missed' ? 700 : 400 }}>
                ₹{Number(p.amount_due).toLocaleString('en-IN')}
              </span>
              <span style={{
                fontSize: 12,
                color: p.status === 'missed' ? 'var(--locked-text)' : p.status === 'paid' ? 'var(--active-text)' : 'var(--text-secondary)',
                textTransform: 'capitalize',
              }}>
                {p.status}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
