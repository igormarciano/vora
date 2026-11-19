'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getMesReferencia } from '@/lib/engine'
import { montarMes, type RespostasOnboarding } from '@/lib/onboarding'

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
  /** Categoria real do enum usado em FormGastoFixo/FormGastoVariavel — não mais construída a partir de icon+nome. */
  categoria: string
}

export async function salvarSetupInicial(data: {
  renda: number
  /** Meta de economia (%) definida no passo 2 do wizard — mesma fonte de verdade usada em Configurações. */
  meta: number
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
        categoria: f.categoria,
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
        categoria: v.categoria,
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

  // Meta de economia (mesmo campo usado em Configurações) e setup completo
  await supabase
    .from('profiles')
    .update({ meta_economia_percentual: data.meta, setup_completo: true })
    .eq('id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/controle')
  revalidatePath('/configuracoes')
  return {}
}

// ── Onboarding "Monte seu mês" (redesign) ──────────────────────────────────────

/**
 * Grava o mês montado no onboarding. Recalcula tudo no servidor a partir das
 * respostas (não confia em totais vindos do cliente). Cria, nesta ordem:
 * cartões → receitas → gastos fixos (assinaturas vinculadas ao cartão principal)
 * → estimativas de gastos variáveis → meta e setup_completo no perfil.
 */
export async function salvarOnboarding(respostas: RespostasOnboarding) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const mes = getMesReferencia()
  const m = montarMes(respostas)
  if (m.totalReceitas <= 0) return { error: 'Informe sua renda para continuar.' }

  // Cartões
  const cartaoPorBanco = new Map<string, string>()
  if (m.cartoes.length > 0) {
    const { data, error } = await supabase
      .from('cartoes')
      .insert(m.cartoes.map(c => ({ user_id: user.id, nome: c.nome, color: c.cor })))
      .select('id')
    if (error) return { error: error.message }
    data?.forEach((row, i) => cartaoPorBanco.set(m.cartoes[i].bancoId, row.id))
  }

  const { error: eRec } = await supabase.from('receitas').insert(
    m.receitas.map(r => ({ ...r, user_id: user.id, recorrente: true, mes_referencia: mes })),
  )
  if (eRec) return { error: eRec.message }

  if (m.fixos.length > 0) {
    const { error } = await supabase.from('gastos_fixos').insert(
      m.fixos.map(f => ({
        user_id: user.id,
        nome: f.nome,
        valor: f.valor,
        categoria: f.categoria,
        recorrente: true,
        vinculado_cartao_id: f.bancoId ? cartaoPorBanco.get(f.bancoId) ?? null : null,
        mes_referencia: mes,
      })),
    )
    if (error) return { error: error.message }
  }

  if (m.variaveis.length > 0) {
    const { error } = await supabase.from('gastos_variaveis').insert(
      m.variaveis.map(v => ({
        user_id: user.id,
        nome: v.nome,
        valor: v.valor,
        categoria: v.categoria,
        forma_pagamento: 'debito',
        parcelado: false,
        description: 'Estimativa criada no onboarding. Ajuste quando souber o valor real.',
        mes_referencia: mes,
      })),
    )
    if (error) return { error: error.message }
  }

  await supabase
    .from('profiles')
    .update({ meta_economia_percentual: respostas.meta, setup_completo: true })
    .eq('id', user.id)

  revalidatePath('/', 'layout')
  return {}
}
