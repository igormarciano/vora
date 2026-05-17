'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarInvestimento(data: {
  nome: string
  valor: number
  categoria: 'renda_fixa' | 'renda_variavel' | 'cripto' | 'credito_privado' | 'internacional'
  rentabilidade_anual?: number
  vencimento?: string
  liquidez?: string
  observacao?: string
  data_aporte: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('investimentos').insert({ ...data, user_id: user.id })
  if (error) return { error: error.message }
  revalidatePath('/investimentos')
  revalidatePath('/dashboard')
  return {}
}

export async function editarInvestimento(id: string, data: {
  nome: string
  valor: number
  categoria: 'renda_fixa' | 'renda_variavel' | 'cripto' | 'credito_privado' | 'internacional'
  rentabilidade_anual?: number
  vencimento?: string
  liquidez?: string
  observacao?: string
  data_aporte: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('investimentos').update(data).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/investimentos')
  revalidatePath('/dashboard')
  return {}
}

export async function deletarInvestimento(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('investimentos').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/investimentos')
  revalidatePath('/dashboard')
  return {}
}
