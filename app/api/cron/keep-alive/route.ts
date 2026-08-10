import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Ping diário para o projeto Supabase não pausar por inatividade (planos Free
 * pausam automaticamente após ~7 dias sem uso). Qualquer requisição à API do
 * projeto conta como atividade — não precisa de dados reais nem de service role.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { error } = await supabase.from('profiles').select('id').limit(1)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() })
}
