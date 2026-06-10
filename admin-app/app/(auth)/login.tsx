import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useAuthStore } from '../../store/authStore'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      Alert.alert('Login Failed', 'Incorrect email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>EMI Manager</Text>
        <Text style={styles.subtitle}>Sign in to your store account</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="owner@store.com"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#E0E0E0' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4, color: '#1A1A1A' },
  subtitle: { fontSize: 14, color: '#616161', marginBottom: 24 },
  label: { fontSize: 12, color: '#616161', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6,
    padding: 12, fontSize: 15, backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#D32F2F', borderRadius: 6, padding: 14,
    alignItems: 'center', marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
})
