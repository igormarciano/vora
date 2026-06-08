'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getMesReferencia } from '@/lib/engine'

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
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('gastos_fixos').insert({
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

export async function editarGastoFixo(id: string, data: {
  nome: string
  valor: number
  categoria: string
  vencimento?: number
  recorrente: boolean
  duracao_meses?: number
  vinculado_cartao_id?: string
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
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('gastos_variaveis').insert({
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

export async function editarGastoVariavel(id: string, data: {
  nome: string
  valor: number
  categoria: string
  forma_pagamento: 'dinheiro' | 'debito' | 'credito'
  cartao_id?: string
  parcelado: boolean
  total_parcelas?: number
  valor_parcela?: number
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

export async function criarCartao(data: { nome: string; bandeira?: string; limite?: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('cartoes').insert({ ...data, user_id: user.id })
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
