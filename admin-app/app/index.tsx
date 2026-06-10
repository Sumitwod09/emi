import { View, ActivityIndicator } from 'react-native'

// Blank loading screen shown while AuthGuard in _layout.tsx decides where to redirect
export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
      <ActivityIndicator size="large" color="#D32F2F" />
    </View>
  )
}
