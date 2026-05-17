'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type Mode = 'landing' | 'login' | 'esqueci'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error('Email ou senha incorretos.')
      return
    }
    router.refresh()
    router.push('/dashboard')
  }

  const subtitle =
    mode === 'landing' ? 'Faça seu login pra acessar o app'
    : mode === 'esqueci' ? 'Vamos te enviar um link para criar uma nova senha.'
    : 'Entre com seu email e senha'

  return (
    <div className="min-h-screen bg-[#f2ede7] flex flex-col relative overflow-hidden">
      {/* Logo */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        <Image src="/images/login-logo-icon.svg" alt="Vora logo icon" width={28} height={28} className="object-contain" />
        <Image src="/images/vora-wordmark.svg" alt="VORA" width={80} height={22} className="object-contain" />
      </div>

      {/* Hero illustration */}
      <div className="flex-1 flex items-center justify-center pt-20 pb-4">
        <Image src="/images/login-hero.svg" alt="Ilustração Vora" width={280} height={280} className="object-contain" priority />
      </div>

      {/* Bottom content */}
      <div className="bg-[#f2ede7] px-[30px] pt-[40px] pb-[48px] flex flex-col gap-[29px]">
        <div className="flex flex-col gap-[15px]">
          <h1 className="font-fraunces text-[32px] text-[#3c4a3c] leading-tight">
            {mode === 'esqueci' ? 'Esqueceu a senha?' : 'Veja seu mês antes dele acontecer.'}
          </h1>
          <p className="text-[16px] text-[#3c4a3c] font-normal leading-normal">{subtitle}</p>
        </div>

        {mode === 'esqueci' ? (
          <EsqueciSenha onBack={() => setMode('login')} />
        ) : mode === 'landing' ? (
          <div className="flex flex-col gap-[12px]">
            <button
              onClick={() => setMode('login')}
              className="w-full bg-[#8faf8f] text-[#f9f7f4] font-fraunces text-[16px] py-[12px] px-[26px] text-center transition-opacity hover:opacity-90 active:opacity-80"
            >
              Fazer login
            </button>
            <button
              onClick={() => router.push('/cadastro')}
              className="w-full bg-[#dce6dc] text-[#4f604f] font-fraunces text-[16px] py-[12px] px-[26px] text-center transition-opacity hover:opacity-90 active:opacity-80"
            >
              Criar conta
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-[12px]">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[14px] text-[#3c4a3c] font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full border border-[#ece4db] bg-white text-[#3c4a3c] px-4 py-3 text-[16px] outline-none focus:border-[#8faf8f] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between">
                <label className="text-[14px] text-[#3c4a3c] font-medium">Senha</label>
                <button
                  type="button"
                  onClick={() => setMode('esqueci')}
                  className="text-[13px] text-[#8faf8f] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-[#ece4db] bg-white text-[#3c4a3c] px-4 py-3 text-[16px] outline-none focus:border-[#8faf8f] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8faf8f] text-[#f9f7f4] font-fraunces text-[16px] py-[12px] px-[26px] text-center transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 mt-1"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={() => setMode('landing')}
              className="text-[14px] text-[#6b7280] text-center underline"
            >
              Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Sub-componente de recuperação de senha ─────────────────────────────────────

function EsqueciSenha({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
    })
    setLoading(false)
    if (error) {
      toast.error('Não foi possível enviar o email. Tente novamente.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-[16px]">
        <div className="flex flex-col gap-[6px]">
          <p className="text-[16px] text-[#3c4a3c]">
            Enviamos um link para <strong>{email}</strong>. Clique nele para criar uma nova senha.
          </p>
          <p className="text-[13px] text-[#6b7280]">Verifique também a caixa de spam.</p>
        </div>
        <button onClick={onBack} className="text-[14px] text-[#6b7280] text-center underline">
          Voltar ao login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[12px]">
      <div className="flex flex-col gap-[6px]">
        <label className="text-[14px] text-[#3c4a3c] font-medium">Email da sua conta</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          className="w-full border border-[#ece4db] bg-white text-[#3c4a3c] px-4 py-3 text-[16px] outline-none focus:border-[#8faf8f] transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#8faf8f] text-[#f9f7f4] font-fraunces text-[16px] py-[12px] px-[26px] text-center transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 mt-1"
      >
        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
      </button>
      <button type="button" onClick={onBack} className="text-[14px] text-[#6b7280] text-center underline">
        Voltar ao login
      </button>
    </form>
  )
}
