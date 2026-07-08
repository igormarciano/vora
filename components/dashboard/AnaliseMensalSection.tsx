'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { gerarAnaliseSobDemanda } from '@/app/(auth)/dashboard/actions'
import { AnaliseMensalCard } from '@/components/dashboard/AnaliseMensalCard'
import type { AnaliseMensal } from '@/types'

interface AnaliseMensalSectionProps {
  analiseInicial: AnaliseMensal | null
}

export function AnaliseMensalSection({ analiseInicial }: AnaliseMensalSectionProps) {
  const [analise, setAnalise] = useState(analiseInicial)
  const [loading, setLoading] = useState(false)

  async function handleAnalisar() {
    setLoading(true)
    const resultado = await gerarAnaliseSobDemanda()
    setLoading(false)

    if ('error' in resultado) {
      toast.error(resultado.error)
      return
    }
    setAnalise(resultado.analise)
  }

  if (analise) {
    return (
      <div className="mt-8">
        <AnaliseMensalCard analise={analise} onReanalisar={handleAnalisar} reanalisando={loading} />
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-6 border border-[#ece4db] bg-white flex flex-col sm:flex-row sm:items-center gap-5 mt-8">
      <div className="w-12 h-12 rounded-xl bg-[#dce6dc] flex items-center justify-center shrink-0">
        <Sparkles size={22} className="text-[#8faf8f]" />
      </div>
      <div className="flex-1">
        <h2 className="font-fraunces text-[18px] text-[#3c4a3c] leading-tight mb-1">
          Veja dicas e um resumo da sua vida financeira
        </h2>
        <p className="text-[13px] text-[#6b7280] leading-relaxed">
          A Vora analisa seus gastos, receitas e investimentos deste mês e te devolve uma leitura direta do que importa.
        </p>
      </div>
      <button
        onClick={handleAnalisar}
        disabled={loading}
        className="font-fraunces text-[15px] px-5 py-3 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-60 shrink-0"
        style={{ background: 'linear-gradient(135deg, #57cc99, #38a3a5)', color: '#f9f7f4' }}
      >
        {loading ? 'Analisando...' : 'Analisar minhas finanças'}
      </button>
    </div>
  )
}
