'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { CreditCard, Plus, ChevronDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import type { GastoFixo, GastoVariavel, Cartao, CustomCategory } from '@/types'
import {
  deletarGastoFixo, deletarGastoVariavel, criarCartao, deletarCartao, editarCorCartao,
  alternarPagoGastoFixo, alternarPagoGastoVariavel,
} from '@/app/(auth)/controle/actions'
import { FormGastoFixo } from '@/components/controle/FormGastoFixo'
import { FormGastoVariavel } from '@/components/controle/FormGastoVariavel'
import { ModalDelete } from '@/components/controle/ModalDelete'
import { ModalAdicionarGasto } from './ModalAdicionarGasto'
import { GastoCard } from './GastoCard'
import { formatCurrency, deslocarMesReferencia, formatarMesReferencia, corComOpacidade } from '@/lib/engine'

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

/** Navegação entre meses — atualiza o parâmetro `mes` na URL, recarregando os dados via server component. */
function MonthNavigator({ mes }: { mes: string }) {
  const router = useRouter()
  const pathname = usePathname()

  function navegar(novoMes: string) {
    router.push(`${pathname}?mes=${novoMes}`)
  }

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <button
        onClick={() => navegar(deslocarMesReferencia(mes, -1))}
        className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#3c4a3c] hover:bg-[#f2ede7] transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="font-fraunces text-[17px] text-[#3c4a3c] capitalize min-w-[180px] text-center">
        {formatarMesReferencia(mes)}
      </span>
      <button
        onClick={() => navegar(deslocarMesReferencia(mes, 1))}
        className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#3c4a3c] hover:bg-[#f2ede7] transition-colors"
        aria-label="Próximo mês"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

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

  return (
    <MesGastosContext.Provider value={mes}>
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-fraunces text-[32px] text-[#3c4a3c]">Gastos</h1>
      </div>

      <MonthNavigator mes={mes} />

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

      {/* CTA primário (Change Request 003, item 4) — acima da listagem, em destaque */}
      <div className="mb-5">
        <ModalAdicionarGasto
          cartoes={cartoes}
          customCategories={customCategories}
          defaultTipo={subTab === 'Fixos' ? 'fixo' : 'variavel'}
          variant="primary"
          label={subTab === 'Fixos' ? 'Adicionar Gasto Fixo' : 'Adicionar Gasto'}
          mesSelecionado={mes}
          onSuccess={() => {}}
        />
      </div>

      {subTab === 'Fixos' && (
        <FixosSection gastos={gastosFixos} cartoes={cartoes} customCategories={customCategories} total={totalFixos} />
      )}
      {subTab === 'Variáveis' && (
        <VariaveisSection gastos={gastosVariaveis} cartoes={cartoes} customCategories={customCategories} total={totalVariaveis} />
      )}
    </div>
    </MesGastosContext.Provider>
  )
}

// ── Fixos ─────────────────────────────────────────────────────────────────────

function FixosSection({ gastos, cartoes, customCategories, total }: { gastos: GastoFixo[]; cartoes: Cartao[]; customCategories: CustomCategory[]; total: number }) {
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
      <TotalBlock label="Total em gastos fixos" value={total} />

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

      <div className="bg-white rounded-2xl border border-[#ece4db] px-4">
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

function VariaveisSection({ gastos, cartoes, customCategories, total }: { gastos: GastoVariavel[]; cartoes: Cartao[]; customCategories: CustomCategory[]; total: number }) {
  const [agrupamento, setAgrupamento] = useState<Agrupamento>('padrao')
  const [showCartoes, setShowCartoes] = useState(false)
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

// ── Gerenciar cartões (inline, dentro de Variáveis) ───────────────────────────

// Item 3.9: paleta predefinida com cores do design system Vora
const PALETA_CARTOES = [
  { nome: 'Sálvia', valor: '#8faf8f' },
  { nome: 'Verde escuro', valor: '#3c4a3c' },
  { nome: 'Verde-claro', valor: '#a5bfa5' },
  { nome: 'Menta', valor: '#57cc99' },
  { nome: 'Petróleo', valor: '#38a3a5' },
  { nome: 'Areia', valor: '#d7cfc7' },
  { nome: 'Âmbar', valor: '#f59e0b' },
  { nome: 'Coral', valor: '#dc2626' },
  // Change Request 003, item 2 — novas opções de personalização
  { nome: 'Roxo', valor: '#7C3AED' },
  { nome: 'Laranja', valor: '#F97316' },
]

function GerenciarCartoes({ cartoes }: { cartoes: Cartao[] }) {
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [color, setColor] = useState<string>(PALETA_CARTOES[0].valor)
  const [loading, setLoading] = useState(false)

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setLoading(true)
    const result = await criarCartao({ nome: nome.trim(), color })
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Cartão adicionado!')
    setNome('')
    setColor(PALETA_CARTOES[0].valor)
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
        <form onSubmit={handleCriar} className="flex flex-col gap-3 mb-3 bg-white border border-[#ece4db] rounded-xl p-3">
          <div className="flex gap-2">
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
          </div>
          <PaletaCores value={color} onChange={setColor} />
        </form>
      )}

      {cartoes.length === 0 ? (
        <p className="text-[13px] text-[#9ca3af] text-center py-2">Nenhum cartão cadastrado ainda.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {cartoes.map(cartao => <CartaoRow key={cartao.id} cartao={cartao} />)}
        </div>
      )}
    </div>
  )
}

function PaletaCores({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] text-[#6b7280]">Cor do cartão</span>
      <div className="flex gap-2 flex-wrap">
        {PALETA_CARTOES.map(c => (
          <button
            key={c.valor}
            type="button"
            title={c.nome}
            onClick={() => onChange(c.valor)}
            className="w-7 h-7 rounded-full transition-transform"
            style={{
              backgroundColor: c.valor,
              outline: value === c.valor ? '2px solid #3c4a3c' : 'none',
              outlineOffset: '2px',
              transform: value === c.valor ? 'scale(1.08)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function CartaoRow({ cartao }: { cartao: Cartao }) {
  const [editingColor, setEditingColor] = useState(false)
  const [color, setColor] = useState(cartao.color ?? PALETA_CARTOES[0].valor)
  const [saving, setSaving] = useState(false)

  async function handlePickColor(novaCor: string) {
    setColor(novaCor)
    setSaving(true)
    const result = await editarCorCartao(cartao.id, novaCor)
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    setEditingColor(false)
  }

  // Change Request 003, item 3 — o cartão usa a própria cor como fundo translúcido
  return (
    <div
      className="flex flex-col gap-2 rounded-lg px-3 py-2 border"
      style={{
        backgroundColor: corComOpacidade(color, 0.12),
        borderColor: corComOpacidade(color, 0.28),
      }}
    >
      <div className="flex items-center justify-between">
        <Link href={`/gastos/cartoes/${cartao.id}`} className="flex items-center gap-2 text-[14px] text-[#3c4a3c] hover:text-[#4f604f] transition-colors min-w-0">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <CreditCard size={15} className="text-[#6b7280] shrink-0" />
          <span className="truncate">{cartao.nome}</span>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setEditingColor(v => !v)}
            disabled={saving}
            className="text-[12px] text-[#8faf8f] hover:text-[#4f604f] transition-colors px-2 py-1"
          >
            Cor
          </button>
          <ModalDelete label={cartao.nome} onConfirm={() => deletarCartao(cartao.id)} />
        </div>
      </div>
      {editingColor && <PaletaCores value={color} onChange={handlePickColor} />}
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
