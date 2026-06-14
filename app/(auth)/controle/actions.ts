'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getMesReferencia, mesReferenciaInicial } from '@/lib/engine'

// ── Receitas ─────────────────────────────────────────────────────────────────

export async function criarReceita(data: {
  nome: string
  valor: number
  tipo: 'salario' | 'renda_extra' | 'outros'
  tipo_custom?: string
  recorrente: boolean
  duracao_meses?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('receitas').insert({
    ...data,
    user_id: user.id,
    mes_referencia: getMesReferencia(),
  })

  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/dashboard')
  return {}
}

export async function editarReceita(id: string, data: {
  nome: string
  valor: number
  tipo: 'salario' | 'renda_extra' | 'outros'
  tipo_custom?: string
  recorrente: boolean
  duracao_meses?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('receitas').update(data).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/dashboard')
  return {}
}

export async function deletarReceita(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('receitas').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/dashboard')
  return {}
}

// ── Gastos Fixos ──────────────────────────────────────────────────────────────

export async function criarGastoFixo(data: {
  nome: string
  valor: number
  categoria: string
  vencimento?: number
  recorrente: boolean
  duracao_meses?: number
  vinculado_cartao_id?: string
  person_type?: 'PF' | 'PJ'
  description?: string
  is_paid?: boolean
  /** Mês em foco na tela de Gastos; a recorrência inicia em max(mês, atual) — nunca retroativa (CR003, item 6) */
  mes_selecionado?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { mes_selecionado, ...row } = data
  const { error } = await supabase.from('gastos_fixos').insert({
    ...row,
    user_id: user.id,
    mes_referencia: mesReferenciaInicial(mes_selecionado),
  })

  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/dashboard')
  return {}
}

export async function editarGastoFixo(id: string, data: {
  nome: string
  valor: number
  categoria: string
  vencimento?: number
  recorrente: boolean
  duracao_meses?: number
  vinculado_cartao_id?: string
  person_type?: 'PF' | 'PJ'
  description?: string
  is_paid?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('gastos_fixos').update(data).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/dashboard')
  return {}
}

export async function alternarPagoGastoFixo(id: string, is_paid: boolean, mes_referencia?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const error = await alternarPagoOcorrencia(supabase, user.id, 'gasto_fixo', 'gastos_fixos', id, is_paid, mes_referencia)
  if (error) return { error }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/dashboard')
  return {}
}

export async function deletarGastoFixo(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('gastos_fixos').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/dashboard')
  return {}
}

// ── Gastos Variáveis ──────────────────────────────────────────────────────────

export async function criarGastoVariavel(data: {
  nome: string
  valor: number
  categoria: string
  forma_pagamento: 'dinheiro' | 'debito' | 'credito'
  cartao_id?: string
  parcelado: boolean
  total_parcelas?: number
  valor_parcela?: number
  description?: string
  is_paid?: boolean
  expense_nature?: 'PF' | 'PJ'
  /** Mês em foco na tela de Gastos; lançamento nunca retroativo (CR003, item 6) */
  mes_selecionado?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { mes_selecionado, ...row } = data
  const { error } = await supabase.from('gastos_variaveis').insert({
    ...row,
    user_id: user.id,
    mes_referencia: mesReferenciaInicial(mes_selecionado),
  })

  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/dashboard')
  return {}
}

export async function editarGastoVariavel(id: string, data: {
  nome: string
  valor: number
  categoria: string
  forma_pagamento: 'dinheiro' | 'debito' | 'credito'
  cartao_id?: string
  parcelado: boolean
  total_parcelas?: number
  valor_parcela?: number
  description?: string
  is_paid?: boolean
  expense_nature?: 'PF' | 'PJ'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('gastos_variaveis').update(data).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/dashboard')
  return {}
}

export async function alternarPagoGastoVariavel(id: string, is_paid: boolean, mes_referencia?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const error = await alternarPagoOcorrencia(supabase, user.id, 'gasto_variavel', 'gastos_variaveis', id, is_paid, mes_referencia)
  if (error) return { error }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/dashboard')
  return {}
}

/**
 * Aplica o status pago/pendente respeitando a competência mensal (CR003, item 5).
 * Se o mês exibido for o próprio mês de origem do lançamento, atualiza o registro
 * de origem (comportamento histórico). Se for uma ocorrência PROJETADA (recorrência
 * de gasto fixo ou parcela futura de gasto variável, exibida em um mês posterior),
 * grava o status na tabela `ocorrencias_status`, sem afetar os demais meses.
 */
async function alternarPagoOcorrencia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  origemTipo: 'gasto_fixo' | 'gasto_variavel',
  tabela: 'gastos_fixos' | 'gastos_variaveis',
  id: string,
  is_paid: boolean,
  mesReferencia?: string,
): Promise<string | null> {
  const { data: origem, error: fetchError } = await supabase
    .from(tabela).select('mes_referencia').eq('id', id).eq('user_id', userId).single()
  if (fetchError) return fetchError.message
  if (!origem) return 'Lançamento não encontrado'

  // Mês de origem (ou sem contexto de mês) → atualiza o próprio registro
  if (!mesReferencia || mesReferencia === origem.mes_referencia) {
    const { error } = await supabase.from(tabela).update({ is_paid }).eq('id', id).eq('user_id', userId)
    return error ? error.message : null
  }

  // Ocorrência projetada em outro mês → status por competência mensal
  const { error } = await supabase.from('ocorrencias_status').upsert({
    user_id: userId,
    origem_tipo: origemTipo,
    origem_id: id,
    mes_referencia: mesReferencia,
    is_paid,
  }, { onConflict: 'origem_id,mes_referencia' })
  return error ? error.message : null
}

export async function deletarGastoVariavel(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('gastos_variaveis').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/dashboard')
  return {}
}

// ── Cartões ───────────────────────────────────────────────────────────────────

export async function criarCartao(data: { nome: string; bandeira?: string; limite?: number; color?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('cartoes').insert({ ...data, user_id: user.id })
  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  return {}
}

export async function editarCorCartao(id: string, color: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('cartoes').update({ color }).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  return {}
}

export async function deletarCartao(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('cartoes').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  return {}
}

// ── Categorias personalizadas ─────────────────────────────────────────────────

export async function criarCategoriaPersonalizada(data: { emoji: string; nome: string; contexto: 'fixo' | 'variavel' | 'ambos' }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('custom_categories').insert({ ...data, user_id: user.id })
  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/configuracoes')
  return {}
}

export async function deletarCategoriaPersonalizada(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('custom_categories').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/receitas')
  revalidatePath('/gastos')
  revalidatePath('/configuracoes')
  return {}
}
