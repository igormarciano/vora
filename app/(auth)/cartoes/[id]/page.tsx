import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { faturaDoCartao } from '@/lib/engine/mes'
import { mesDoParametro } from '@/components/layout/MonthNavigator'
import { CartaoDetalheClient } from '@/components/cartoes/CartaoDetalheClient'

export default async function CartaoDetalhePage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mes?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const mes = mesDoParametro((await searchParams).mes)

  const [{ data: cartao }, { data: cartoes }, { data: fixos }, { data: compras }, { data: customCategories }, { data: statusOcorrencias }] =
    await Promise.all([
      supabase.from('cartoes').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('cartoes').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('gastos_fixos').select('*').eq('user_id', user.id).eq('vinculado_cartao_id', id),
      supabase.from('gastos_variaveis').select('*').eq('user_id', user.id).eq('cartao_id', id),
      supabase.from('custom_categories').select('*').eq('user_id', user.id),
      supabase.from('ocorrencias_status').select('origem_tipo, origem_id, is_paid').eq('user_id', user.id).eq('mes_referencia', mes),
    ])

  if (!cartao) notFound()

  const fatura = faturaDoCartao(id, fixos ?? [], compras ?? [], mes)

  // Status pago/pendente por competência das ocorrências projetadas (mesma regra de /gastos)
  const status = new Map((statusOcorrencias ?? []).map(s => [`${s.origem_tipo}:${s.origem_id}`, s.is_paid]))
  const mesOrigem = new Map((fixos ?? []).map(f => [f.id, f.mes_referencia]))
  const fixosMes = fatura.fixos.map(f =>
    mesOrigem.get(f.id) === mes ? f : { ...f, is_paid: status.get(`gasto_fixo:${f.id}`) ?? false },
  )
  const comprasMes = fatura.compras.map(c =>
    c.parcelado ? { ...c, is_paid: status.get(`gasto_variavel:${c.id}`) ?? false } : c,
  )

  return (
    <CartaoDetalheClient
      mes={mes}
      cartao={cartao}
      cartoes={cartoes ?? []}
      customCategories={customCategories ?? []}
      fixos={fixosMes.sort((a, b) => b.valor - a.valor)}
      compras={comprasMes.sort((a, b) => b.created_at.localeCompare(a.created_at))}
      totalFixos={fatura.totalFixos}
      totalCompras={fatura.totalCompras}
      parceladoFuturo={fatura.parceladoFuturo}
    />
  )
}
