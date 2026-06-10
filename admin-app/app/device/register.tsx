import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registerDevice } from '../../api/devices'

export default function RegisterDeviceScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    imei: '', model: '',
    customer_name: '', customer_phone: '', customer_aadhaar_last4: '',
    total_amount: '', down_payment: '0', emi_amount: '',
    tenure_months: '', grace_period_days: '3',
    start_date: new Date().toISOString().split('T')[0],
  })

  const mutation = useMutation({
    mutationFn: () => registerDevice({
      ...form,
      total_amount: Number(form.total_amount),
      down_payment: Number(form.down_payment ?? 0),
      emi_amount: Number(form.emi_amount),
      tenure_months: Number(form.tenure_months),
      grace_period_days: Number(form.grace_period_days ?? 3),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      router.replace('/(tabs)')
    },
    onError: (err: Error & { response?: { data?: { error?: string } } }) => {
      Alert.alert('Error', err.response?.data?.error ?? 'Registration failed')
    },
  })

  function set(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const InputField = ({
    label, value, onChange, placeholder, keyboardType = 'default', required = false
  }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; keyboardType?: 'default' | 'numeric' | 'phone-pad';
    required?: boolean
  }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required && <Text style={styles.req}> *</Text>}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={16}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Register Device</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEVICE</Text>
          <InputField label="IMEI Number" value={form.imei} onChange={v => set('imei', v)} placeholder="15-digit IMEI" required />
          <InputField label="Phone Model" value={form.model} onChange={v => set('model', v)} placeholder="e.g. Samsung A15" required />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOMER</Text>
          <InputField label="Full Name" value={form.customer_name} onChange={v => set('customer_name', v)} required />
          <InputField label="Phone Number" value={form.customer_phone} onChange={v => set('customer_phone', v)} keyboardType="phone-pad" required />
          <InputField label="Aadhaar Last 4 (optional)" value={form.customer_aadhaar_last4} onChange={v => set('customer_aadhaar_last4', v)} placeholder="####" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EMI PLAN</Text>
          <InputField label="Total Price (₹)" value={form.total_amount} onChange={v => set('total_amount', v)} keyboardType="numeric" required />
          <InputField label="Down Payment (₹)" value={form.down_payment} onChange={v => set('down_payment', v)} keyboardType="numeric" placeholder="0" />
          <InputField label="Monthly EMI (₹)" value={form.emi_amount} onChange={v => set('emi_amount', v)} keyboardType="numeric" required />
          <InputField label="Tenure (months)" value={form.tenure_months} onChange={v => set('tenure_months', v)} keyboardType="numeric" required />
          <InputField label="Start Date (YYYY-MM-DD)" value={form.start_date} onChange={v => set('start_date', v)} required />
          <InputField label="Grace Period (days)" value={form.grace_period_days} onChange={v => set('grace_period_days', v)} keyboardType="numeric" placeholder="3" />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, mutation.isPending && styles.disabled]}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          <Text style={styles.submitText}>
            {mutation.isPending ? 'Registering…' : 'Register Device'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  back: { fontSize: 24, color: '#616161' },
  title: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  scroll: { padding: 16, paddingBottom: 80 },
  section: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#616161',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },
  field: { marginBottom: 14 },
  label: { fontSize: 12, color: '#616161', marginBottom: 5 },
  req: { color: '#D32F2F' },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6,
    padding: 10, fontSize: 14, backgroundColor: '#fff',
  },
  submitBtn: {
    backgroundColor: '#D32F2F', borderRadius: 8, padding: 16,
    alignItems: 'center', minHeight: 52, justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
