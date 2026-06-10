import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNetInfo } from '@react-native-community/netinfo'
import { getDevice, lockDevice } from '../../api/devices'
import StatusBadge from '../../components/StatusBadge'
import EmiSchedule from '../../components/EmiSchedule'
import UnlockModal from '../../components/UnlockModal'

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const netInfo = useNetInfo()
  const isOffline = !netInfo.isConnected
  const [showUnlock, setShowUnlock] = useState(false)

  const { data: device, isLoading } = useQuery({
    queryKey: ['device', id],
    queryFn: () => getDevice(id),
    enabled: !isOffline,
  })

  const lockMutation = useMutation({
    mutationFn: () => lockDevice(id, 'MANUAL'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['device', id] })
    },
    onError: () => Alert.alert('Error', 'Could not send lock command'),
  })

  if (isLoading) {
    return <View style={styles.center}><Text style={styles.muted}>Loading…</Text></View>
  }

  if (!device) {
    return <View style={styles.center}><Text>Device not found</Text></View>
  }

  const payments = device.emi_plans?.[0]?.emi_payments ?? []
  const outstanding = device.outstanding_amount ?? 0
  const isLocked = device.status === 'locked'

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={16}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.customerName}>{device.customers?.name}</Text>
          <Text style={styles.model}>{device.model}</Text>
        </View>
        <StatusBadge status={isLocked ? 'locked' : 'active'} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isLocked && (
          <View style={styles.outstandingCard}>
            <Text style={styles.outstandingLabel}>OUTSTANDING</Text>
            <Text style={styles.outstandingAmount}>₹ {outstanding.toLocaleString('en-IN')}</Text>
          </View>
        )}

        {payments.length > 0 && (
          <View style={styles.card}>
            <EmiSchedule payments={payments} />
          </View>
        )}

        <View style={styles.actions}>
          {isLocked && (
            <TouchableOpacity
              style={[styles.collectBtn, isOffline && styles.disabled]}
              onPress={() => !isOffline && setShowUnlock(true)}
              disabled={isOffline}
            >
              <Text style={styles.collectText}>
                {isOffline ? 'No connection' : 'COLLECT & UNLOCK'}
              </Text>
            </TouchableOpacity>
          )}
          {!isLocked && (
            <TouchableOpacity
              style={[styles.lockBtn, (isOffline || lockMutation.isPending) && styles.disabled]}
              onPress={() => !isOffline && lockMutation.mutate()}
              disabled={isOffline || lockMutation.isPending}
            >
              <Text style={styles.lockText}>
                {lockMutation.isPending ? 'Sending…' : 'Lock Manually'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {device.customers && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>CUSTOMER</Text>
            <Text style={styles.customerDetail}>{device.customers.name}</Text>
            <Text style={styles.muted}>{device.customers.phone}</Text>
          </View>
        )}
      </ScrollView>

      <UnlockModal
        visible={showUnlock}
        deviceId={id}
        customerName={device.customers?.name ?? ''}
        outstandingAmount={outstanding}
        onClose={() => setShowUnlock(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  back: { fontSize: 24, color: '#616161' },
  customerName: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  model: { fontSize: 13, color: '#616161' },
  scroll: { padding: 16, paddingBottom: 80 },
  outstandingCard: {
    backgroundColor: '#FFEBEE', borderRadius: 12, padding: 16,
    marginBottom: 12, alignItems: 'center',
  },
  outstandingLabel: { fontSize: 11, fontWeight: '700', color: '#D32F2F', letterSpacing: 1, marginBottom: 4 },
  outstandingAmount: { fontSize: 28, fontWeight: '700', color: '#D32F2F' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 12,
  },
  actions: { marginBottom: 12 },
  collectBtn: {
    backgroundColor: '#D32F2F', borderRadius: 8, padding: 16,
    alignItems: 'center', minHeight: 52, justifyContent: 'center',
  },
  collectText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
  lockBtn: {
    borderRadius: 8, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#D32F2F', minHeight: 48, justifyContent: 'center',
  },
  lockText: { color: '#D32F2F', fontWeight: '500', fontSize: 14 },
  disabled: { opacity: 0.5 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#616161', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  customerDetail: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  muted: { fontSize: 14, color: '#616161', marginTop: 2 },
})
