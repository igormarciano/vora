import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConfiguracoesClient } from '@/components/configuracoes/ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: customCategories } = await supabase
    .from('custom_categories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <ConfiguracoesClient profile={profile} customCategories={customCategories ?? []} />
}
