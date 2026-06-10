import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: superAdmin } = await service
    .from('super_admins')
    .select('id')
    .eq('email', user.email!)
    .maybeSingle()

  if (superAdmin) redirect('/admin')

  redirect('/dashboard')
}
