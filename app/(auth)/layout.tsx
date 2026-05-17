import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LayoutShell } from '@/components/layout/LayoutShell'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Redireciona para o setup na primeira vez (enquanto setup_completo = false)
  const { data: profile } = await supabase
    .from('profiles')
    .select('setup_completo')
    .eq('id', user.id)
    .single()

  if (!profile?.setup_completo) {
    redirect('/setup')
  }

  return <LayoutShell>{children}</LayoutShell>
}
