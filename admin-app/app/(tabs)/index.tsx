import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useNetInfo } from '@react-native-community/netinfo'
import { getDevices } from '../../api/devices'
import { useAuthStore } from '../../store/authStore'
import { useDeviceStore } from '../../store/deviceStore'
import { useDeviceRealtime } from '../../hooks/useDeviceRealtime'
import DeviceCard from '../../components/DeviceCard'

export default function HomeScreen() {
  const netInfo = useNetInfo()
  const isOffline = !netInfo.isConnected
  const { setCache, cachedDevices, cachedAt } = useDeviceStore()
  const storeId = useAuthStore(s => s.user?.store_id)

  // Live status updates via Supabase Realtime
  useDeviceRealtime(storeId)

  const { data: devices = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const data = await getDevices()
      setCache(data)
      return data
    },
    refetchInterval: 30_000,
    staleTime: 60_000,
    enabled: !isOffline,
    placeholderData: cachedDevices,
  })

  const now = new Date()
  const dayName = now.toLocaleDateString('en-IN', { weekday: 'long' })
  const dateStr = `${now.getDate()} ${now.toLocaleDateString('en-IN', { month: 'short' })} ${now.getFullYear()}`

  const locked = devices.filter((d: { status: string }) => d.status === 'locked')
  const dueSoon = devices.filter(
    (d: { status: string; next_due_days?: number | null }) =>
      d.status !== 'locked' && (d.next_due_days ?? 999) <= 3
  )

  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Offline — data from {cachedAt ? new Date(cachedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'cache'}
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        <Text style={styles.greeting}>Good morning!</Text>
        <Text style={styles.date}>{dayName}, {dateStr}</Text>

        {isLoading && !cachedDevices.length ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : (
          <>
            <Text style={styles.sectionHeader}>LOCKED TODAY ({locked.length})</Text>
            {locked.length === 0
              ? <Text style={styles.empty}>No locked devices right now</Text>
              : locked.map((d: { id: string }) => (
                  <DeviceCard key={d.id} device={d} isOffline={isOffline} />
                ))
            }

            {dueSoon.length > 0 && (
              <>
                <Text style={[styles.sectionHeader, { color: '#F57C00' }]}>
                  DUE THIS WEEK ({dueSoon.length})
                </Text>
                {dueSoon.map((d: { id: string }) => (
                  <DeviceCard key={d.id} device={d} isOffline={isOffline} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  offlineBanner: { backgroundColor: '#FFF8E1', padding: 8, alignItems: 'center' },
  offlineText: { fontSize: 12, color: '#F57C00' },
  scroll: { padding: 16, paddingBottom: 80 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  date: { fontSize: 14, color: '#616161', marginBottom: 20 },
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: '#D32F2F',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 8,
  },
  empty: { fontSize: 14, color: '#9E9E9E', marginVertical: 8 },
})
