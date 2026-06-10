import { create } from 'zustand'

interface CachedDevice {
  id: string
  status: string
  customers?: { name: string }
  model: string
  outstanding_amount?: number
  next_due_days?: number | null
}

interface DeviceStoreState {
  cachedDevices: CachedDevice[]
  cachedAt: number | null
  setCache: (devices: CachedDevice[]) => void
  clearCache: () => void
}

export const useDeviceStore = create<DeviceStoreState>((set) => ({
  cachedDevices: [],
  cachedAt: null,
  setCache: (devices) => set({ cachedDevices: devices, cachedAt: Date.now() }),
  clearCache: () => set({ cachedDevices: [], cachedAt: null }),
}))
