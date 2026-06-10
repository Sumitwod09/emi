import { useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useNetInfo } from '@react-native-community/netinfo'
import { getDevices } from '../../api/devices'
import { useAuthStore } from '../../store/authStore'
import { useDeviceStore } from '../../store/deviceStore'
import { useDeviceRealtime } from '../../hooks/useDeviceRealtime'
import DeviceCard from '../../components/DeviceCard'

export default function DevicesScreen() {
  const router = useRouter()
  const netInfo = useNetInfo()
  const isOffline = !netInfo.isConnected
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'locked' | 'active'>('all')
  const { setCache, cachedDevices } = useDeviceStore()
  const storeId = useAuthStore(s => s.user?.store_id)

  // Live status updates via Supabase Realtime
  useDeviceRealtime(storeId)

  const { data: devices = [], isFetching, refetch } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const data = await getDevices()
      setCache(data)
      return data
    },
    refetchInterval: 30_000,
    enabled: !isOffline,
    placeholderData: cachedDevices,
  })

  const filtered = devices
    .filter((d: { status: string }) => filter === 'all' || d.status === filter)
    .filter((d: { customers?: { name: string }; model: string }) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        d.customers?.name.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q)
      )
    })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Devices</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/device/register')}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name or model…"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'locked', 'active'] as const).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: { id: string }) => item.id}
        renderItem={({ item }) => <DeviceCard device={item} isOffline={isOffline} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={<Text style={styles.empty}>No devices found</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  addBtn: { backgroundColor: '#D32F2F', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  searchRow: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6,
    padding: 10, fontSize: 14, backgroundColor: '#fff',
  },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4, gap: 8 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#fff',
  },
  filterBtnActive: { backgroundColor: '#FFEBEE', borderColor: '#D32F2F' },
  filterBtnText: { fontSize: 13, color: '#616161' },
  filterBtnTextActive: { color: '#D32F2F', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9E9E9E', marginTop: 40, fontSize: 14 },
})
