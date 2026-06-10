import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminNav from '@/components/SuperAdminNav'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: superAdmin } = await service
    .from('super_admins')
    .select('name')
    .eq('email', user.email!)
    .maybeSingle()

  if (!superAdmin) redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <SuperAdminNav adminName={superAdmin.name} />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 80px' }}>
        {children}
      </main>
    </div>
  )
}
