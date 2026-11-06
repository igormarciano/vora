import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calcularMeta, getMesReferencia } from '@/lib/engine'
import {
  analisarCategorias, fixosDoMes, receitasDoMes, timelineCompromissos, valorNoMes, variaveisDoMes,
} from '@/lib/engine/mes'
import { AnaliseClient, type Sugestao } from '@/components/analise/AnaliseClient'

export default async function AnalisePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const mes = getMesReferencia()

  const [{ data: receitasTodas }, { data: fixosTodos }, { data: variaveisTodos }, { data: profile }] = await Promise.all([
    supabase.from('receitas').select('*').eq('user_id', user.id),
    supabase.from('gastos_fixos').select('*').eq('user_id', user.id),
    supabase.from('gastos_variaveis').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('meta_economia_percentual').eq('id', user.id).single(),
  ])

  const receitas = receitasTodas ?? []
  const fixos = fixosTodos ?? []
  const variaveis = variaveisTodos ?? []
  const metaPct = Number(profile?.meta_economia_percentual ?? 30)

  const receitaMes = receitasDoMes(receitas, mes).reduce((s, r) => s + r.valor, 0)
  const fixosMes = fixosDoMes(fixos, mes)
  const variaveisMes = variaveisDoMes(variaveis, mes)
  const gastosMes = fixosMes.reduce((s, f) => s + f.valor, 0) + variaveisMes.reduce((s, v) => s + valorNoMes(v), 0)
  const economia = receitaMes - gastosMes
  const metaValor = calcularMeta(receitaMes, metaPct)
  const corteNecessario = Math.max(0, metaValor - economia)

  const categorias = analisarCategorias(fixos, variaveis, mes, receitaMes)

  // ── Sugestões determinísticas (sem IA): o que mais pesa e o que fugiu do padrão
  const sugestoes: Sugestao[] = []

  for (const c of categorias) {
    if (c.media != null && c.variacao != null && c.variacao >= 0.2 && c.atual - c.media >= 50) {
      sugestoes.push({
        tipo: 'acima_media',
        titulo: `${c.categoria} está ${Math.round(c.variacao * 100)}% acima da sua média`,
        descricao: `Você costuma gastar ${fmt(c.media)} e este mês já está em ${fmt(c.atual)}.`,
        economia: c.atual - c.media,
      })
    }
  }

  const discricionarias = categorias.filter(c => c.discricionaria)
  const totalDiscricionario = discricionarias.reduce((s, c) => s + c.atual, 0)
  if (totalDiscricionario > 0) {
    sugestoes.push({
      tipo: 'discricionario',
      titulo: `Gastos de escolha somam ${fmt(totalDiscricionario)}`,
      descricao: `${discricionarias.map(c => c.categoria).join(', ')}. Reduzir 30% aqui libera esse valor por mês sem mexer no essencial.`,
      economia: totalDiscricionario * 0.3,
    })
  }

  for (const c of categorias) {
    if (receitaMes > 0 && c.pctReceita >= 0.25 && !sugestoes.some(s => s.titulo.startsWith(c.categoria))) {
      sugestoes.push({
        tipo: 'peso',
        titulo: `${c.categoria} consome ${Math.round(c.pctReceita * 100)}% da sua renda`,
        descricao: `É a categoria que mais pesa. Revise os itens dela: ${c.itens.slice(0, 3).map(i => i.nome).join(', ')}.`,
        economia: null,
      })
    }
  }

  sugestoes.sort((a, b) => (b.economia ?? 0) - (a.economia ?? 0))

  const maioresGastos = [
    ...fixosMes.map(f => ({ nome: f.nome, categoria: f.categoria, valor: f.valor, tipo: 'Fixo' })),
    ...variaveisMes.map(v => ({
      nome: v.nome,
      categoria: v.categoria,
      valor: valorNoMes(v),
      tipo: v.parcelado ? `Parcela ${v.parcela_atual}/${v.total_parcelas}` : 'Variável',
    })),
  ].sort((a, b) => b.valor - a.valor).slice(0, 6)

  const { pontos, eventos } = timelineCompromissos(fixos, variaveis, mes, 12)

  return (
    <AnaliseClient
      mes={mes}
      receitaMes={receitaMes}
      gastosMes={gastosMes}
      economia={economia}
      metaPct={metaPct}
      corteNecessario={corteNecessario}
      categorias={categorias.map(c => ({ categoria: c.categoria, atual: c.atual, media: c.media, pctReceita: c.pctReceita, discricionaria: c.discricionaria }))}
      sugestoes={sugestoes}
      maioresGastos={maioresGastos}
      timeline={pontos}
      eventos={eventos}
    />
  )
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
