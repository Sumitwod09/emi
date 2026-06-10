import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const service = createServiceClient()

  // Super admins have no store_users row — send them to their own panel
  const { data: superAdmin } = await service
    .from('super_admins')
    .select('id')
    .eq('email', user.email!)
    .maybeSingle()
  if (superAdmin) redirect('/admin')

  const { data: storeUser } = await service
    .from('store_users')
    .select('name, role, store_id, stores(name)')
    .eq('email', user.email!)
    .single()

  const storeName = (storeUser as { stores?: { name: string } } | null)?.stores?.name ?? 'My Store'
  const userName = storeUser?.name ?? user.email ?? ''
  const isOwner = storeUser?.role === 'owner'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <NavBar storeName={storeName} userName={userName} isOwner={isOwner} />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 80px' }}>
        {children}
      </main>
    </div>
  )
}
