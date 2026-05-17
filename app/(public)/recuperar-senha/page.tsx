'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarSenhaPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
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
      toast.error('Não foi possível enviar o email. Tente novamente.')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#f2ede7] flex flex-col relative overflow-hidden">
      {/* Logo */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        <Image src="/images/login-logo-icon.svg" alt="Vora logo icon" width={28} height={28} className="object-contain" />
        <Image src="/images/vora-wordmark.svg" alt="VORA" width={80} height={22} className="object-contain" />
      </div>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center pt-20 pb-4">
        <Image
          src="/images/login-hero.svg"
          alt="Ilustração Vora"
          width={220}
          height={220}
          className="object-contain"
          priority
        />
      </div>

      {/* Bottom content */}
      <div className="bg-[#f2ede7] px-[30px] pt-[40px] pb-[48px] flex flex-col gap-[24px]">
        {sent ? (
          <>
            <div className="flex flex-col gap-[8px]">
              <h1 className="font-fraunces text-[32px] text-[#3c4a3c] leading-tight">
                Email enviado!
              </h1>
              <p className="text-[16px] text-[#3c4a3c] leading-relaxed">
                Mandamos um link para <strong>{email}</strong>. Clique nele para criar uma nova senha. Verifique também a caixa de spam.
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-[#8faf8f] text-[#f9f7f4] font-fraunces text-[16px] py-[12px] px-[26px] text-center transition-opacity hover:opacity-90 active:opacity-80"
            >
              Voltar ao login
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-[8px]">
              <h1 className="font-fraunces text-[32px] text-[#3c4a3c] leading-tight">
                Esqueceu a senha?
              </h1>
              <p className="text-[16px] text-[#3c4a3c] leading-normal">
                Sem problema. Vamos te enviar um link para criar uma nova.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-[12px]">
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8faf8f] text-[#f9f7f4] font-fraunces text-[16px] py-[12px] px-[26px] text-center transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 mt-1"
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-[14px] text-[#6b7280] text-center underline"
              >
                Voltar ao login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
