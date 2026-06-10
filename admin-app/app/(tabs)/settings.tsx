import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useAuthStore } from '../../store/authStore'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Store Owner',
  manager: 'Manager',
  employee: 'Employee',
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore()

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Store</Text>
          <Text style={styles.value}>{user?.store_name || '—'}</Text>
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name || '—'}</Text>
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || '—'}</Text>
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <Text style={styles.label}>Role</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{ROLE_LABELS[user?.role ?? 'employee']}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 20, marginTop: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 16, overflow: 'hidden',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  label: { fontSize: 13, color: '#616161' },
  value: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  roleBadge: {
    backgroundColor: '#FFF3E0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3,
  },
  roleBadgeText: { fontSize: 13, fontWeight: '600', color: '#E65100' },
  logoutBtn: {
    backgroundColor: '#fff', borderRadius: 8, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#D32F2F',
  },
  logoutText: { color: '#D32F2F', fontWeight: '600', fontSize: 15 },
})
