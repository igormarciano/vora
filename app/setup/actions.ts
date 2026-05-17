'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getMesReferencia } from '@/lib/engine'

export async function marcarSetupCompleto() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({ setup_completo: true })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return {}
}

interface SetupItem {
  icon: string
  nome: string
  valor: number
}

export async function salvarSetupInicial(data: {
  renda: number
  fixos: SetupItem[]
  variaveis: SetupItem[]
  lazer: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const mes = getMesReferencia()

  // Receita
  if (data.renda > 0) {
    const { error } = await supabase.from('receitas').insert({
      user_id: user.id,
      nome: 'Minha renda',
      valor: data.renda,
      tipo: 'salario',
      recorrente: true,
      mes_referencia: mes,
    })
    if (error) return { error: error.message }
  }

  // Gastos fixos
  if (data.fixos.length > 0) {
    const { error } = await supabase.from('gastos_fixos').insert(
      data.fixos.map(f => ({
        user_id: user.id,
        nome: f.nome,
        valor: f.valor,
        categoria: f.icon + ' ' + f.nome,
        recorrente: true,
        mes_referencia: mes,
      }))
    )
    if (error) return { error: error.message }
  }

  // Gastos variáveis
  if (data.variaveis.length > 0) {
    const { error } = await supabase.from('gastos_variaveis').insert(
      data.variaveis.map(v => ({
        user_id: user.id,
        nome: v.nome,
        valor: v.valor,
        categoria: v.icon + ' ' + v.nome,
        forma_pagamento: 'dinheiro',
        parcelado: false,
        mes_referencia: mes,
      }))
    )
    if (error) return { error: error.message }
  }

  // Lazer como gasto variável
  if (data.lazer > 0) {
    const { error } = await supabase.from('gastos_variaveis').insert({
      user_id: user.id,
      nome: 'Lazer e dia a dia',
      valor: data.lazer,
      categoria: '🎭 Lazer',
      forma_pagamento: 'dinheiro',
      parcelado: false,
      mes_referencia: mes,
    })
    if (error) return { error: error.message }
  }

  // Marcar setup como completo
  await supabase.from('profiles').update({ setup_completo: true }).eq('id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/controle')
  return {}
}
