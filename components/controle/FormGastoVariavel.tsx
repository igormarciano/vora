'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'
import type { GastoVariavel, Cartao } from '@/types'
import { criarGastoVariavel, editarGastoVariavel } from '@/app/(auth)/controle/actions'

interface FormGastoVariavelProps {
  item?: GastoVariavel
  cartoes: Cartao[]
  onSuccess?: () => void
}

const CATEGORIAS = [
  '🛒 Mercado', '🚌 Transporte', '💊 Farmácia', '👗 Roupas',
  '🍕 Restaurante', '🎭 Lazer', '💄 Beleza', '🐾 Pets',
  '📦 Compras online', '⛽ Combustível', '🔧 Outros',
]

export function FormGastoVariavel({ item, cartoes, onSuccess }: FormGastoVariavelProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(item?.nome ?? '')
  const [valor, setValor] = useState(item ? String(item.valor) : '')
  const [categoria, setCategoria] = useState(item?.categoria ?? CATEGORIAS[0])
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'debito' | 'credito'>(
    item?.forma_pagamento ?? 'dinheiro'
  )
  const [cartaoId, setCartaoId] = useState(item?.cartao_id ?? '')
  const [parcelado, setParcelado] = useState(item?.parcelado ?? false)
  const [totalParcelas, setTotalParcelas] = useState(item?.total_parcelas ? String(item.total_parcelas) : '')

  function resetForm() {
    if (!item) {
      setNome(''); setValor(''); setCategoria(CATEGORIAS[0])
      setFormaPagamento('dinheiro'); setCartaoId(''); setParcelado(false); setTotalParcelas('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valorNum = parseFloat(valor.replace(',', '.'))
    if (isNaN(valorNum) || valorNum <= 0) { toast.error('Valor inválido'); return }

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
    }
    const result = item ? await editarGastoVariavel(item.id, data) : await criarGastoVariavel(data)
    setLoading(false)

    if (result.error) { toast.error(result.error); return }
    toast.success(item ? 'Gasto atualizado!' : 'Gasto adicionado!')
    setOpen(false)
    resetForm()
    onSuccess?.()
  }

  const valorParcela = parcelado && totalParcelas && parseFloat(valor.replace(',', '.')) > 0
    ? (parseFloat(valor.replace(',', '.')) / parseInt(totalParcelas)).toFixed(2)
    : null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={item
          ? 'p-1.5 rounded text-[#6b7280] hover:text-[#3c4a3c] hover:bg-[#f2ede7] transition-colors'
          : 'flex items-center gap-2 text-[14px] font-medium text-[#8faf8f] hover:text-[#4f604f] transition-colors'
        }
        title={item ? 'Editar' : undefined}
      >
        {item ? <Pencil size={15} /> : <><Plus size={16} /><span>Adicionar gasto</span></>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-fraunces text-[22px] text-[#3c4a3c] mb-5">
              {item ? 'Editar gasto' : 'Novo gasto variável'}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Nome">
                <input value={nome} onChange={e => setNome(e.target.value)} required
                  placeholder="Ex: Mercado, Uber..." className={inputCls} />
              </Field>

              <Field label="Valor total (R$)">
                <input value={valor} onChange={e => setValor(e.target.value)} required
                  placeholder="0,00" inputMode="decimal" className={inputCls} />
              </Field>

              <Field label="Categoria">
                <select value={categoria} onChange={e => setCategoria(e.target.value)} className={inputCls}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
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
                  <label htmlFor="parcelado" className="text-[14px] text-[#3c4a3c]">Compra parcelada</label>
                </div>
              )}

              {parcelado && (
                <Field label="Número de parcelas">
                  <input value={totalParcelas} onChange={e => setTotalParcelas(e.target.value)}
                    placeholder="Ex: 6" inputMode="numeric" min="2" className={inputCls} />
                  {valorParcela && (
                    <p className="text-[12px] text-[#8faf8f] mt-1">
                      = R$ {valorParcela}/mês por {totalParcelas}x
                    </p>
                  )}
                </Field>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="px-4 py-2 text-[14px] text-[#6b7280] hover:text-[#3c4a3c] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="px-5 py-2.5 text-[14px] font-medium bg-[#8faf8f] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">
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
      <label className="text-[13px] font-medium text-[#3c4a3c]">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'border border-[#ece4db] rounded-lg px-3 py-2.5 text-[15px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white transition-colors w-full'
