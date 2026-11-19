'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'
import type { GastoVariavel, Cartao, CustomCategory, PersonType } from '@/types'
import { criarGastoVariavel, editarGastoVariavel } from '@/app/(auth)/controle/actions'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { CategorySelect } from '@/components/controle/CategorySelect'

interface FormGastoVariavelProps {
  item?: GastoVariavel
  cartoes: Cartao[]
  customCategories?: CustomCategory[]
  onSuccess?: () => void
  /** Modo controlado: oculta o botão de gatilho e usa open/onOpenChange externos (usado pelo modal unificado) */
  hideTrigger?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Mês em foco na tela de Gastos — lançamento nunca retroativo (Change Request 003, item 6) */
  mesSelecionado?: string
}

const CATEGORIAS = [
  '🛒 Mercado', '🚌 Transporte', '💊 Farmácia', '👗 Roupas',
  '🍕 Restaurante', '🎭 Lazer', '💄 Beleza', '🐾 Pets',
  '📦 Compras online', '⛽ Combustível', '💼 Trabalho', '🔧 Outros',
]

export function FormGastoVariavel({ item, cartoes, customCategories = [], onSuccess, hideTrigger, open: openProp, onOpenChange, mesSelecionado }: FormGastoVariavelProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(item?.nome ?? '')
  const [valor, setValor] = useState<number | null>(item ? item.valor : null)
  const [categoria, setCategoria] = useState(item?.categoria ?? CATEGORIAS[0])
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'debito' | 'credito'>(
    item?.forma_pagamento ?? 'dinheiro'
  )
  const [cartaoId, setCartaoId] = useState(item?.cartao_id ?? '')
  const [parcelado, setParcelado] = useState(item?.parcelado ?? false)
  const [totalParcelas, setTotalParcelas] = useState(item?.total_parcelas ? String(item.total_parcelas) : '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [isPaid, setIsPaid] = useState(item?.is_paid ?? false)
  const [expenseNature, setExpenseNature] = useState<PersonType>(item?.expense_nature ?? 'PF')

  function resetForm() {
    if (!item) {
      setNome(''); setValor(null); setCategoria(CATEGORIAS[0])
      setFormaPagamento('dinheiro'); setCartaoId(''); setParcelado(false); setTotalParcelas('')
      setDescription(''); setIsPaid(false); setExpenseNature('PF')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valorNum = valor ?? 0
    if (valorNum <= 0) { toast.error('Valor inválido'); return }
    if (description.length > 500) { toast.error('Descrição muito longa (máx. 500 caracteres)'); return }

    const totalParcelasNum = parcelado ? parseInt(totalParcelas) : undefined
    if (parcelado && (!totalParcelasNum || totalParcelasNum < 2)) {
      toast.error('Informe o número de parcelas (mínimo 2)'); return
    }

    setLoading(true)
    const data = {
      nome, valor: valorNum, categoria, forma_pagamento: formaPagamento,
      cartao_id: formaPagamento === 'credito' ? cartaoId || undefined : undefined,
      parcelado,
      total_parcelas: totalParcelasNum,
      valor_parcela: parcelado && totalParcelasNum ? valorNum / totalParcelasNum : undefined,
      description: description.trim() || undefined,
      is_paid: isPaid,
      expense_nature: expenseNature,
    }
    const result = item
      ? await editarGastoVariavel(item.id, data)
      : await criarGastoVariavel({ ...data, mes_selecionado: mesSelecionado })
    setLoading(false)

    if (result.error) { toast.error(result.error); return }
    toast.success(item ? 'Gasto atualizado!' : 'Gasto adicionado!')
    setOpen(false)
    resetForm()
    onSuccess?.()
  }

  const valorParcela = parcelado && totalParcelas && valor && valor > 0
    ? (valor / parseInt(totalParcelas)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null

  return (
    <>
      {!hideTrigger && (
        <button
          onClick={() => setOpen(true)}
          className={item
            ? 'p-1.5 rounded text-ink-2 hover:text-ink hover:bg-fill transition-colors'
            : 'flex items-center gap-2 text-[14px] font-medium text-brand hover:text-brand-strong transition-colors'
          }
          title={item ? 'Editar' : undefined}
        >
          {item ? <Pencil size={15} /> : <><Plus size={16} /><span>Adicionar gasto</span></>}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in" onClick={() => setOpen(false)} />
          <div className="relative bg-canvas sm:bg-white w-full sm:max-w-md sm:mx-4 rounded-t-[28px] sm:rounded-[24px] p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-6 shadow-[var(--shadow-float)] max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 sm:fade-in duration-300">
            <h3 className="text-[22px] font-bold tracking-[-0.02em] text-ink mb-5">
              {item ? 'Editar gasto' : 'Novo gasto variável'}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Nome">
                <input value={nome} onChange={e => setNome(e.target.value)} required
                  placeholder="Ex: Mercado, Uber..." className={inputCls} />
              </Field>

              <Field label="Valor total">
                <CurrencyInput value={valor} onValueChange={setValor} required />
              </Field>

              <Field label="Esse gasto é pessoal ou da empresa?">
                <div className="flex gap-2">
                  {(['PF', 'PJ'] as const).map(pt => (
                    <button key={pt} type="button"
                      onClick={() => setExpenseNature(pt)}
                      className="flex-1 py-2 text-[13px] rounded-lg border transition-colors"
                      style={{
                        backgroundColor: expenseNature === pt ? '#dce6dc' : 'white',
                        borderColor: expenseNature === pt ? '#8faf8f' : '#ece4db',
                        color: expenseNature === pt ? '#3c4a3c' : '#6b7280',
                      }}
                    >
                      {pt === 'PF' ? 'Pessoa física' : 'Pessoa jurídica'}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Categoria">
                <CategorySelect
                  value={categoria}
                  onChange={setCategoria}
                  categoriasPadrao={CATEGORIAS}
                  customCategories={customCategories}
                  contexto="variavel"
                />
              </Field>

              <Field label="Descrição (opcional)">
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Algum detalhe a mais sobre esse gasto..." maxLength={500} rows={2}
                  className={`${inputCls} resize-none`} />
                <p className="text-[11px] text-ink-3 text-right mt-0.5">{description.length}/500</p>
              </Field>

              <Field label="Forma de pagamento">
                <div className="flex gap-2">
                  {(['dinheiro', 'debito', 'credito'] as const).map(fp => (
                    <button key={fp} type="button"
                      onClick={() => { setFormaPagamento(fp); if (fp !== 'credito') setCartaoId('') }}
                      className="flex-1 py-2 text-[13px] rounded-lg border transition-colors"
                      style={{
                        backgroundColor: formaPagamento === fp ? '#dce6dc' : 'white',
                        borderColor: formaPagamento === fp ? '#8faf8f' : '#ece4db',
                        color: formaPagamento === fp ? '#3c4a3c' : '#6b7280',
                      }}
                    >
                      {fp === 'dinheiro' ? '💵 Dinheiro' : fp === 'debito' ? '💳 Débito' : '💳 Crédito'}
                    </button>
                  ))}
                </div>
              </Field>

              {formaPagamento === 'credito' && cartoes.length > 0 && (
                <Field label="Cartão">
                  <select value={cartaoId} onChange={e => setCartaoId(e.target.value)} className={inputCls}>
                    <option value="">Selecione um cartão</option>
                    {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </Field>
              )}

              {formaPagamento === 'credito' && (
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="parcelado" checked={parcelado}
                    onChange={e => { setParcelado(e.target.checked); if (!e.target.checked) setTotalParcelas('') }}
                    className="w-4 h-4 accent-[#8faf8f]" />
                  <label htmlFor="parcelado" className="text-[14px] text-ink">Compra parcelada</label>
                </div>
              )}

              {parcelado && (
                <Field label="Número de parcelas">
                  <input value={totalParcelas} onChange={e => setTotalParcelas(e.target.value)}
                    placeholder="Ex: 6" inputMode="numeric" min="2" className={inputCls} />
                  {valorParcela && (
                    <p className="text-[12px] text-brand mt-1">
                      = R$ {valorParcela}/mês por {totalParcelas}x
                    </p>
                  )}
                </Field>
              )}

              <div className="flex items-center gap-3">
                <input type="checkbox" id="variavel-pago" checked={isPaid}
                  onChange={e => setIsPaid(e.target.checked)} className="w-4 h-4 accent-[#8faf8f]" />
                <label htmlFor="variavel-pago" className="text-[14px] text-ink">
                  Já paguei esse gasto
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="px-4 py-2 text-[14px] text-ink-2 hover:text-ink transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="h-11 px-6 text-[15px] font-medium bg-brand-strong text-white rounded-full hover:bg-[#2f3b2f] transition-opacity disabled:opacity-60">
                  {loading ? 'Salvando...' : item ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-ink">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'h-12 bg-white border border-hairline rounded-[14px] px-4 text-[16px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_4px_rgb(95_138_98/0.14)] transition w-full'
