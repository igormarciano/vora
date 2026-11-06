'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CreditCard, Plus, ChevronRight, Palette } from 'lucide-react'
import type { Cartao } from '@/types'
import { criarCartao, deletarCartao, editarCorCartao } from '@/app/(auth)/controle/actions'
import { ModalDelete } from '@/components/controle/ModalDelete'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Page, PageHeader, Panel, StatStrip } from '@/components/layout/Page'
import { MonthNavigator } from '@/components/layout/MonthNavigator'
import { formatCurrency, corComOpacidade, getMesReferencia } from '@/lib/engine'

export interface ResumoCartao {
  cartao: Cartao
  total: number
  totalFixos: number
  totalCompras: number
  parceladoFuturo: number
  qtdFixos: number
  qtdCompras: number
}

// Paleta predefinida com cores do design system Vora
export const PALETA_CARTOES = [
  { nome: 'Sálvia', valor: '#8faf8f' },
  { nome: 'Verde escuro', valor: '#3c4a3c' },
  { nome: 'Verde-claro', valor: '#a5bfa5' },
  { nome: 'Menta', valor: '#57cc99' },
  { nome: 'Petróleo', valor: '#38a3a5' },
  { nome: 'Areia', valor: '#d7cfc7' },
  { nome: 'Âmbar', valor: '#f59e0b' },
  { nome: 'Coral', valor: '#dc2626' },
  { nome: 'Roxo', valor: '#7C3AED' },
  { nome: 'Laranja', valor: '#F97316' },
]

export function CartoesClient({ mes, resumo }: { mes: string; resumo: ResumoCartao[] }) {
  const [showForm, setShowForm] = useState(false)

  const totalFaturas = resumo.reduce((s, r) => s + r.total, 0)
  const totalFixos = resumo.reduce((s, r) => s + r.totalFixos, 0)
  const futuro = resumo.reduce((s, r) => s + r.parceladoFuturo, 0)
  const query = mes === getMesReferencia() ? '' : `?mes=${mes}`

  return (
    <Page>
      <PageHeader
        title="Cartões"
        description="A fatura de cada cartão no mês: compras, parcelas e as contas fixas que você vinculou a ele."
        actions={
          <>
            <MonthNavigator mes={mes} />
            <button
              onClick={() => setShowForm(v => !v)}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium text-white shadow-sm hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #57cc99, #38a3a5)' }}
            >
              <Plus size={17} /> Novo cartão
            </button>
          </>
        }
      />

      <button
        onClick={() => setShowForm(v => !v)}
        className="sm:hidden w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium text-white"
        style={{ background: 'linear-gradient(135deg, #57cc99, #38a3a5)' }}
      >
        <Plus size={17} /> Novo cartão
      </button>

      {showForm && <NovoCartaoForm onDone={() => setShowForm(false)} />}

      {resumo.length > 0 && (
        <div className="mb-6">
          <StatStrip
            items={[
              { label: 'Total em faturas', value: formatCurrency(totalFaturas) },
              { label: 'Contas fixas nos cartões', value: formatCurrency(totalFixos) },
              { label: 'Parcelas a vencer depois', value: formatCurrency(futuro), tone: 'muted' },
            ]}
          />
        </div>
      )}

      {resumo.length === 0 ? (
        <Panel className="px-6 py-12 text-center">
          <CreditCard size={28} className="mx-auto text-[#a5bfa5] mb-3" />
          <p className="font-fraunces text-[18px] text-[#3c4a3c] mb-1">Nenhum cartão ainda</p>
          <p className="text-[14px] text-[#9ca3af]">Cadastre seus cartões para ver a fatura de cada um, incluindo contas fixas vinculadas.</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {resumo.map(r => <CartaoTile key={r.cartao.id} resumo={r} query={query} />)}
        </div>
      )}
    </Page>
  )
}

function CartaoTile({ resumo, query }: { resumo: ResumoCartao; query: string }) {
  const { cartao } = resumo
  const [cor, setCor] = useState(cartao.color ?? PALETA_CARTOES[0].valor)
  const [editandoCor, setEditandoCor] = useState(false)
  const usoLimite = cartao.limite ? Math.min((resumo.total + resumo.parceladoFuturo) / cartao.limite, 1) : null

  async function trocarCor(nova: string) {
    setCor(nova)
    const result = await editarCorCartao(cartao.id, nova)
    if (result.error) { toast.error(result.error); return }
    setEditandoCor(false)
  }

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-4"
      style={{ backgroundColor: corComOpacidade(cor, 0.08), borderColor: corComOpacidade(cor, 0.28) }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cor }}>
          <CreditCard size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-[#3c4a3c] truncate">{cartao.nome}</p>
          <p className="text-[12px] text-[#6b7280]">
            {cartao.limite ? `Limite ${formatCurrency(cartao.limite)}` : 'Sem limite definido'}
          </p>
        </div>
        <button
          onClick={() => setEditandoCor(v => !v)}
          className="p-1.5 rounded text-[#6b7280] hover:text-[#3c4a3c] hover:bg-white/60"
          title="Trocar cor"
        >
          <Palette size={15} />
        </button>
        <ModalDelete label={cartao.nome} onConfirm={() => deletarCartao(cartao.id)} />
      </div>

      {editandoCor && <PaletaCores value={cor} onChange={trocarCor} />}

      <div>
        <p className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wide">Fatura do mês</p>
        <p className="font-fraunces text-[26px] text-[#3c4a3c] leading-tight">{formatCurrency(resumo.total)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[13px]">
        <div>
          <p className="text-[#6b7280]">Contas fixas</p>
          <p className="font-medium text-[#3c4a3c]">{formatCurrency(resumo.totalFixos)} <span className="text-[#9ca3af] font-normal">· {resumo.qtdFixos}</span></p>
        </div>
        <div>
          <p className="text-[#6b7280]">Compras e parcelas</p>
          <p className="font-medium text-[#3c4a3c]">{formatCurrency(resumo.totalCompras)} <span className="text-[#9ca3af] font-normal">· {resumo.qtdCompras}</span></p>
        </div>
      </div>

      {usoLimite != null && (
        <div>
          <div className="h-1.5 rounded-full bg-white/80 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${usoLimite * 100}%`, backgroundColor: usoLimite > 0.85 ? '#dc2626' : cor }} />
          </div>
          <p className="text-[11px] text-[#6b7280] mt-1">{Math.round(usoLimite * 100)}% do limite comprometido (fatura + parcelas futuras)</p>
        </div>
      )}

      <Link
        href={`/cartoes/${cartao.id}${query}`}
        className="mt-auto flex items-center justify-between text-[13px] font-medium text-[#4f604f] hover:text-[#3c4a3c] pt-3 border-t"
        style={{ borderColor: corComOpacidade(cor, 0.2) }}
      >
        Ver fatura completa <ChevronRight size={15} />
      </Link>
    </div>
  )
}

function NovoCartaoForm({ onDone }: { onDone: () => void }) {
  const [nome, setNome] = useState('')
  const [limite, setLimite] = useState<number | null>(null)
  const [color, setColor] = useState<string>(PALETA_CARTOES[0].valor)
  const [loading, setLoading] = useState(false)

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setLoading(true)
    const result = await criarCartao({ nome: nome.trim(), color, limite: limite ?? undefined })
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Cartão adicionado!')
    onDone()
  }

  return (
    <Panel className="p-5 mb-6">
      <form onSubmit={handleCriar} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-[#6b7280]">Nome do cartão</span>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Nubank, Itaú Black..."
              className="border border-[#ece4db] rounded-lg px-3 py-2 text-[14px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white"
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-[#6b7280]">Limite (opcional)</span>
            <CurrencyInput value={limite} onValueChange={setLimite} placeholder="R$ 0,00" className="border border-[#ece4db] rounded-lg px-3 py-2 text-[14px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white w-full" />
          </label>
        </div>
        <PaletaCores value={color} onChange={setColor} />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onDone} className="px-3 py-2 text-[13px] text-[#6b7280] hover:text-[#3c4a3c]">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-[13px] font-medium bg-[#8faf8f] text-white rounded-lg hover:opacity-90 disabled:opacity-60">
            {loading ? 'Salvando...' : 'Salvar cartão'}
          </button>
        </div>
      </form>
    </Panel>
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
