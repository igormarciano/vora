import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMesReferencia, projetarGastosParcelados, projetarGastosFixosRecorrentes } from '@/lib/engine'
import { GastosClient } from '@/components/gastos/GastosClient'

export default async function GastosPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const mesParam = params.mes
  const mes = mesParam && /^\d{4}-\d{2}-\d{2}$/.test(mesParam) ? mesParam : getMesReferencia()

  const [
    { data: fixosDoMes },
    { data: fixosRecorrentesAnteriores },
    { data: variaveisDoMes },
    { data: parcelados },
    { data: cartoes },
    { data: customCategories },
    { data: statusOcorrencias },
  ] = await Promise.all([
    supabase.from('gastos_fixos').select('*').eq('user_id', user.id).eq('mes_referencia', mes).order('created_at', { ascending: false }),
    // Gastos fixos recorrentes lançados em meses anteriores — projetamos no servidor quais
    // continuam ativos no mês selecionado (recorrente=true e dentro de duracao_meses, se houver),
    // sem criar um registro novo por mês (evita duplicação dos dados do usuário)
    supabase.from('gastos_fixos').select('*').eq('user_id', user.id).eq('recorrente', true).lt('mes_referencia', mes),
    // Gastos variáveis não parcelados lançados diretamente neste mês
    supabase.from('gastos_variaveis').select('*').eq('user_id', user.id).eq('mes_referencia', mes).eq('parcelado', false).order('created_at', { ascending: false }),
    // Todas as compras parceladas do usuário — projetamos no frontend/servidor quais estão ativas no mês selecionado,
    // sem criar um registro novo por mês (evita duplicação dos dados do usuário)
    supabase.from('gastos_variaveis').select('*').eq('user_id', user.id).eq('parcelado', true),
    supabase.from('cartoes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('custom_categories').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    // Status pago/pendente por competência mensal das ocorrências projetadas (CR003, item 5)
    supabase.from('ocorrencias_status').select('origem_tipo, origem_id, is_paid').eq('user_id', user.id).eq('mes_referencia', mes),
  ])

  // Mapa de status por competência: aplica-se apenas às ocorrências PROJETADAS;
  // os registros do próprio mês de origem mantêm o seu is_paid (CR003, item 5).
  const statusMap = new Map(
    (statusOcorrencias ?? []).map(s => [`${s.origem_tipo}:${s.origem_id}`, s.is_paid])
  )

  const fixosProjetados = projetarGastosFixosRecorrentes(fixosRecorrentesAnteriores ?? [], mes)
    .map(g => ({ ...g, is_paid: statusMap.get(`gasto_fixo:${g.id}`) ?? false }))
  const gastosFixos = [...(fixosDoMes ?? []), ...fixosProjetados]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const parceladosProjetados = projetarGastosParcelados(parcelados ?? [], mes)
    .map(g => ({ ...g, is_paid: statusMap.get(`gasto_variavel:${g.id}`) ?? false }))
  const gastosVariaveis = [...(variaveisDoMes ?? []), ...parceladosProjetados]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <GastosClient
      mes={mes}
      gastosFixos={gastosFixos}
      gastosVariaveis={gastosVariaveis}
      cartoes={cartoes ?? []}
      customCategories={customCategories ?? []}
    />
  )
}
