import crypto from 'crypto'

export function signCommand(payload: {
  action: string
  device_id: string
  timestamp: string
}, secret: string): string {
  const data = `${payload.action}|${payload.device_id}|${payload.timestamp}`
  return crypto.createHmac('sha256', secret).update(data).digest('base64')
}

export function generateDeviceSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashImei(imei: string): string {
  return crypto.createHash('sha256').update(imei).digest('hex')
}
