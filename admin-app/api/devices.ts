import client from './client'

export const getDevices = () =>
  client.get('/api/devices').then(r => r.data)

export const getDevice = (id: string) =>
  client.get(`/api/devices/${id}`).then(r => r.data)

export const lockDevice = (id: string, reason: string) =>
  client.post(`/api/devices/${id}/lock`, { reason }).then(r => r.data)

export const unlockDevice = (id: string, amount_paid: number, payment_method: string) =>
  client.post(`/api/devices/${id}/unlock`, { amount_paid, payment_method }).then(r => r.data)

export const registerDevice = (body: Record<string, unknown>) =>
  client.post('/api/devices', body).then(r => r.data)
