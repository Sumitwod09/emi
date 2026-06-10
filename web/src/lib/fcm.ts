// v2.0: No Firebase. Lock/unlock delivered via Supabase Realtime row updates.
// The Android app subscribes to its device row; status + lock_payload changes trigger lock/unlock.

import { signCommand } from './hmac'

interface StoreInfo {
  name: string
  phone: string
  address: string | null
}

export async function lockDevice(
  deviceId: string,
  hmacSecret: string,
  store: StoreInfo,
  dueAmount: number
): Promise<void> {
  const { createServiceClient } = await import('./supabase/server')
  const supabase = createServiceClient()

  const timestamp = new Date().toISOString()
  const lockPayload = {
    action: 'LOCK',
    device_id: deviceId,
    due_amount: dueAmount.toFixed(2),
    store_name: store.name,
    store_phone: store.phone ?? '',
    store_address: store.address ?? '',
    timestamp,
    hmac_signature: signCommand({ action: 'LOCK', device_id: deviceId, timestamp }, hmacSecret),
  }

  await supabase
    .from('devices')
    .update({ status: 'locked', lock_payload: lockPayload, updated_at: timestamp })
    .eq('id', deviceId)
}

export async function unlockDevice(
  deviceId: string,
  hmacSecret: string,
  paymentRef: string
): Promise<void> {
  const { createServiceClient } = await import('./supabase/server')
  const supabase = createServiceClient()

  const timestamp = new Date().toISOString()
  const unlockPayload = {
    action: 'UNLOCK',
    device_id: deviceId,
    payment_ref: paymentRef,
    timestamp,
    hmac_signature: signCommand({ action: 'UNLOCK', device_id: deviceId, timestamp }, hmacSecret),
  }

  await supabase
    .from('devices')
    .update({ status: 'active', lock_payload: unlockPayload, updated_at: timestamp })
    .eq('id', deviceId)
}

export async function notifyStoreUsers(
  storeId: string,
  deviceInfo: { id: string; customer_name: string; model: string; due_amount: number },
  overrides?: { title?: string; body?: string }
): Promise<void> {
  const { createServiceClient } = await import('./supabase/server')
  const supabase = createServiceClient()

  const { data: users } = await supabase
    .from('store_users')
    .select('expo_push_token')
    .eq('store_id', storeId)
    .not('expo_push_token', 'is', null)

  if (!users?.length) return

  const title = overrides?.title ?? '🔴 Device Locked'
  const body = overrides?.body ??
    `${deviceInfo.customer_name}'s ${deviceInfo.model} locked. ₹${deviceInfo.due_amount} due.`

  const messages = users.map((u: { expo_push_token: string }) => ({
    to: u.expo_push_token,
    title,
    body,
    data: { device_id: deviceInfo.id },
    sound: 'default',
  }))

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    })
  } catch (err) {
    console.error('Expo push error:', err)
  }
}
