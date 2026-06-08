'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarInvestimento(data: {
  nome: string
  valor: number
  categoria: 'renda_fixa' | 'renda_variavel' | 'cripto' | 'credito_privado' | 'internacional'
  rentabilidade_anual?: number
  vencimento?: string
  liquidez?: string
  observacao?: string
  data_aporte: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('investimentos').insert({ ...data, user_id: user.id })
  if (error) return { error: error.message }
  revalidatePath('/investimentos')
  revalidatePath('/dashboard')
  return {}
}

export async function editarInvestimento(id: string, data: {
  nome: string
  valor: number
  categoria: 'renda_fixa' | 'renda_variavel' | 'cripto' | 'credito_privado' | 'internacional'
  rentabilidade_anual?: number
  vencimento?: string
  liquidez?: string
  observacao?: string
  data_aporte: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('investimentos').update(data).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/investimentos')
  revalidatePath('/dashboard')
  return {}
}

/**
 * Transfere parte (ou toda) a sobra do mês para um novo investimento.
 * Recalcula a economia do mês a partir dos dados reais do usuário (não confia em
 * valores vindos do cliente), cria o investimento e atualiza/registra a pendência
 * de investimento (`pendencias_investimento`) que controla quanto da sobra já foi
 * distribuído — sem duplicar nem perder dados existentes.
 */
export async function investirSobra(data: {
  nome: string
  valor: number
  categoria: 'renda_fixa' | 'renda_variavel' | 'cripto' | 'credito_privado' | 'internacional'
  data_aporte: string
  mes_referencia: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  if (!data.nome.trim()) return { error: 'Informe um nome para o investimento' }
  if (data.valor <= 0) return { error: 'Valor inválido' }

  const [{ data: receitas }, { data: gastosFixos }, { data: gastosVariaveis }] = await Promise.all([
    supabase.from('receitas').select('valor').eq('user_id', user.id).eq('mes_referencia', data.mes_referencia),
    supabase.from('gastos_fixos').select('valor').eq('user_id', user.id).eq('mes_referencia', data.mes_referencia),
    supabase.from('gastos_variaveis').select('valor, parcelado, valor_parcela').eq('user_id', user.id).eq('mes_referencia', data.mes_referencia),
  ])

  const totalReceitas = (receitas ?? []).reduce((s, r) => s + r.valor, 0)
  const totalFixos = (gastosFixos ?? []).reduce((s, g) => s + g.valor, 0)
  const totalVariaveis = (gastosVariaveis ?? []).reduce(
    (s, g) => s + (g.parcelado && g.valor_parcela != null ? g.valor_parcela : g.valor), 0
  )
  const sobra = totalReceitas - (totalFixos + totalVariaveis)
  if (sobra <= 0) return { error: 'Não há sobra disponível neste mês para investir' }

  const { data: pendenciaExistente } = await supabase
    .from('pendencias_investimento')
    .select('*')
    .eq('user_id', user.id)
    .eq('mes_referencia', data.mes_referencia)
    .maybeSingle()

  const valorRestanteAtual = pendenciaExistente ? pendenciaExistente.valor_restante : sobra
  if (data.valor > valorRestanteAtual) {
    return { error: `Valor maior que a sobra disponível (${valorRestanteAtual})` }
  }

  const { error: investError } = await supabase.from('investimentos').insert({
    nome: data.nome.trim(),
    valor: data.valor,
    categoria: data.categoria,
    data_aporte: data.data_aporte,
    user_id: user.id,
  })
  if (investError) return { error: investError.message }

  const novoRestante = Math.max(0, valorRestanteAtual - data.valor)
  const novoStatus: 'pendente' | 'distribuido' = novoRestante <= 0 ? 'distribuido' : 'pendente'

  if (pendenciaExistente) {
    const { error } = await supabase
      .from('pendencias_investimento')
      .update({ valor_restante: novoRestante, status: novoStatus })
      .eq('id', pendenciaExistente.id)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('pendencias_investimento').insert({
      user_id: user.id,
      valor_disponivel: sobra,
      valor_restante: novoRestante,
      mes_referencia: data.mes_referencia,
      status: novoStatus,
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/investimentos')
  revalidatePath('/dashboard')
  return {}
}

/** Marca a sobra do mês como dispensada — o usuário optou por não investir agora. */
export async function dispensarSobraInvestimento(mesReferencia: string, valorDisponivel: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: existente } = await supabase
    .from('pendencias_investimento')
    .select('id')
    .eq('user_id', user.id)
    .eq('mes_referencia', mesReferencia)
    .maybeSingle()

  if (existente) {
    const { error } = await supabase
      .from('pendencias_investimento')
      .update({ status: 'dispensado' })
      .eq('id', existente.id)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('pendencias_investimento').insert({
      user_id: user.id,
      valor_disponivel: valorDisponivel,
      valor_restante: valorDisponivel,
      mes_referencia: mesReferencia,
      status: 'dispensado',
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/investimentos')
  return {}
}

export async function deletarInvestimento(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('investimentos').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/investimentos')
  revalidatePath('/dashboard')
  return {}
}
