import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useDeviceRealtime(storeId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!storeId) return

    const channel = supabase
      .channel(`store-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['devices'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, queryClient])
}
