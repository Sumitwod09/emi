import { View, Text, StyleSheet } from 'react-native'

interface Payment {
  id: string
  due_date: string
  amount_due: number
  status: 'pending' | 'paid' | 'missed'
}

const ICON: Record<string, string> = { paid: '✅', missed: '❌', pending: '⏳' }
const COLOR: Record<string, string> = {
  paid: '#2E7D32', missed: '#D32F2F', pending: '#616161',
}

export default function EmiSchedule({ payments }: { payments: Payment[] }) {
  const sorted = [...payments].sort((a, b) => a.due_date.localeCompare(b.due_date))
  return (
    <View>
      <Text style={styles.heading}>EMI SCHEDULE</Text>
      {sorted.map(p => (
        <View key={p.id} style={styles.row}>
          <Text style={styles.icon}>{ICON[p.status] ?? '⏳'}</Text>
          <Text style={styles.date}>
            {new Date(p.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
          <Text style={[styles.amount, p.status === 'missed' && styles.missedAmount]}>
            ₹{Number(p.amount_due).toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.status, { color: COLOR[p.status] }]}>
            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#616161', textTransform: 'uppercase', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { fontSize: 14, marginRight: 8 },
  date: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  amount: { fontSize: 14, fontWeight: '500', marginRight: 8 },
  missedAmount: { fontWeight: '700', color: '#D32F2F' },
  status: { fontSize: 12, textTransform: 'capitalize', width: 55, textAlign: 'right' },
})
