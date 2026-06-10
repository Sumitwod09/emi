import client from './client'

export const getEmiSchedule = (device_id: string) =>
  client.get(`/api/emi/${device_id}/schedule`).then(r => r.data)

export const recordPayment = (device_id: string, amount: number, method: string) =>
  client.post('/api/emi/payment', { device_id, amount, method }).then(r => r.data)
