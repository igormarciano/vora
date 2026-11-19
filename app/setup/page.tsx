import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Onboarding } from '@/components/onboarding/Onboarding'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('nome, setup_completo').eq('id', user.id).maybeSingle()

  // Quem já montou o mês vai direto para o painel. (Só olha setup_completo: o layout
  // autenticado manda para cá quando ele é false, então checar outra coisa criaria loop.)
  if (profile?.setup_completo) redirect('/dashboard')

  const nome = profile?.nome || (user.user_metadata?.nome as string | undefined) || (user.user_metadata?.full_name as string | undefined) || null
  return <Onboarding nome={nome} />
}
