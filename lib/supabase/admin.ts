import { createClient } from '@supabase/supabase-js'

/**
 * Cliente com a service role key — ignora RLS. Uso restrito a contextos de
 * backend sem sessão de usuário (ex.: job de cron), nunca em código exposto
 * ao cliente.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
