import { View, Text, StyleSheet } from 'react-native'

type Status = 'locked' | 'active' | 'due_soon'

const BADGE: Record<Status, { bg: string; color: string; label: string }> = {
  locked:   { bg: '#FFEBEE', color: '#D32F2F', label: 'LOCKED' },
  active:   { bg: '#E8F5E9', color: '#2E7D32', label: 'ACTIVE' },
  due_soon: { bg: '#FFF8E1', color: '#F57C00', label: 'DUE SOON' },
}

export default function StatusBadge({ status }: { status: Status }) {
  const b = BADGE[status] ?? BADGE.active
  return (
    <View style={[styles.badge, { backgroundColor: b.bg, borderColor: b.color }]}>
      <Text style={[styles.text, { color: b.color }]}>{b.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 4, borderWidth: 1, alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
})
