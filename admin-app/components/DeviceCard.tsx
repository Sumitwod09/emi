import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import StatusBadge from './StatusBadge'

interface Props {
  device: {
    id: string
    status: string
    model: string
    customers?: { name: string }
    outstanding_amount?: number
    next_due_date?: string | null
    next_due_days?: number | null
    lock_events?: Array<{ locked_at: string }>
  }
  isOffline?: boolean
  onUnlockPress?: () => void
}

export default function DeviceCard({ device, isOffline, onUnlockPress }: Props) {
  const router = useRouter()
  const isLocked = device.status === 'locked'
  const isDueSoon = !isLocked && (device.next_due_days ?? 999) <= 3

  const subtitle = isLocked
    ? `₹${(device.outstanding_amount ?? 0).toLocaleString('en-IN')} due`
    : device.next_due_date
      ? `Next: ${new Date(device.next_due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : 'All paid'

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{device.customers?.name ?? '—'}</Text>
          <Text style={styles.model}>{device.model} · {subtitle}</Text>
          {isLocked && device.lock_events?.[0]?.locked_at && (
            <Text style={styles.lockedSince}>
              Missed: {new Date(device.lock_events[0].locked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          )}
        </View>
        <StatusBadge status={isLocked ? 'locked' : isDueSoon ? 'due_soon' : 'active'} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => router.push(`/device/${device.id}`)}
        >
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
        {isLocked && (
          <TouchableOpacity
            style={[styles.unlockBtn, isOffline && styles.disabledBtn]}
            onPress={isOffline ? undefined : (onUnlockPress ?? (() => router.push(`/device/${device.id}`)))}
            disabled={isOffline}
          >
            <Text style={styles.unlockBtnText}>
              {isOffline ? 'No connection' : 'Unlock'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  info: { flex: 1, paddingRight: 8 },
  name: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 3 },
  model: { fontSize: 14, color: '#616161' },
  lockedSince: { fontSize: 12, color: '#D32F2F', marginTop: 2 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  viewBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6,
    borderWidth: 1, borderColor: '#E0E0E0',
    minHeight: 48, justifyContent: 'center',
  },
  viewBtnText: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  unlockBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6,
    backgroundColor: '#D32F2F', minHeight: 48, justifyContent: 'center',
  },
  disabledBtn: { backgroundColor: '#9E9E9E' },
  unlockBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
})
