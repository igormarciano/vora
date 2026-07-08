import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMesReferencia, deslocarMesReferencia } from '@/lib/engine'
import { montarDadosAnaliseMensal } from '@/lib/ai/aggregate'
import { buildUserPrompt } from '@/lib/ai/prompts'
import { gerarAnaliseMensal } from '@/lib/ai/openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Job mensal (Fase 1 do plano de IA): para cada usuário com receita no mês
 * atual, agrega os dados financeiros (sem enviar transações cruas à OpenAI)
 * e grava a leitura gerada em `analises_mensais`. Disparado pelo Vercel Cron
 * (ver `vercel.json`) no dia 1 de cada mês.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const mesAtual = getMesReferencia()
  const mesAnterior = deslocarMesReferencia(mesAtual, -1)

  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, meta_economia_percentual')
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  const resultados: { userId: string; status: 'ok' | 'sem_receita' | 'erro'; detalhe?: string }[] = []

  for (const profile of profiles ?? []) {
    try {
      const [{ data: receitas }, { data: gastosFixos }, { data: gastosVariaveis }, { data: investimentos }] = await Promise.all([
        supabase.from('receitas').select('*').eq('user_id', profile.id),
        supabase.from('gastos_fixos').select('*').eq('user_id', profile.id),
        supabase.from('gastos_variaveis').select('*').eq('user_id', profile.id),
        supabase.from('investimentos').select('*').eq('user_id', profile.id),
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
        profile.meta_economia_percentual ?? 30
      )

      if (dados.mesAtual.receitaTotal <= 0) {
        resultados.push({ userId: profile.id, status: 'sem_receita' })
        continue
      }

      const analise = await gerarAnaliseMensal(buildUserPrompt(dados))

      const { error: upsertError } = await supabase
        .from('analises_mensais')
        .upsert(
          {
            user_id: profile.id,
            mes_referencia: mesAtual,
            status_geral: analise.status_geral,
            resumo: analise.resumo,
            insights: analise.insights,
            recomendacoes: analise.recomendacoes,
          },
          { onConflict: 'user_id,mes_referencia' }
        )

      if (upsertError) throw new Error(upsertError.message)

      resultados.push({ userId: profile.id, status: 'ok' })
    } catch (err) {
      resultados.push({ userId: profile.id, status: 'erro', detalhe: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({ mesReferencia: mesAtual, resultados })
}
