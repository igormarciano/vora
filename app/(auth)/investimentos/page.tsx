import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvestimentosClient } from '@/components/investimentos/InvestimentosClient'

export default async function InvestimentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: investimentos } = await supabase
    .from('investimentos')
    .select('*')
    .eq('user_id', user.id)
    .order('data_aporte', { ascending: false })

  return <InvestimentosClient investimentos={investimentos ?? []} />
}
