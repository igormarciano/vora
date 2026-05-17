import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const type = searchParams.get('type')

  if (code) {
    // Determina a URL de destino antes de criar o response
    const redirectTo = type === 'recovery'
      ? new URL('/auth/update-password', origin)
      : new URL(next, origin)

    const response = NextResponse.redirect(redirectTo)

    // Cria o cliente Supabase com cookies direto no response (padrão obrigatório em route handlers)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) return response
  }

  // Código inválido ou ausente → volta pro login com aviso
  return NextResponse.redirect(new URL('/login?error=link_invalido', origin))
}
