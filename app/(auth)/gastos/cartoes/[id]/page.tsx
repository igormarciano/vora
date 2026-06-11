import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getMesReferencia, diferencaEmMeses, projetarGastosFixosRecorrentes } from '@/lib/engine'
import { CartaoDetalheClient } from '@/components/cartoes/CartaoDetalheClient'
import type { GastoVariavel } from '@/types'

export default async function CartaoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params

  const [{ data: cartao }, { data: compras }, { data: fixosVinculadosDoMes }, { data: fixosRecorrentesAnteriores }] =
    await Promise.all([
      supabase.from('cartoes').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('gastos_variaveis').select('*').eq('user_id', user.id).eq('cartao_id', id).order('mes_referencia', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('gastos_fixos').select('*').eq('user_id', user.id).eq('vinculado_cartao_id', id).eq('mes_referencia', getMesReferencia()),
      supabase.from('gastos_fixos').select('*').eq('user_id', user.id).eq('vinculado_cartao_id', id).eq('recorrente', true).lt('mes_referencia', getMesReferencia()),
    ])

  if (!cartao) notFound()

  const mesAtual = getMesReferencia()
  const fixosVinculados = [
    ...(fixosVinculadosDoMes ?? []),
    ...projetarGastosFixosRecorrentes(fixosRecorrentesAnteriores ?? [], mesAtual),
  ]

  // Para cada compra, projeta a parcela "atual" considerando o mês de hoje — sem
  // duplicar registros no banco (mesmo princípio de projetarGastosParcelados).
  const comprasComParcela = (compras ?? []).map(item => {
    if (!item.parcelado || !item.total_parcelas) {
      return { item, parcelaAtualProjetada: null as number | null }
    }
    const delta = diferencaEmMeses(item.mes_referencia, mesAtual)
    const parcelaAtualProjetada = item.parcela_atual + delta
    return { item, parcelaAtualProjetada }
  })

  // Indicadores
  let totalFaturaAtual = 0
  let totalParceladoFuturo = 0

  for (const { item, parcelaAtualProjetada } of comprasComParcela) {
    if (!item.parcelado || !item.total_parcelas) {
      // Compra à vista no cartão: entra na fatura apenas no mês em que foi lançada
      if (item.mes_referencia === mesAtual) totalFaturaAtual += item.valor
      continue
    }
    const valorParcela = item.valor_parcela ?? item.valor / item.total_parcelas
    if (parcelaAtualProjetada !== null && parcelaAtualProjetada >= 1 && parcelaAtualProjetada <= item.total_parcelas) {
      totalFaturaAtual += valorParcela
      const restantes = item.total_parcelas - parcelaAtualProjetada
      if (restantes > 0) totalParceladoFuturo += valorParcela * restantes
    }
  }

  for (const fixo of fixosVinculados) {
    totalFaturaAtual += fixo.valor
  }

  const valorUtilizado = totalFaturaAtual + totalParceladoFuturo
  const disponivel = cartao.limite != null ? cartao.limite - valorUtilizado : null

  return (
    <CartaoDetalheClient
      cartao={cartao}
      compras={comprasComParcela.map(({ item, parcelaAtualProjetada }) => formatCompra(item, parcelaAtualProjetada))}
      fixosVinculados={fixosVinculados}
      totalFaturaAtual={totalFaturaAtual}
      totalParceladoFuturo={totalParceladoFuturo}
      valorUtilizado={valorUtilizado}
      disponivel={disponivel}
    />
  )
}

function formatCompra(item: GastoVariavel, parcelaAtualProjetada: number | null) {
  const parcelaAtual = parcelaAtualProjetada !== null
    ? Math.min(Math.max(parcelaAtualProjetada, 1), item.total_parcelas ?? 1)
    : null
  return {
    id: item.id,
    nome: item.nome,
    categoria: item.categoria,
    description: item.description,
    valor: item.valor,
    valorParcela: item.valor_parcela,
    parcelaAtual,
    totalParcelas: item.total_parcelas,
    quitado: parcelaAtualProjetada !== null && item.total_parcelas != null && parcelaAtualProjetada > item.total_parcelas,
    mesReferencia: item.mes_referencia,
    createdAt: item.created_at,
  }
}

export type CompraCartao = ReturnType<typeof formatCompra>
