import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SetupWizard } from '@/components/setup/SetupWizard'
import { getMesReferencia } from '@/lib/engine'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Se o usuário já tem dados salvos, o setup foi concluído — redireciona para o dashboard
  const mes = getMesReferencia()
  const { data: receitas } = await supabase
    .from('receitas')
    .select('id')
    .eq('user_id', user.id)
    .eq('mes_referencia', mes)
    .limit(1)

  if (receitas && receitas.length > 0) {
    redirect('/dashboard')
  }

  return <SetupWizard />
}
