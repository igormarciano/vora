'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      toast.error('Não foi possível atualizar a senha. O link pode ter expirado.')
      return
    }
    toast.success('Senha atualizada com sucesso!')
    router.push('/dashboard')
    router.refresh()
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
        <div className="flex flex-col gap-[8px]">
          <h1 className="font-fraunces text-[32px] text-[#3c4a3c] leading-tight">
            Nova senha
          </h1>
          <p className="text-[16px] text-[#3c4a3c] leading-normal">
            Escolha uma senha segura para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] text-[#3c4a3c] font-medium">Nova senha</label>
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
          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] text-[#3c4a3c] font-medium">Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repita a senha"
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
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
