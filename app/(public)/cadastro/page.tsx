'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function CadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Conta criada! Bem-vinda à Vora.')
    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#f2ede7] flex flex-col relative overflow-hidden">
      {/* Logo */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        <Image
          src="/images/login-logo-icon.png"
          alt="Vora logo icon"
          width={28}
          height={28}
          className="object-contain"
        />
        <Image
          src="/images/vora-wordmark.png"
          alt="VORA"
          width={80}
          height={22}
          className="object-contain"
        />
      </div>

      {/* Hero illustration */}
      <div className="flex-1 flex items-center justify-center pt-20 pb-4">
        <Image
          src="/images/onboarding1-hero.png"
          alt="Ilustração Vora"
          width={250}
          height={250}
          className="object-contain"
          priority
        />
      </div>

      {/* Bottom content */}
      <div className="bg-[#f2ede7] px-[30px] pt-[40px] pb-[48px] flex flex-col gap-[24px]">
        <div className="flex flex-col gap-[8px]">
          <h1 className="font-fraunces text-[32px] text-[#3c4a3c] leading-tight">
            Crie sua conta.
          </h1>
          <p className="text-[16px] text-[#3c4a3c] leading-normal">
            É rápido. Prometo.
          </p>
        </div>

        <form onSubmit={handleCadastro} className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] text-[#3c4a3c] font-medium">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Como posso te chamar?"
              required
              className="w-full border border-[#ece4db] bg-white text-[#3c4a3c] px-4 py-3 text-[16px] outline-none focus:border-[#8faf8f] transition-colors"
            />
          </div>
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
            <label className="text-[14px] text-[#3c4a3c] font-medium">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
              className="w-full border border-[#ece4db] bg-white text-[#3c4a3c] px-4 py-3 text-[16px] outline-none focus:border-[#8faf8f] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8faf8f] text-[#f9f7f4] font-fraunces text-[16px] py-[12px] px-[26px] text-center transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 mt-1"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-[14px] text-[#6b7280] text-center underline"
          >
            Já tenho conta
          </button>
        </form>
      </div>
    </div>
  )
}
