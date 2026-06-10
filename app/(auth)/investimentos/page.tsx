import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvestimentosClient } from '@/components/investimentos/InvestimentosClient'
import {
  calcularReceitas,
  calcularGastosFixos,
  calcularGastosVariaveis,
  calcularTotalGastos,
  calcularEconomia,
  getMesReferencia,
  projetarGastosFixosRecorrentes,
} from '@/lib/engine'

export default async function InvestimentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const mes = getMesReferencia()

  const [
    { data: investimentos },
    { data: receitas },
    { data: fixosDoMes },
    { data: fixosRecorrentesAnteriores },
    { data: gastosVariaveis },
    { data: pendencia },
  ] = await Promise.all([
    supabase.from('investimentos').select('*').eq('user_id', user.id).order('data_aporte', { ascending: false }),
    supabase.from('receitas').select('*').eq('user_id', user.id).eq('mes_referencia', mes),
    supabase.from('gastos_fixos').select('*').eq('user_id', user.id).eq('mes_referencia', mes),
    // Gastos fixos recorrentes lançados em meses anteriores, projetados para o mês atual
    supabase.from('gastos_fixos').select('*').eq('user_id', user.id).eq('recorrente', true).lt('mes_referencia', mes),
    supabase.from('gastos_variaveis').select('*').eq('user_id', user.id).eq('mes_referencia', mes),
    supabase.from('pendencias_investimento').select('*').eq('user_id', user.id).eq('mes_referencia', mes).maybeSingle(),
  ])

  const gastosFixos = [...(fixosDoMes ?? []), ...projetarGastosFixosRecorrentes(fixosRecorrentesAnteriores ?? [], mes)]

  const totalReceitas = calcularReceitas(receitas ?? [])
  const totalGastos = calcularTotalGastos(
    calcularGastosFixos(gastosFixos),
    calcularGastosVariaveis(gastosVariaveis ?? [])
  )
  const sobra = calcularEconomia(totalReceitas, totalGastos)

  return (
    <InvestimentosClient
      investimentos={investimentos ?? []}
      mes={mes}
      sobra={sobra}
      pendencia={pendencia ?? null}
    />
  )
}
