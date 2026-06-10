import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface AuthUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'manager' | 'employee'
  store_id: string
  store_name: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => Promise<void>
}

async function fetchStoreUser(email: string): Promise<AuthUser | null> {
  const { data } = await supabase
    .from('store_users')
    .select('id, name, role, store_id, email, stores(name)')
    .eq('email', email)
    .single()
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    role: data.role,
    store_id: data.store_id,
    email: data.email,
    store_name: (data.stores as { name: string } | null)?.name ?? '',
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  loadFromStorage: async () => {
    try {
      // Supabase client restores the session automatically via SecureStore adapter
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const storeUser = await fetchStoreUser(session.user.email!)
        set({
          user: storeUser
            ? { ...storeUser, email: session.user.email! }
            : null,
          isLoading: false,
        })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)

    const storeUser = await fetchStoreUser(data.user.email!)
    if (!storeUser) throw new Error('Account not linked to a store. Contact your store owner.')

    set({ user: { ...storeUser, email: data.user.email! } })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
