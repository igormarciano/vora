import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMesReferencia } from '@/lib/engine'
import { GastosClient } from '@/components/gastos/GastosClient'

export default async function GastosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const mes = getMesReferencia()

  const [{ data: gastosFixos }, { data: gastosVariaveis }, { data: cartoes }] =
    await Promise.all([
      supabase.from('gastos_fixos').select('*').eq('user_id', user.id).eq('mes_referencia', mes).order('created_at', { ascending: false }),
      supabase.from('gastos_variaveis').select('*').eq('user_id', user.id).eq('mes_referencia', mes).order('created_at', { ascending: false }),
      supabase.from('cartoes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

  return (
    <GastosClient
      gastosFixos={gastosFixos ?? []}
      gastosVariaveis={gastosVariaveis ?? []}
      cartoes={cartoes ?? []}
    />
  )
}
