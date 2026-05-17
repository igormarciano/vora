'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CreditCard, Plus } from 'lucide-react'
import type { Receita, GastoFixo, GastoVariavel, Cartao } from '@/types'
import { deletarReceita, deletarGastoFixo, deletarGastoVariavel, criarCartao, deletarCartao } from '@/app/(auth)/controle/actions'
import { FormReceita } from './FormReceita'
import { FormGastoFixo } from './FormGastoFixo'
import { FormGastoVariavel } from './FormGastoVariavel'
import { ModalDelete } from './ModalDelete'
import { formatCurrency } from '@/lib/engine'

interface ControleClientProps {
  receitas: Receita[]
  gastosFixos: GastoFixo[]
  gastosVariaveis: GastoVariavel[]
  cartoes: Cartao[]
}

const TABS = ['Receitas', 'Fixos', 'Variáveis', 'Cartões'] as const
type Tab = typeof TABS[number]

export function ControleClient({ receitas, gastosFixos, gastosVariaveis, cartoes }: ControleClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Receitas')
  const [showCartaoForm, setShowCartaoForm] = useState(false)
  const [cartaoNome, setCartaoNome] = useState('')
  const [cartaoLoading, setCartaoLoading] = useState(false)

  async function handleCriarCartao(e: React.FormEvent) {
    e.preventDefault()
    if (!cartaoNome.trim()) return
    setCartaoLoading(true)
    const result = await criarCartao({ nome: cartaoNome.trim() })
    setCartaoLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Cartão adicionado!')
    setCartaoNome('')
    setShowCartaoForm(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-fraunces text-[32px] text-[#3c4a3c] mb-6">Controle</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f2ede7] rounded-xl p-1 mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 text-[13px] font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? '#3c4a3c' : '#6b7280',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Receitas */}
      {activeTab === 'Receitas' && (
        <Section
          title="Receitas"
          addButton={<FormReceita onSuccess={() => {}} />}
        >
          {receitas.length === 0 ? (
            <EmptyState text="Nenhuma receita cadastrada ainda." />
          ) : (
            receitas.map(item => (
              <ItemRow
                key={item.id}
                nome={item.nome}
                valor={formatCurrency(item.valor)}
                badge={item.tipo === 'salario' ? 'Salário' : item.tipo === 'renda_extra' ? 'Renda extra' : (item.tipo_custom || 'Outros')}
                sub={item.recorrente ? 'Recorrente' : 'Não recorrente'}
                editButton={<FormReceita item={item} onSuccess={() => {}} />}
                deleteButton={
                  <ModalDelete label={item.nome} onConfirm={() => deletarReceita(item.id)} />
                }
              />
            ))
          )}
        </Section>
      )}

      {/* Gastos Fixos */}
      {activeTab === 'Fixos' && (
        <Section
          title="Gastos fixos"
          addButton={<FormGastoFixo cartoes={cartoes} onSuccess={() => {}} />}
        >
          {gastosFixos.length === 0 ? (
            <EmptyState text="Nenhum gasto fixo cadastrado ainda." />
          ) : (
            gastosFixos.map(item => (
              <ItemRow
                key={item.id}
                nome={item.nome}
                valor={formatCurrency(item.valor)}
                badge={item.categoria}
                sub={[
                  item.vencimento ? `Vence dia ${item.vencimento}` : null,
                  item.recorrente ? 'Recorrente' : null,
                ].filter(Boolean).join(' · ') || undefined}
                editButton={<FormGastoFixo item={item} cartoes={cartoes} onSuccess={() => {}} />}
                deleteButton={
                  <ModalDelete label={item.nome} onConfirm={() => deletarGastoFixo(item.id)} />
                }
              />
            ))
          )}
        </Section>
      )}

      {/* Gastos Variáveis */}
      {activeTab === 'Variáveis' && (
        <Section
          title="Gastos variáveis"
          addButton={<FormGastoVariavel cartoes={cartoes} onSuccess={() => {}} />}
        >
          {gastosVariaveis.length === 0 ? (
            <EmptyState text="Nenhum gasto variável cadastrado ainda." />
          ) : (
            gastosVariaveis.map(item => (
              <ItemRow
                key={item.id}
                nome={item.nome}
                valor={formatCurrency(item.valor)}
                badge={item.categoria}
                sub={[
                  item.forma_pagamento === 'dinheiro' ? '💵 Dinheiro' : item.forma_pagamento === 'debito' ? '💳 Débito' : '💳 Crédito',
                  item.parcelado && item.total_parcelas ? `${item.total_parcelas}x de ${formatCurrency(item.valor_parcela ?? item.valor / item.total_parcelas)}` : null,
                ].filter(Boolean).join(' · ') || undefined}
                editButton={<FormGastoVariavel item={item} cartoes={cartoes} onSuccess={() => {}} />}
                deleteButton={
                  <ModalDelete label={item.nome} onConfirm={() => deletarGastoVariavel(item.id)} />
                }
              />
            ))
          )}
        </Section>
      )}

      {/* Cartões */}
      {activeTab === 'Cartões' && (
        <Section
          title="Cartões de crédito"
          addButton={
            <button
              onClick={() => setShowCartaoForm(v => !v)}
              className="flex items-center gap-2 text-[14px] font-medium text-[#8faf8f] hover:text-[#4f604f] transition-colors"
            >
              <Plus size={16} /><span>Adicionar cartão</span>
            </button>
          }
        >
          {showCartaoForm && (
            <form onSubmit={handleCriarCartao} className="flex gap-2 mb-3">
              <input
                value={cartaoNome}
                onChange={e => setCartaoNome(e.target.value)}
                placeholder="Nome do cartão..."
                className="flex-1 border border-[#ece4db] rounded-lg px-3 py-2 text-[14px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white"
                autoFocus
              />
              <button
                type="submit"
                disabled={cartaoLoading}
                className="px-4 py-2 text-[13px] font-medium bg-[#8faf8f] text-white rounded-lg hover:opacity-90 disabled:opacity-60"
              >
                {cartaoLoading ? '...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCartaoForm(false); setCartaoNome('') }}
                className="px-3 py-2 text-[13px] text-[#6b7280] hover:text-[#3c4a3c]"
              >
                Cancelar
              </button>
            </form>
          )}

          {cartoes.length === 0 && !showCartaoForm ? (
            <EmptyState text="Nenhum cartão cadastrado ainda." />
          ) : (
            cartoes.map(cartao => (
              <div key={cartao.id} className="flex items-center justify-between py-3 border-b border-[#f2ede7] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#dce6dc] flex items-center justify-center">
                    <CreditCard size={16} className="text-[#3c4a3c]" />
                  </div>
                  <span className="text-[15px] text-[#3c4a3c]">{cartao.nome}</span>
                </div>
                <ModalDelete label={cartao.nome} onConfirm={() => deletarCartao(cartao.id)} />
              </div>
            ))
          )}
        </Section>
      )}
    </div>
  )
}

function Section({ title, addButton, children }: {
  title: string
  addButton: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-fraunces text-[20px] text-[#3c4a3c]">{title}</h2>
        {addButton}
      </div>
      <div className="bg-white rounded-2xl border border-[#ece4db] px-4">
        {children}
      </div>
    </div>
  )
}

function ItemRow({ nome, valor, badge, sub, editButton, deleteButton }: {
  nome: string
  valor: string
  badge?: string
  sub?: string
  editButton: React.ReactNode
  deleteButton: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-[#f2ede7] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[15px] font-medium text-[#3c4a3c] truncate">{nome}</span>
          {badge && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f2ede7] text-[#6b7280]">{badge}</span>
          )}
        </div>
        {sub && <p className="text-[12px] text-[#9ca3af] mt-0.5">{sub}</p>}
      </div>
      <span className="text-[15px] font-medium text-[#3c4a3c] shrink-0">{valor}</span>
      <div className="flex items-center gap-0.5 shrink-0">
        {editButton}
        {deleteButton}
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-[14px] text-[#9ca3af] py-6 text-center">{text}</p>
  )
}
