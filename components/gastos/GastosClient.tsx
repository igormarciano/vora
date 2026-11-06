'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import Link from 'next/link'
import { CreditCard, ChevronRight, Filter } from 'lucide-react'
import type { GastoFixo, GastoVariavel, Cartao, CustomCategory } from '@/types'
import {
  deletarGastoFixo, deletarGastoVariavel,
  alternarPagoGastoFixo, alternarPagoGastoVariavel,
} from '@/app/(auth)/controle/actions'
import { FormGastoFixo } from '@/components/controle/FormGastoFixo'
import { FormGastoVariavel } from '@/components/controle/FormGastoVariavel'
import { ModalDelete } from '@/components/controle/ModalDelete'
import { ModalAdicionarGasto } from './ModalAdicionarGasto'
import { GastoCard } from './GastoCard'
import { formatCurrency, corComOpacidade } from '@/lib/engine'
import { MonthNavigator } from '@/components/layout/MonthNavigator'
import { Page, PageHeader, StatStrip } from '@/components/layout/Page'

interface GastosClientProps {
  mes: string
  gastosFixos: GastoFixo[]
  gastosVariaveis: GastoVariavel[]
  cartoes: Cartao[]
  customCategories: CustomCategory[]
}

/**
 * Mês em foco na tela de Gastos — usado para gravar o status pago/pendente na
 * competência correta (CR003, item 5), sem propagar para outros meses.
 */
const MesGastosContext = createContext<string | undefined>(undefined)
const useMesGastos = () => useContext(MesGastosContext)

type SubTab = 'Fixos' | 'Variáveis'
type Agrupamento = 'padrao' | 'categoria' | 'cartao'
type StatusFiltro = 'todos' | 'pago' | 'pendente'
type PessoaFiltro = 'todos' | 'PF' | 'PJ'
type Ordenacao = 'recente' | 'antigo' | 'maior_valor' | 'menor_valor' | 'alfabetica'

const ORDENACOES: { key: Ordenacao; label: string }[] = [
  { key: 'recente', label: 'Mais recentes' },
  { key: 'antigo', label: 'Mais antigos' },
  { key: 'maior_valor', label: 'Maior valor' },
  { key: 'menor_valor', label: 'Menor valor' },
  { key: 'alfabetica', label: 'Ordem alfabética' },
]

function ordenarGastos<T extends { nome: string; valor: number; created_at: string }>(items: T[], ordenacao: Ordenacao): T[] {
  const copy = [...items]
  switch (ordenacao) {
    case 'recente': return copy.sort((a, b) => b.created_at.localeCompare(a.created_at))
    case 'antigo': return copy.sort((a, b) => a.created_at.localeCompare(b.created_at))
    case 'maior_valor': return copy.sort((a, b) => b.valor - a.valor)
    case 'menor_valor': return copy.sort((a, b) => a.valor - b.valor)
    case 'alfabetica': return copy.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }
}

const selectCls = 'border border-[#ece4db] rounded-lg px-2.5 py-1.5 text-[12px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white transition-colors'

interface FiltrosBarProps {
  categorias: string[]
  categoria: string | null
  onCategoriaChange: (c: string | null) => void
  status: StatusFiltro
  onStatusChange: (s: StatusFiltro) => void
  pessoa: PessoaFiltro
  onPessoaChange: (p: PessoaFiltro) => void
  ordenacao: Ordenacao
  onOrdenacaoChange: (o: Ordenacao) => void
  tiposPagamento?: { value: string; label: string }[]
  tipoPagamento?: string | null
  onTipoPagamentoChange?: (t: string | null) => void
  onLimpar: () => void
  ativos: number
}

function FiltrosBar({
  categorias, categoria, onCategoriaChange, status, onStatusChange, pessoa, onPessoaChange,
  ordenacao, onOrdenacaoChange, tiposPagamento, tipoPagamento, onTipoPagamentoChange,
  onLimpar, ativos,
}: FiltrosBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex items-center gap-1.5">
        <Filter size={14} className="text-[#6b7280]" />
        <span className="text-[12px] font-medium text-[#3c4a3c]">Filtros</span>
        {ativos > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#8faf8f] text-white text-[10px] font-semibold">
            {ativos}
          </span>
        )}
      </div>

      <select value={categoria ?? ''} onChange={e => onCategoriaChange(e.target.value || null)} className={selectCls}>
        <option value="">Todas categorias</option>
        {categorias.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <select value={status} onChange={e => onStatusChange(e.target.value as StatusFiltro)} className={selectCls}>
        <option value="todos">Pago e pendente</option>
        <option value="pago">Pago</option>
        <option value="pendente">Pendente</option>
      </select>

      <select value={pessoa} onChange={e => onPessoaChange(e.target.value as PessoaFiltro)} className={selectCls}>
        <option value="todos">Física e jurídica</option>
        <option value="PF">Pessoa física</option>
        <option value="PJ">Pessoa jurídica</option>
      </select>

      {tiposPagamento && (
        <select value={tipoPagamento ?? ''} onChange={e => onTipoPagamentoChange?.(e.target.value || null)} className={selectCls}>
          <option value="">Todas formas de pagamento</option>
          {tiposPagamento.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      )}

      <select value={ordenacao} onChange={e => onOrdenacaoChange(e.target.value as Ordenacao)} className={selectCls}>
        {ORDENACOES.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>

      {ativos > 0 && (
        <button onClick={onLimpar} className="text-[12px] font-medium text-[#8faf8f] hover:text-[#4f604f] transition-colors">
          Limpar filtros
        </button>
      )}
    </div>
  )
}

export function GastosClient({ mes, gastosFixos, gastosVariaveis, cartoes, customCategories }: GastosClientProps) {
  const [subTab, setSubTab] = useState<SubTab>('Fixos')

  const totalFixos = gastosFixos.reduce((s, g) => s + g.valor, 0)
  const totalVariaveis = gastosVariaveis.reduce((s, g) => {
    const valor = g.parcelado && g.valor_parcela != null ? g.valor_parcela : g.valor
    return s + valor
  }, 0)

  const pendente = gastosFixos.filter(g => !g.is_paid).reduce((s, g) => s + g.valor, 0)
    + gastosVariaveis.filter(g => !g.is_paid).reduce((s, g) => s + (g.parcelado && g.valor_parcela != null ? g.valor_parcela : g.valor), 0)

  return (
    <MesGastosContext.Provider value={mes}>
    <Page>
      <PageHeader
        title="Gastos"
        description="Contas fixas e gastos do dia a dia. Parcelas e recorrências aparecem sozinhas em cada mês."
        actions={<MonthNavigator mes={mes} />}
      />

      <div className="mb-6">
        <StatStrip
          items={[
            { label: 'Total do mês', value: formatCurrency(totalFixos + totalVariaveis) },
            { label: 'Fixos', value: formatCurrency(totalFixos) },
            { label: 'Variáveis', value: formatCurrency(totalVariaveis) },
            { label: 'Ainda a pagar', value: formatCurrency(pendente), tone: pendente > 0 ? undefined : 'muted' },
          ]}
        />
      </div>

      {/* Abas + CTA na mesma linha */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex gap-1 bg-[#f2ede7] rounded-xl p-1 sm:w-[280px]">
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
        <ModalAdicionarGasto
          cartoes={cartoes}
          customCategories={customCategories}
          defaultTipo={subTab === 'Fixos' ? 'fixo' : 'variavel'}
          variant="primary"
          label={subTab === 'Fixos' ? 'Novo gasto fixo' : 'Novo gasto'}
          mesSelecionado={mes}
          onSuccess={() => {}}
        />
      </div>

      {subTab === 'Fixos' && (
        <FixosSection gastos={gastosFixos} cartoes={cartoes} customCategories={customCategories} />
      )}
      {subTab === 'Variáveis' && (
        <VariaveisSection gastos={gastosVariaveis} cartoes={cartoes} customCategories={customCategories} />
      )}
    </Page>
    </MesGastosContext.Provider>
  )
}

// ── Fixos ─────────────────────────────────────────────────────────────────────

function FixosSection({ gastos, cartoes, customCategories }: { gastos: GastoFixo[]; cartoes: Cartao[]; customCategories: CustomCategory[] }) {
  const mes = useMesGastos()
  const [categoria, setCategoria] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusFiltro>('todos')
  const [pessoa, setPessoa] = useState<PessoaFiltro>('todos')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('recente')

  const categorias = useMemo(
    () => Array.from(new Set(gastos.map(g => g.categoria))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [gastos]
  )

  const filtrados = useMemo(() => {
    let result = gastos
    if (categoria) result = result.filter(g => g.categoria === categoria)
    if (status !== 'todos') result = result.filter(g => (status === 'pago' ? g.is_paid : !g.is_paid))
    if (pessoa !== 'todos') result = result.filter(g => g.person_type === pessoa)
    return ordenarGastos(result, ordenacao)
  }, [gastos, categoria, status, pessoa, ordenacao])

  const ativos = (categoria ? 1 : 0) + (status !== 'todos' ? 1 : 0) + (pessoa !== 'todos' ? 1 : 0)

  function limpar() {
    setCategoria(null); setStatus('todos'); setPessoa('todos'); setOrdenacao('recente')
  }

  return (
    <div>
      {gastos.length > 0 && (
        <FiltrosBar
          categorias={categorias}
          categoria={categoria} onCategoriaChange={setCategoria}
          status={status} onStatusChange={setStatus}
          pessoa={pessoa} onPessoaChange={setPessoa}
          ordenacao={ordenacao} onOrdenacaoChange={setOrdenacao}
          onLimpar={limpar} ativos={ativos}
        />
      )}

      <div className="bg-white rounded-2xl border border-[#ece4db] px-5">
        {gastos.length === 0 ? (
          <EmptyState text="Nenhum gasto fixo cadastrado ainda." />
        ) : filtrados.length === 0 ? (
          <EmptyState text="Nenhum gasto encontrado com os filtros selecionados." />
        ) : (
          filtrados.map(item => (
            <GastoCard
              key={item.id}
              nome={item.nome}
              valor={formatCurrency(item.valor)}
              badge={`${item.person_type === 'PJ' ? 'PJ · ' : ''}${item.categoria}`}
              sub={[
                item.vencimento ? `Vence dia ${item.vencimento}` : null,
                item.recorrente ? 'Recorrente' : null,
                item.vinculado_cartao_id ? `No cartão ${cartoes.find(c => c.id === item.vinculado_cartao_id)?.nome ?? ''}`.trim() : null,
              ].filter(Boolean).join(' · ') || undefined}
              description={item.description}
              isPaid={item.is_paid}
              onTogglePaid={paid => alternarPagoGastoFixo(item.id, paid, mes)}
              editButton={<FormGastoFixo item={item} cartoes={cartoes} customCategories={customCategories} onSuccess={() => {}} />}
              deleteButton={<ModalDelete label={item.nome} onConfirm={() => deletarGastoFixo(item.id)} />}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Variáveis ─────────────────────────────────────────────────────────────────

const TIPOS_PAGAMENTO = [
  { value: 'dinheiro', label: '💵 Dinheiro' },
  { value: 'debito', label: '💳 Débito' },
  { value: 'credito', label: '💳 Crédito' },
]

function VariaveisSection({ gastos, cartoes, customCategories }: { gastos: GastoVariavel[]; cartoes: Cartao[]; customCategories: CustomCategory[] }) {
  const [agrupamento, setAgrupamento] = useState<Agrupamento>('padrao')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusFiltro>('todos')
  const [pessoa, setPessoa] = useState<PessoaFiltro>('todos')
  const [tipoPagamento, setTipoPagamento] = useState<string | null>(null)
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('recente')

  const categorias = useMemo(
    () => Array.from(new Set(gastos.map(g => g.categoria))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [gastos]
  )

  const filtrados = useMemo(() => {
    let result = gastos
    if (categoria) result = result.filter(g => g.categoria === categoria)
    if (status !== 'todos') result = result.filter(g => (status === 'pago' ? g.is_paid : !g.is_paid))
    if (pessoa !== 'todos') result = result.filter(g => g.expense_nature === pessoa)
    if (tipoPagamento) result = result.filter(g => g.forma_pagamento === tipoPagamento)
    return ordenarGastos(result, ordenacao)
  }, [gastos, categoria, status, pessoa, tipoPagamento, ordenacao])

  const ativos = (categoria ? 1 : 0) + (status !== 'todos' ? 1 : 0) + (pessoa !== 'todos' ? 1 : 0) + (tipoPagamento ? 1 : 0)

  function limpar() {
    setCategoria(null); setStatus('todos'); setPessoa('todos'); setTipoPagamento(null); setOrdenacao('recente')
  }

  return (
    <div>
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

        <Link
          href="/cartoes"
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#6b7280] hover:text-[#3c4a3c] transition-colors"
        >
          <CreditCard size={14} />
          Ver faturas dos cartões
          <ChevronRight size={14} />
        </Link>
      </div>

      {gastos.length > 0 && (
        <FiltrosBar
          categorias={categorias}
          categoria={categoria} onCategoriaChange={setCategoria}
          status={status} onStatusChange={setStatus}
          pessoa={pessoa} onPessoaChange={setPessoa}
          tiposPagamento={TIPOS_PAGAMENTO} tipoPagamento={tipoPagamento} onTipoPagamentoChange={setTipoPagamento}
          ordenacao={ordenacao} onOrdenacaoChange={setOrdenacao}
          onLimpar={limpar} ativos={ativos}
        />
      )}

      {agrupamento === 'padrao' && <ListaPadrao gastos={filtrados} cartoes={cartoes} customCategories={customCategories} />}
      {agrupamento === 'categoria' && <ListaPorCategoria gastos={filtrados} cartoes={cartoes} customCategories={customCategories} />}
      {agrupamento === 'cartao' && <ListaPorCartao gastos={filtrados} cartoes={cartoes} customCategories={customCategories} />}
    </div>
  )
}

function ListaPadrao({ gastos, cartoes, customCategories }: { gastos: GastoVariavel[]; cartoes: Cartao[]; customCategories: CustomCategory[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#ece4db] px-4">
      {gastos.length === 0 ? (
        <EmptyState text="Nenhum gasto variável cadastrado ainda." />
      ) : (
        gastos.map(item => <VariavelRow key={item.id} item={item} cartoes={cartoes} customCategories={customCategories} />)
      )}
    </div>
  )
}

function ListaPorCategoria({ gastos, cartoes, customCategories }: { gastos: GastoVariavel[]; cartoes: Cartao[]; customCategories: CustomCategory[] }) {
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
              {items.map(item => <VariavelRow key={item.id} item={item} cartoes={cartoes} customCategories={customCategories} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListaPorCartao({ gastos, cartoes, customCategories }: { gastos: GastoVariavel[]; cartoes: Cartao[]; customCategories: CustomCategory[] }) {
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
                {cartao?.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cartao.color }} />}
                <CreditCard size={14} className="text-[#6b7280]" />
                {cartao ? cartao.nome : 'Outros (sem cartão)'}
              </span>
              <span className="text-[13px] text-[#6b7280]">Subtotal: {formatCurrency(subtotal)}</span>
            </div>
            <div
              className="rounded-2xl border px-4"
              style={cartao?.color
                ? { backgroundColor: corComOpacidade(cartao.color, 0.10), borderColor: corComOpacidade(cartao.color, 0.25) }
                : { backgroundColor: 'white', borderColor: '#ece4db' }}
            >
              {items.map(item => <VariavelRow key={item.id} item={item} cartoes={cartoes} customCategories={customCategories} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VariavelRow({ item, cartoes, customCategories }: { item: GastoVariavel; cartoes: Cartao[]; customCategories: CustomCategory[] }) {
  const mes = useMesGastos()
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
      badge={`${item.expense_nature === 'PJ' ? 'PJ · ' : ''}${item.categoria}`}
      sub={[formaPagamentoLabel].filter(Boolean).join(' · ') || undefined}
      description={item.description}
      isPaid={item.is_paid}
      onTogglePaid={paid => alternarPagoGastoVariavel(item.id, paid, mes)}
      destaque={destaque}
      editButton={<FormGastoVariavel item={item} cartoes={cartoes} customCategories={customCategories} onSuccess={() => {}} />}
      deleteButton={<ModalDelete label={item.nome} onConfirm={() => deletarGastoVariavel(item.id)} />}
    />
  )
}

// ── Compartilhados ────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-[14px] text-[#9ca3af] py-6 text-center">{text}</p>
  )
}
