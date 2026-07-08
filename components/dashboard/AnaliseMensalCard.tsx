'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { AnaliseMensal } from '@/types'

interface AnaliseMensalCardProps {
  analise: AnaliseMensal
  onReanalisar?: () => void
  reanalisando?: boolean
}

const STATUS_CONFIG = {
  bom: { label: 'Mês em ordem', emoji: '🌿', cor: '#3c4a3c', bg: '#dce6dc', border: '#b4c9b4' },
  atencao: { label: 'Vale um olhar', emoji: '👀', cor: '#92651a', bg: '#fef9c3', border: '#fcd34d' },
  critico: { label: 'Precisa de atenção', emoji: '⚠️', cor: '#9f1c1c', bg: '#fee2e2', border: '#fca5a5' },
} as const

export function AnaliseMensalCard({ analise, onReanalisar, reanalisando }: AnaliseMensalCardProps) {
  const config = STATUS_CONFIG[analise.status_geral]
  const [aberto, setAberto] = useState(false)
  const temDetalhes = analise.insights.length > 0 || analise.recomendacoes.length > 0

  return (
    <div
      className="rounded-2xl p-6 border flex flex-col gap-4"
      style={{ backgroundColor: config.bg, borderColor: config.border }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.emoji}</span>
          <h2 className="font-fraunces text-[18px]" style={{ color: config.cor }}>
            Análise da Vora
          </h2>
        </div>
        <span
          className="text-[12px] font-medium px-2.5 py-1 rounded-full shrink-0"
          style={{ backgroundColor: '#ffffffaa', color: config.cor }}
        >
          {config.label}
        </span>
      </div>

      <p className="text-[15px] leading-relaxed" style={{ color: config.cor }}>
        {analise.resumo}
      </p>

      {temDetalhes && (
        <button
          onClick={() => setAberto(v => !v)}
          className="flex items-center gap-1.5 self-start text-[13px] font-medium transition-opacity hover:opacity-80"
          style={{ color: config.cor }}
        >
          {aberto ? 'Ocultar insights e recomendações' : 'Ver insights e recomendações'}
          <ChevronDown size={15} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </button>
      )}

      {aberto && (
        <div className="flex flex-col gap-5">
          {analise.insights.length > 0 && (
            <div className="flex flex-col gap-3">
              {analise.insights.map((insight, i) => (
                <div key={i} className="bg-white/60 rounded-xl p-4">
                  <p className="text-[14px] font-medium text-[#3c4a3c] mb-1">{insight.titulo}</p>
                  <p className="text-[13px] text-[#6b7280] leading-relaxed">{insight.descricao}</p>
                </div>
              ))}
            </div>
          )}

          {analise.recomendacoes.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: config.cor }}>
                O que fazer com isso
              </p>
              <ul className="flex flex-col gap-2">
                {analise.recomendacoes.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-[#3c4a3c]">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#8faf8f] shrink-0" />
                    <span>
                      {rec.acao}
                      {rec.impacto_estimado && (
                        <span className="text-[#6b7280]"> — {rec.impacto_estimado}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {onReanalisar && (
            <button
              onClick={onReanalisar}
              disabled={reanalisando}
              className="self-start text-[12px] font-medium underline underline-offset-2 disabled:opacity-60 transition-opacity"
              style={{ color: config.cor }}
            >
              {reanalisando ? 'Analisando de novo...' : 'Analisar de novo'}
            </button>
          )}
        </div>
      )}

      {!temDetalhes && onReanalisar && (
        <button
          onClick={onReanalisar}
          disabled={reanalisando}
          className="self-start text-[12px] font-medium underline underline-offset-2 disabled:opacity-60 transition-opacity"
          style={{ color: config.cor }}
        >
          {reanalisando ? 'Analisando de novo...' : 'Analisar de novo'}
        </button>
      )}
    </div>
  )
}
