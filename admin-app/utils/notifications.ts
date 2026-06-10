import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { supabase } from '../lib/supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  })
  const token = tokenData.data

  // Register directly via Supabase client (no custom API route needed)
  const user = (await supabase.auth.getUser()).data.user
  if (user) {
    await supabase
      .from('store_users')
      .update({ expo_push_token: token })
      .eq('id', user.id)
  }

  return token
}
