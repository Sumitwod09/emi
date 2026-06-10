import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native'
import { unlockDevice } from '../api/devices'
import { useQueryClient } from '@tanstack/react-query'

interface Props {
  visible: boolean
  deviceId: string
  customerName: string
  outstandingAmount: number
  onClose: () => void
}

const METHODS = ['Cash', 'UPI', 'Card'] as const
type PaymentMethod = typeof METHODS[number]

export default function UnlockModal({ visible, deviceId, customerName, outstandingAmount, onClose }: Props) {
  const queryClient = useQueryClient()
  const [method, setMethod] = useState<PaymentMethod>('Cash')
  const [amount, setAmount] = useState(String(outstandingAmount))
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Enter a valid amount')
      return
    }
    setLoading(true)
    try {
      await unlockDevice(deviceId, numAmount, method.toLowerCase())
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['device', deviceId] })
      onClose()
    } catch {
      Alert.alert('Error', 'Could not send unlock command. Check connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Collect Payment</Text>
          <Text style={styles.subtitle}>Customer: {customerName}</Text>
          <Text style={styles.subtitle}>Amount due: ₹{outstandingAmount.toLocaleString('en-IN')}</Text>

          <View style={styles.methodRow}>
            {METHODS.map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setMethod(m)}
                style={[styles.methodBtn, method === m && styles.methodBtnActive]}
              >
                <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Amount collected</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.confirmBtn, loading && styles.disabled]}
            onPress={handleConfirm}
            disabled={loading}
          >
            <Text style={styles.confirmText}>
              {loading ? 'Sending…' : 'CONFIRM & UNLOCK'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#616161', marginBottom: 2 },
  methodRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 4 },
  methodBtn: {
    flex: 1, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  methodBtnActive: { borderColor: '#D32F2F', backgroundColor: '#FFEBEE' },
  methodText: { fontSize: 13, color: '#616161' },
  methodTextActive: { color: '#D32F2F', fontWeight: '600' },
  label: { fontSize: 12, color: '#616161', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6,
    padding: 12, fontSize: 20, fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: '#D32F2F', borderRadius: 8, padding: 16,
    alignItems: 'center', marginTop: 20, minHeight: 52, justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
})
