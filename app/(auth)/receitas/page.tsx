import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMesReferencia } from '@/lib/engine'
import { ReceitasClient } from '@/components/receitas/ReceitasClient'

export default async function ReceitasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const mes = getMesReferencia()

  const { data: receitas } = await supabase
    .from('receitas')
    .select('*')
    .eq('user_id', user.id)
    .eq('mes_referencia', mes)
    .order('created_at', { ascending: false })

  return <ReceitasClient receitas={receitas ?? []} />
}
