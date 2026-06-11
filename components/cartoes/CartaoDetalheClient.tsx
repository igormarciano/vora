'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Download } from 'lucide-react'
import type { Cartao, GastoFixo } from '@/types'
import { formatCurrency } from '@/lib/engine'
import type { CompraCartao } from '@/app/(auth)/gastos/cartoes/[id]/page'

interface CartaoDetalheClientProps {
  cartao: Cartao
  compras: CompraCartao[]
  fixosVinculados: GastoFixo[]
  totalFaturaAtual: number
  totalParceladoFuturo: number
  valorUtilizado: number
  disponivel: number | null
}

/**
 * Central de Cartões — página dedicada por cartão (Change Request 001, item 2).
 * Mostra cabeçalho com limite/disponível/utilizado, indicadores da fatura e lista
 * completa de compras associadas, com checkboxes para seleção múltipla
 * (preparação para ações em lote, exportação e filtros futuros).
 */
export function CartaoDetalheClient({
  cartao, compras, fixosVinculados, totalFaturaAtual, totalParceladoFuturo, valorUtilizado, disponivel,
}: CartaoDetalheClientProps) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())

  function toggleSelecionado(id: string) {
    setSelecionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTodos() {
    setSelecionados(prev => (prev.size === compras.length ? new Set() : new Set(compras.map(c => c.id))))
  }

  const cor = cartao.color ?? '#8faf8f'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/gastos"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#6b7280] hover:text-[#3c4a3c] transition-colors mb-4"
      >
        <ArrowLeft size={15} /> Voltar para Gastos
      </Link>

      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl border border-[#ece4db] p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cor }}>
            <CreditCard size={20} className="text-white" />
          </div>
          <h1 className="font-fraunces text-[24px] text-[#3c4a3c]">{cartao.nome}</h1>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <InfoBox label="Limite" value={cartao.limite != null ? formatCurrency(cartao.limite) : 'Sem limite'} />
          <InfoBox
            label="Disponível"
            value={disponivel != null ? formatCurrency(disponivel) : '—'}
            destaque={disponivel != null && disponivel < 0 ? 'negativo' : undefined}
          />
          <InfoBox label="Valor utilizado" value={formatCurrency(valorUtilizado)} />
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <IndicadorCard label="Fatura atual" value={formatCurrency(totalFaturaAtual)} />
        <IndicadorCard label="Parcelado futuro" value={formatCurrency(totalParceladoFuturo)} />
        <IndicadorCard label="Compras" value={String(compras.length)} />
      </div>

      {fixosVinculados.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#ece4db] px-4 mb-5">
          <p className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide pt-3 pb-1">
            Gastos fixos vinculados (este mês)
          </p>
          {fixosVinculados.map(f => (
            <div key={f.id} className="flex items-center justify-between py-2.5 border-b border-[#f2ede7] last:border-0">
              <div className="min-w-0">
                <span className="text-[14px] text-[#3c4a3c]">{f.nome}</span>
                <span className="text-[11px] text-[#9ca3af] ml-2">{f.categoria}</span>
              </div>
              <span className="text-[14px] font-medium text-[#3c4a3c] shrink-0">{formatCurrency(f.valor)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Lista de compras */}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h2 className="font-fraunces text-[18px] text-[#3c4a3c]">Compras</h2>
        {compras.length > 0 && (
          <div className="flex items-center gap-3">
            {selecionados.size > 0 && (
              <span className="text-[12px] text-[#6b7280]">
                {selecionados.size} selecionada{selecionados.size > 1 ? 's' : ''}
              </span>
            )}
            <button
              disabled={selecionados.size === 0}
              title="Em breve: exportação e ações em lote"
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#8faf8f] hover:text-[#4f604f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Exportar
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#ece4db] px-4">
        {compras.length === 0 ? (
          <p className="text-[14px] text-[#9ca3af] py-6 text-center">Nenhuma compra associada a este cartão ainda.</p>
        ) : (
          <>
            <div className="flex items-center gap-3 py-2.5 border-b border-[#f2ede7]">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#8faf8f]"
                checked={selecionados.size === compras.length}
                onChange={toggleTodos}
              />
              <span className="text-[12px] text-[#6b7280]">Selecionar todas</span>
            </div>
            {compras.map(compra => (
              <CompraRow
                key={compra.id}
                compra={compra}
                checked={selecionados.has(compra.id)}
                onToggle={() => toggleSelecionado(compra.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function CompraRow({ compra, checked, onToggle }: { compra: CompraCartao; checked: boolean; onToggle: () => void }) {
  const parcelaLabel = compra.totalParcelas ? `${compra.parcelaAtual}/${compra.totalParcelas}x` : null
  const valorExibido = compra.totalParcelas && compra.valorParcela != null ? compra.valorParcela : compra.valor
  const data = new Date(compra.createdAt).toLocaleDateString('pt-BR')

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#f2ede7] last:border-0">
      <input type="checkbox" className="w-4 h-4 accent-[#8faf8f] shrink-0" checked={checked} onChange={onToggle} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-medium text-[#3c4a3c] truncate">{compra.nome}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f2ede7] text-[#6b7280]">{compra.categoria}</span>
          {compra.quitado && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#dce6dc] text-[#4f604f]">Quitado</span>
          )}
        </div>
        <p className="text-[12px] text-[#9ca3af] mt-0.5">{data}</p>
        {compra.description && <p className="text-[12px] text-[#9ca3af] mt-0.5 truncate">{compra.description}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-[14px] font-medium text-[#3c4a3c]">
          {formatCurrency(valorExibido)}{compra.totalParcelas ? '/mês' : ''}
        </p>
        {parcelaLabel && (
          <p className="text-[12px] text-[#9ca3af]">{parcelaLabel} · total {formatCurrency(compra.valor)}</p>
        )}
      </div>
    </div>
  )
}

function InfoBox({ label, value, destaque }: { label: string; value: string; destaque?: 'negativo' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide">{label}</span>
      <span className={`text-[15px] font-medium ${destaque === 'negativo' ? 'text-[#dc2626]' : 'text-[#3c4a3c]'}`}>{value}</span>
    </div>
  )
}

function IndicadorCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#dce6dc] rounded-2xl px-4 py-3 flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-[#4f604f] uppercase tracking-wide">{label}</span>
      <span className="font-fraunces text-[18px] text-[#3c4a3c]">{value}</span>
    </div>
  )
}
