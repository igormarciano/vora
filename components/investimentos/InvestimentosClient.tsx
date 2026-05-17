'use client'

import type { Investimento } from '@/types'
import { deletarInvestimento } from '@/app/(auth)/investimentos/actions'
import { FormInvestimento } from './FormInvestimento'
import { ModalDelete } from '@/components/controle/ModalDelete'
import { formatCurrency } from '@/lib/engine'

interface InvestimentosClientProps {
  investimentos: Investimento[]
}

const CATEGORIAS = {
  renda_fixa: { label: 'Renda Fixa', emoji: '🏦', cor: '#dce6dc' },
  renda_variavel: { label: 'Renda Variável', emoji: '📈', cor: '#dce6dc' },
  cripto: { label: 'Cripto', emoji: '₿', cor: '#fef9c3' },
  credito_privado: { label: 'Crédito Privado', emoji: '📄', cor: '#ede9fe' },
  internacional: { label: 'Internacional', emoji: '🌎', cor: '#dbeafe' },
} as const

export function InvestimentosClient({ investimentos }: InvestimentosClientProps) {
  const total = investimentos.reduce((s, i) => s + i.valor, 0)

  const porCategoria = Object.entries(CATEGORIAS).map(([key, cfg]) => {
    const items = investimentos.filter(i => i.categoria === key)
    const subtotal = items.reduce((s, i) => s + i.valor, 0)
    return { key, cfg, items, subtotal }
  }).filter(g => g.items.length > 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-fraunces text-[32px] text-[#3c4a3c]">Investimentos</h1>
          {total > 0 && (
            <p className="text-[15px] text-[#6b7280] mt-1">
              Patrimônio total: <span className="font-medium text-[#3c4a3c]">{formatCurrency(total)}</span>
            </p>
          )}
        </div>
        <FormInvestimento />
      </div>

      {investimentos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#ece4db] px-6 py-10 text-center">
          <p className="text-[32px] mb-3">📊</p>
          <p className="font-fraunces text-[18px] text-[#3c4a3c] mb-1">Nenhum investimento ainda</p>
          <p className="text-[14px] text-[#9ca3af]">Adicione seus investimentos para acompanhar o patrimônio.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Distribuição */}
          <div className="bg-white rounded-2xl border border-[#ece4db] p-4">
            <p className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide mb-3">Distribuição</p>
            <div className="flex gap-1.5 h-3 rounded-full overflow-hidden mb-3">
              {porCategoria.map(({ key, subtotal }) => (
                <div
                  key={key}
                  style={{ width: `${(subtotal / total) * 100}%`, backgroundColor: CATEGORIAS[key as keyof typeof CATEGORIAS].cor === '#dce6dc' ? '#8faf8f' : CATEGORIAS[key as keyof typeof CATEGORIAS].cor }}
                  className="rounded-full"
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {porCategoria.map(({ key, cfg, subtotal }) => (
                <div key={key} className="flex items-center gap-1.5 text-[12px] text-[#6b7280]">
                  <span>{cfg.emoji}</span>
                  <span>{cfg.label}</span>
                  <span className="font-medium text-[#3c4a3c]">{Math.round((subtotal / total) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lista por categoria */}
          {porCategoria.map(({ key, cfg, items, subtotal }) => (
            <div key={key} className="bg-white rounded-2xl border border-[#ece4db] px-4">
              <div className="flex items-center justify-between py-3 border-b border-[#f2ede7]">
                <div className="flex items-center gap-2">
                  <span className="text-[16px]">{cfg.emoji}</span>
                  <span className="font-medium text-[14px] text-[#3c4a3c]">{cfg.label}</span>
                </div>
                <span className="text-[14px] font-medium text-[#6b7280]">{formatCurrency(subtotal)}</span>
              </div>
              {items.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 py-3.5 border-b border-[#f2ede7] last:border-0">
                  <div className="flex-1 min-w-0">
                    <span className="text-[15px] font-medium text-[#3c4a3c] block truncate">{inv.nome}</span>
                    <div className="flex gap-3 mt-0.5 flex-wrap">
                      {inv.rentabilidade_anual && (
                        <span className="text-[12px] text-[#9ca3af]">{inv.rentabilidade_anual}% a.a.</span>
                      )}
                      {inv.liquidez && (
                        <span className="text-[12px] text-[#9ca3af]">Liquidez: {inv.liquidez}</span>
                      )}
                      {inv.vencimento && (
                        <span className="text-[12px] text-[#9ca3af]">
                          Vence: {new Date(inv.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[15px] font-medium text-[#3c4a3c] shrink-0">{formatCurrency(inv.valor)}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <FormInvestimento item={inv} />
                    <ModalDelete label={inv.nome} onConfirm={() => deletarInvestimento(inv.id)} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
