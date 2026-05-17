'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function atualizarPerfil(data: {
  nome: string
  meta_economia_percentual: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('profiles').update(data).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/configuracoes')
  revalidatePath('/dashboard')
  return {}
}
