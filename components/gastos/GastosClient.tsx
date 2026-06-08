'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CreditCard, Plus, ChevronDown } from 'lucide-react'
import type { GastoFixo, GastoVariavel, Cartao } from '@/types'
import {
  deletarGastoFixo, deletarGastoVariavel, criarCartao, deletarCartao,
  alternarPagoGastoFixo, alternarPagoGastoVariavel,
} from '@/app/(auth)/controle/actions'
import { FormGastoFixo } from '@/components/controle/FormGastoFixo'
import { FormGastoVariavel } from '@/components/controle/FormGastoVariavel'
import { ModalDelete } from '@/components/controle/ModalDelete'
import { ModalAdicionarGasto } from './ModalAdicionarGasto'
import { GastoCard } from './GastoCard'
import { formatCurrency } from '@/lib/engine'

interface GastosClientProps {
  gastosFixos: GastoFixo[]
  gastosVariaveis: GastoVariavel[]
  cartoes: Cartao[]
}

type SubTab = 'Fixos' | 'Variáveis'
type Agrupamento = 'padrao' | 'categoria' | 'cartao'

export function GastosClient({ gastosFixos, gastosVariaveis, cartoes }: GastosClientProps) {
  const [subTab, setSubTab] = useState<SubTab>('Fixos')

  const totalFixos = gastosFixos.reduce((s, g) => s + g.valor, 0)
  const totalVariaveis = gastosVariaveis.reduce((s, g) => s + g.valor, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-fraunces text-[32px] text-[#3c4a3c]">Gastos</h1>
        <ModalAdicionarGasto cartoes={cartoes} defaultTipo={subTab === 'Fixos' ? 'fixo' : 'variavel'} onSuccess={() => {}} />
      </div>

      {/* Subnavegação Fixos / Variáveis */}
      <div className="flex gap-1 bg-[#f2ede7] rounded-xl p-1 mb-6">
        {(['Fixos', 'Variáveis'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className="flex-1 py-2 text-[13px] font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: subTab === tab ? 'white' : 'transparent',
              color: subTab === tab ? '#3c4a3c' : '#6b7280',
              boxShadow: subTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {subTab === 'Fixos' && (
        <FixosSection gastos={gastosFixos} cartoes={cartoes} total={totalFixos} />
      )}
      {subTab === 'Variáveis' && (
        <VariaveisSection gastos={gastosVariaveis} cartoes={cartoes} total={totalVariaveis} />
      )}
    </div>
  )
}

// ── Fixos ─────────────────────────────────────────────────────────────────────

function FixosSection({ gastos, cartoes, total }: { gastos: GastoFixo[]; cartoes: Cartao[]; total: number }) {
  return (
    <div>
      <TotalBlock label="Total em gastos fixos" value={total} />
      <div className="bg-white rounded-2xl border border-[#ece4db] px-4">
        {gastos.length === 0 ? (
          <EmptyState text="Nenhum gasto fixo cadastrado ainda." />
        ) : (
          gastos.map(item => (
            <GastoCard
              key={item.id}
              nome={item.nome}
              valor={formatCurrency(item.valor)}
              badge={`${item.person_type === 'PJ' ? 'PJ · ' : ''}${item.categoria}`}
              sub={[
                item.vencimento ? `Vence dia ${item.vencimento}` : null,
                item.recorrente ? 'Recorrente' : null,
              ].filter(Boolean).join(' · ') || undefined}
              description={item.description}
              isPaid={item.is_paid}
              onTogglePaid={paid => alternarPagoGastoFixo(item.id, paid)}
              editButton={<FormGastoFixo item={item} cartoes={cartoes} onSuccess={() => {}} />}
              deleteButton={<ModalDelete label={item.nome} onConfirm={() => deletarGastoFixo(item.id)} />}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Variáveis ─────────────────────────────────────────────────────────────────

function VariaveisSection({ gastos, cartoes, total }: { gastos: GastoVariavel[]; cartoes: Cartao[]; total: number }) {
  const [agrupamento, setAgrupamento] = useState<Agrupamento>('padrao')
  const [showCartoes, setShowCartoes] = useState(false)

  return (
    <div>
      <TotalBlock label="Total em gastos variáveis" value={total} />

      {/* Seletor de agrupamento */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex gap-1 bg-[#f2ede7] rounded-xl p-1">
          {([
            { key: 'padrao', label: 'Padrão' },
            { key: 'categoria', label: 'Por categoria' },
            { key: 'cartao', label: 'Por cartão' },
          ] as const).map(opt => (
            <button
              key={opt.key}
              onClick={() => setAgrupamento(opt.key)}
              className="px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: agrupamento === opt.key ? 'white' : 'transparent',
                color: agrupamento === opt.key ? '#3c4a3c' : '#6b7280',
                boxShadow: agrupamento === opt.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCartoes(v => !v)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#6b7280] hover:text-[#3c4a3c] transition-colors"
        >
          <CreditCard size={14} />
          Gerenciar cartões
          <ChevronDown size={14} className={`transition-transform ${showCartoes ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showCartoes && <GerenciarCartoes cartoes={cartoes} />}

      {agrupamento === 'padrao' && <ListaPadrao gastos={gastos} cartoes={cartoes} />}
      {agrupamento === 'categoria' && <ListaPorCategoria gastos={gastos} cartoes={cartoes} />}
      {agrupamento === 'cartao' && <ListaPorCartao gastos={gastos} cartoes={cartoes} />}
    </div>
  )
}

function ListaPadrao({ gastos, cartoes }: { gastos: GastoVariavel[]; cartoes: Cartao[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#ece4db] px-4">
      {gastos.length === 0 ? (
        <EmptyState text="Nenhum gasto variável cadastrado ainda." />
      ) : (
        gastos.map(item => <VariavelRow key={item.id} item={item} cartoes={cartoes} />)
      )}
    </div>
  )
}

function ListaPorCategoria({ gastos, cartoes }: { gastos: GastoVariavel[]; cartoes: Cartao[] }) {
  const grupos = useMemo(() => {
    const map = new Map<string, GastoVariavel[]>()
    for (const g of gastos) {
      const key = g.categoria || '🔖 Outros'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(g)
    }
    return Array.from(map.entries())
  }, [gastos])

  if (gastos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#ece4db] px-4">
        <EmptyState text="Nenhum gasto variável cadastrado ainda." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {grupos.map(([categoria, items]) => {
        const subtotal = items.reduce((s, i) => s + i.valor, 0)
        return (
          <div key={categoria}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[13px] font-medium text-[#3c4a3c]">{categoria}</span>
              <span className="text-[13px] text-[#6b7280]">{formatCurrency(subtotal)}</span>
            </div>
            <div className="bg-white rounded-2xl border border-[#ece4db] px-4">
              {items.map(item => <VariavelRow key={item.id} item={item} cartoes={cartoes} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListaPorCartao({ gastos, cartoes }: { gastos: GastoVariavel[]; cartoes: Cartao[] }) {
  const grupos = useMemo(() => {
    const map = new Map<string, { cartao: Cartao | null; items: GastoVariavel[] }>()
    for (const g of gastos) {
      const cartao = g.cartao_id ? cartoes.find(c => c.id === g.cartao_id) ?? null : null
      const key = cartao ? cartao.id : 'outros'
      if (!map.has(key)) map.set(key, { cartao, items: [] })
      map.get(key)!.items.push(g)
    }
    // "Outros" por último
    return Array.from(map.values()).sort((a, b) => (a.cartao ? -1 : 1) - (b.cartao ? -1 : 1))
  }, [gastos, cartoes])

  if (gastos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#ece4db] px-4">
        <EmptyState text="Nenhum gasto variável cadastrado ainda." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {grupos.map(({ cartao, items }) => {
        const subtotal = items.reduce((s, i) => s + i.valor, 0)
        return (
          <div key={cartao?.id ?? 'outros'}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="flex items-center gap-2 text-[13px] font-medium text-[#3c4a3c]">
                <CreditCard size={14} className="text-[#6b7280]" />
                {cartao ? cartao.nome : 'Outros (sem cartão)'}
              </span>
              <span className="text-[13px] text-[#6b7280]">Subtotal: {formatCurrency(subtotal)}</span>
            </div>
            <div className="bg-white rounded-2xl border border-[#ece4db] px-4">
              {items.map(item => <VariavelRow key={item.id} item={item} cartoes={cartoes} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VariavelRow({ item, cartoes }: { item: GastoVariavel; cartoes: Cartao[] }) {
  const formaPagamentoLabel = item.forma_pagamento === 'dinheiro' ? '💵 Dinheiro' : item.forma_pagamento === 'debito' ? '💳 Débito' : '💳 Crédito'
  const parcela = item.parcelado && item.total_parcelas
    ? item.valor_parcela ?? item.valor / item.total_parcelas
    : null

  // Item 3.8: em compras parceladas, a parcela do mês é o valor em destaque;
  // o total da compra aparece como informação secundária.
  const destaque = parcela ? (
    <p className="text-[12px] text-[#9ca3af] -mt-0.5">
      {item.parcela_atual}/{item.total_parcelas}x · total {formatCurrency(item.valor)}
    </p>
  ) : undefined

  return (
    <GastoCard
      nome={item.nome}
      valor={parcela ? `${formatCurrency(parcela)}/mês` : formatCurrency(item.valor)}
      badge={item.categoria}
      sub={[formaPagamentoLabel].filter(Boolean).join(' · ') || undefined}
      description={item.description}
      isPaid={item.is_paid}
      onTogglePaid={paid => alternarPagoGastoVariavel(item.id, paid)}
      destaque={destaque}
      editButton={<FormGastoVariavel item={item} cartoes={cartoes} onSuccess={() => {}} />}
      deleteButton={<ModalDelete label={item.nome} onConfirm={() => deletarGastoVariavel(item.id)} />}
    />
  )
}

// ── Gerenciar cartões (inline, dentro de Variáveis) ───────────────────────────

function GerenciarCartoes({ cartoes }: { cartoes: Cartao[] }) {
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setLoading(true)
    const result = await criarCartao({ nome: nome.trim() })
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Cartão adicionado!')
    setNome('')
    setShowForm(false)
  }

  return (
    <div className="bg-[#f9f7f4] border border-[#ece4db] rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-medium text-[#3c4a3c]">Cartões cadastrados</span>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#8faf8f] hover:text-[#4f604f] transition-colors"
        >
          <Plus size={14} />Novo cartão
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCriar} className="flex gap-2 mb-3">
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Nome do cartão..."
            className="flex-1 border border-[#ece4db] rounded-lg px-3 py-2 text-[14px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white"
            autoFocus
          />
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-[13px] font-medium bg-[#8faf8f] text-white rounded-lg hover:opacity-90 disabled:opacity-60">
            {loading ? '...' : 'Salvar'}
          </button>
          <button type="button" onClick={() => { setShowForm(false); setNome('') }}
            className="px-3 py-2 text-[13px] text-[#6b7280] hover:text-[#3c4a3c]">
            Cancelar
          </button>
        </form>
      )}

      {cartoes.length === 0 ? (
        <p className="text-[13px] text-[#9ca3af] text-center py-2">Nenhum cartão cadastrado ainda.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {cartoes.map(cartao => (
            <div key={cartao.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-[#ece4db]">
              <span className="flex items-center gap-2 text-[14px] text-[#3c4a3c]">
                <CreditCard size={15} className="text-[#6b7280]" />
                {cartao.nome}
              </span>
              <ModalDelete label={cartao.nome} onConfirm={() => deletarCartao(cartao.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Compartilhados ────────────────────────────────────────────────────────────

function TotalBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#dce6dc] rounded-2xl px-5 py-4 mb-5 flex items-center justify-between">
      <span className="text-[14px] text-[#4f604f] font-medium">{label}</span>
      <span className="font-fraunces text-[20px] text-[#3c4a3c]">{formatCurrency(value)}</span>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-[14px] text-[#9ca3af] py-6 text-center">{text}</p>
  )
}
