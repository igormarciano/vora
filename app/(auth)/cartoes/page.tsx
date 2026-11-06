import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { faturaDoCartao } from '@/lib/engine/mes'
import { mesDoParametro } from '@/components/layout/MonthNavigator'
import { CartoesClient } from '@/components/cartoes/CartoesClient'

export default async function CartoesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const mes = mesDoParametro((await searchParams).mes)

  const [{ data: cartoes }, { data: fixos }, { data: variaveis }] = await Promise.all([
    supabase.from('cartoes').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    // Contas fixas vinculadas a um cartão também compõem a fatura
    supabase.from('gastos_fixos').select('*').eq('user_id', user.id).not('vinculado_cartao_id', 'is', null),
    supabase.from('gastos_variaveis').select('*').eq('user_id', user.id).not('cartao_id', 'is', null),
  ])

  const resumo = (cartoes ?? []).map(cartao => {
    const f = faturaDoCartao(cartao.id, fixos ?? [], variaveis ?? [], mes)
    return {
      cartao,
      total: f.total,
      totalFixos: f.totalFixos,
      totalCompras: f.totalCompras,
      parceladoFuturo: f.parceladoFuturo,
      qtdFixos: f.fixos.length,
      qtdCompras: f.compras.length,
    }
  })

  return <CartoesClient mes={mes} resumo={resumo} />
}
