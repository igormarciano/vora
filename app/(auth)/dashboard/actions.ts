'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getMesReferencia, deslocarMesReferencia } from '@/lib/engine'
import { montarDadosAnaliseMensal } from '@/lib/ai/aggregate'
import { buildUserPrompt } from '@/lib/ai/prompts'
import { gerarAnaliseMensal as chamarOpenAI } from '@/lib/ai/openai'
import type { AnaliseMensal } from '@/types'

/**
 * Roda a análise mensal por IA sob demanda (CTA "Analisar minhas finanças" na
 * Visão Geral), além do job automático de cron. Usa os mesmos dados do
 * próprio usuário (RLS), sem service role.
 */
export async function gerarAnaliseSobDemanda(): Promise<{ error: string } | { analise: AnaliseMensal }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const mesAtual = getMesReferencia()
  const mesAnterior = deslocarMesReferencia(mesAtual, -1)

  const [{ data: receitas }, { data: gastosFixos }, { data: gastosVariaveis }, { data: investimentos }, { data: profile }] =
    await Promise.all([
      supabase.from('receitas').select('*').eq('user_id', user.id),
      supabase.from('gastos_fixos').select('*').eq('user_id', user.id),
      supabase.from('gastos_variaveis').select('*').eq('user_id', user.id),
      supabase.from('investimentos').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('meta_economia_percentual').eq('id', user.id).single(),
    ])

  const dados = montarDadosAnaliseMensal(
    {
      receitas: receitas ?? [],
      gastosFixos: gastosFixos ?? [],
      gastosVariaveis: gastosVariaveis ?? [],
      investimentos: investimentos ?? [],
    },
    mesAtual,
    mesAnterior,
    profile?.meta_economia_percentual ?? 30
  )

  if (dados.mesAtual.receitaTotal <= 0) {
    return { error: 'Cadastre suas receitas e gastos deste mês antes de gerar a análise.' }
  }

  let resultadoIA
  try {
    resultadoIA = await chamarOpenAI(buildUserPrompt(dados))
  } catch {
    return { error: 'Não foi possível gerar sua análise agora. Tente novamente em instantes.' }
  }

  const { data: analise, error } = await supabase
    .from('analises_mensais')
    .upsert(
      {
        user_id: user.id,
        mes_referencia: mesAtual,
        status_geral: resultadoIA.status_geral,
        resumo: resultadoIA.resumo,
        insights: resultadoIA.insights,
        recomendacoes: resultadoIA.recomendacoes,
      },
      { onConflict: 'user_id,mes_referencia' }
    )
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { analise }
}
