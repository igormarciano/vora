import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMesReferencia, projetarGastosParcelados } from '@/lib/engine'
import { GastosClient } from '@/components/gastos/GastosClient'

export default async function GastosPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const mesParam = params.mes
  const mes = mesParam && /^\d{4}-\d{2}-\d{2}$/.test(mesParam) ? mesParam : getMesReferencia()

  const [
    { data: gastosFixos },
    { data: variaveisDoMes },
    { data: parcelados },
    { data: cartoes },
    { data: customCategories },
  ] = await Promise.all([
    supabase.from('gastos_fixos').select('*').eq('user_id', user.id).eq('mes_referencia', mes).order('created_at', { ascending: false }),
    // Gastos variáveis não parcelados lançados diretamente neste mês
    supabase.from('gastos_variaveis').select('*').eq('user_id', user.id).eq('mes_referencia', mes).eq('parcelado', false).order('created_at', { ascending: false }),
    // Todas as compras parceladas do usuário — projetamos no frontend/servidor quais estão ativas no mês selecionado,
    // sem criar um registro novo por mês (evita duplicação dos dados do usuário)
    supabase.from('gastos_variaveis').select('*').eq('user_id', user.id).eq('parcelado', true),
    supabase.from('cartoes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('custom_categories').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const parceladosProjetados = projetarGastosParcelados(parcelados ?? [], mes)
  const gastosVariaveis = [...(variaveisDoMes ?? []), ...parceladosProjetados]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <GastosClient
      mes={mes}
      gastosFixos={gastosFixos ?? []}
      gastosVariaveis={gastosVariaveis}
      cartoes={cartoes ?? []}
      customCategories={customCategories ?? []}
    />
  )
}
