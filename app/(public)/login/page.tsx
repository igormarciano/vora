'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell, AuthHeading } from '@/components/auth/AuthShell'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { Button, Field, PasswordField, TextInput } from '@/components/vora/ui'

type Mode = 'boasvindas' | 'login' | 'esqueci'

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  )
}

function Login() {
  const router = useRouter()
  const params = useSearchParams()
  // No mobile a primeira tela é de boas-vindas; no desktop o formulário já aparece.
  const [mode, setMode] = useState<Mode>('boasvindas')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (params.get('error') === 'link_invalido') toast.error('Esse link expirou ou já foi usado. Entre de novo.')
  }, [params])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message.includes('confirmed') ? 'Confirme seu e-mail antes de entrar.' : 'E-mail ou senha incorretos.')
      return
    }
    router.refresh()
    router.push('/dashboard')
  }

  if (mode === 'esqueci') {
    return (
      <AuthShell>
        <BackButton onClick={() => setMode('login')} />
        <EsqueciSenha initialEmail={email} />
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      {/* Boas-vindas: só no mobile */}
      <div className={mode === 'boasvindas' ? 'lg:hidden' : 'hidden'}>
        <AuthHeading
          title="Veja seu mês antes dele acontecer."
          subtitle="Clareza sobre o seu dinheiro, sem planilha e sem culpa."
        />
        <div className="flex flex-col gap-3">
          <Button size="lg" block onClick={() => router.push('/cadastro')}>Criar conta grátis</Button>
          <Button size="lg" block variant="ghost" onClick={() => setMode('login')}>Já tenho conta</Button>
        </div>
        <LegalNote />
      </div>

      {/* Formulário: sempre no desktop, no mobile após "Já tenho conta" */}
      <div className={mode === 'boasvindas' ? 'hidden lg:block' : ''}>
        <div className="lg:hidden"><BackButton onClick={() => setMode('boasvindas')} /></div>
        <AuthHeading title="Bem-vindo de volta" subtitle="Entre para ver como seu mês está." />

        <div className="flex flex-col gap-4">
          <GoogleButton />
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Field label="E-mail">
              <TextInput type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" required />
            </Field>
            <Field
              label="Senha"
              action={<button type="button" onClick={() => setMode('esqueci')} className="text-[13px] font-medium text-brand hover:text-brand-strong">Esqueci a senha</button>}
            >
              <PasswordField autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" required />
            </Field>
            <Button type="submit" size="lg" block loading={loading} className="mt-2">Entrar</Button>
          </form>
        </div>

        <p className="mt-8 text-center text-[14px] text-ink-2">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="font-semibold text-brand-strong hover:underline">Criar conta grátis</Link>
        </p>
      </div>
    </AuthShell>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="-ml-2 mb-4 inline-flex items-center gap-0.5 h-9 pr-3 pl-1 rounded-full text-[15px] font-medium text-brand hover:bg-fill">
      <ChevronLeft size={20} /> Voltar
    </button>
  )
}

function LegalNote() {
  return (
    <p className="mt-6 text-center text-[12px] text-ink-3 leading-relaxed">
      Ao continuar, você concorda com os{' '}
      <Link href="/termos" className="underline">Termos</Link> e a{' '}
      <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
    </p>
  )
}

function EsqueciSenha({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback?type=recovery`,
    })
    setLoading(false)
    if (error) {
      toast.error('Não foi possível enviar o e-mail. Tente novamente.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <>
        <AuthHeading title="Confira seu e-mail" subtitle={<>Enviamos um link para <strong className="text-ink">{email}</strong>. Ele abre a tela para criar uma nova senha.</>} />
        <p className="text-[13px] text-ink-3">Não chegou? Veja a caixa de spam ou tente de novo em alguns minutos.</p>
      </>
    )
  }

  return (
    <>
      <AuthHeading title="Esqueceu a senha?" subtitle="Informe o e-mail da sua conta e enviamos um link para criar uma nova." />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="E-mail">
          <TextInput type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" required />
        </Field>
        <Button type="submit" size="lg" block loading={loading} className="mt-2">Enviar link</Button>
      </form>
    </>
  )
}
