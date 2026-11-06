import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMesReferencia, projetarReceitasRecorrentes } from '@/lib/engine'
import { ReceitasClient } from '@/components/receitas/ReceitasClient'

export default async function ReceitasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const mes = getMesReferencia()

  const [{ data: receitasDoMes }, { data: recorrentesAnteriores }] = await Promise.all([
    supabase
      .from('receitas')
      .select('*')
      .eq('user_id', user.id)
      .eq('mes_referencia', mes)
      .order('created_at', { ascending: false }),
    // Receitas recorrentes lançadas em meses anteriores: projetadas para o mês atual,
    // igual ao Dashboard e a /gastos (sem isso a lista fica vazia mesmo com receita no total).
    supabase
      .from('receitas')
      .select('*')
      .eq('user_id', user.id)
      .eq('recorrente', true)
      .lt('mes_referencia', mes),
  ])

  const receitas = [
    ...(receitasDoMes ?? []),
    ...projetarReceitasRecorrentes(recorrentesAnteriores ?? [], mes),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return <ReceitasClient receitas={receitas} />
}
