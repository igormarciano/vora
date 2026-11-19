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
    <div className="rounded-[20px] p-6 border border-hairline bg-white flex flex-col sm:flex-row sm:items-center gap-5 mt-8">
      <div className="w-12 h-12 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
        <Sparkles size={22} className="text-brand" />
      </div>
      <div className="flex-1">
        <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-ink leading-tight mb-1">
          Veja dicas e um resumo da sua vida financeira
        </h2>
        <p className="text-[13px] text-ink-2 leading-relaxed">
          A Vora analisa seus gastos, receitas e investimentos deste mês e te devolve uma leitura direta do que importa.
        </p>
      </div>
      <button
        onClick={handleAnalisar}
        disabled={loading}
        className="text-[15px] font-semibold tracking-[-0.02em] tabular px-5 py-3 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-60 shrink-0"
        style={{ background: '#3c4a3c', color: '#f9f7f4' }}
      >
        {loading ? 'Analisando...' : 'Analisar minhas finanças'}
      </button>
    </div>
  )
}
