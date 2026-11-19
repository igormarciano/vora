'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell, AuthHeading } from '@/components/auth/AuthShell'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { Button, Field, PasswordField, TextInput } from '@/components/vora/ui'

export default function CadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [aguardandoEmail, setAguardandoEmail] = useState(false)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback?next=/setup`,
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message.includes('already') ? 'Esse e-mail já tem conta. Tente entrar.' : 'Não foi possível criar a conta. Tente de novo.')
      return
    }
    if (!data.session) {
      setAguardandoEmail(true)
      return
    }
    router.refresh()
    router.push('/setup')
  }

  if (aguardandoEmail) {
    return (
      <AuthShell illustration="/images/onboarding1-hero.svg">
        <div className="w-14 h-14 rounded-[18px] bg-brand-soft text-brand-strong flex items-center justify-center mb-5">
          <MailCheck size={26} />
        </div>
        <AuthHeading
          title="Confirme seu e-mail"
          subtitle={<>Enviamos um link para <strong className="text-ink">{email}</strong>. Abra ele no celular ou no computador para ativar sua conta e montar seu mês.</>}
        />
        <p className="text-[13px] text-ink-3">Não chegou em 2 minutos? Veja o spam ou confira se o e-mail está certo.</p>
        <Button variant="ghost" size="lg" block className="mt-6" onClick={() => setAguardandoEmail(false)}>Usar outro e-mail</Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell illustration="/images/onboarding1-hero.svg">
      <Link href="/login" className="lg:hidden -ml-2 mb-4 inline-flex items-center gap-0.5 h-9 pr-3 pl-1 rounded-full text-[15px] font-medium text-brand hover:bg-fill">
        <ChevronLeft size={20} /> Voltar
      </Link>
      <AuthHeading title="Crie sua conta" subtitle="Leva um minuto. Depois a Vora monta seu mês com você." />

      <div className="flex flex-col gap-4">
        <GoogleButton label="Criar conta com Google" />
        <form onSubmit={handleCadastro} className="flex flex-col gap-4">
          <Field label="Como podemos te chamar?">
            <TextInput autoComplete="given-name" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" required />
          </Field>
          <Field label="E-mail">
            <TextInput type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" required />
          </Field>
          <Field label="Senha" hint="Mínimo de 6 caracteres">
            <PasswordField autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Crie uma senha" minLength={6} required />
          </Field>
          <Button type="submit" size="lg" block loading={loading} className="mt-2">Criar conta</Button>
        </form>
      </div>

      <p className="mt-6 text-center text-[12px] text-ink-3 leading-relaxed">
        Ao criar a conta, você concorda com os{' '}
        <Link href="/termos" target="_blank" className="underline">Termos de Serviço</Link> e a{' '}
        <Link href="/privacidade" target="_blank" className="underline">Política de Privacidade</Link>.
      </p>
      <p className="mt-6 text-center text-[14px] text-ink-2">
        Já tem conta? <Link href="/login" className="font-semibold text-brand-strong hover:underline">Entrar</Link>
      </p>
    </AuthShell>
  )
}
