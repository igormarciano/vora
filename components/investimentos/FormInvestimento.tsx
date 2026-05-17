'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'
import type { Investimento } from '@/types'
import { criarInvestimento, editarInvestimento } from '@/app/(auth)/investimentos/actions'

interface FormInvestimentoProps {
  item?: Investimento
  onSuccess?: () => void
}

const CATEGORIAS = [
  { value: 'renda_fixa', label: '🏦 Renda Fixa' },
  { value: 'renda_variavel', label: '📈 Renda Variável' },
  { value: 'cripto', label: '₿ Cripto' },
  { value: 'credito_privado', label: '📄 Crédito Privado' },
  { value: 'internacional', label: '🌎 Internacional' },
] as const

type CategoriaValue = typeof CATEGORIAS[number]['value']

const inputCls = 'border border-[#ece4db] rounded-lg px-3 py-2.5 text-[15px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white transition-colors w-full'

export function FormInvestimento({ item, onSuccess }: FormInvestimentoProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(item?.nome ?? '')
  const [valor, setValor] = useState(item ? String(item.valor) : '')
  const [categoria, setCategoria] = useState<CategoriaValue>(item?.categoria ?? 'renda_fixa')
  const [rentabilidade, setRentabilidade] = useState(item?.rentabilidade_anual ? String(item.rentabilidade_anual) : '')
  const [vencimento, setVencimento] = useState(item?.vencimento ?? '')
  const [liquidez, setLiquidez] = useState(item?.liquidez ?? '')
  const [observacao, setObservacao] = useState(item?.observacao ?? '')
  const [dataAporte, setDataAporte] = useState(item?.data_aporte ?? new Date().toISOString().slice(0, 10))

  function resetForm() {
    if (!item) {
      setNome(''); setValor(''); setCategoria('renda_fixa')
      setRentabilidade(''); setVencimento(''); setLiquidez(''); setObservacao('')
      setDataAporte(new Date().toISOString().slice(0, 10))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valorNum = parseFloat(valor.replace(',', '.'))
    if (isNaN(valorNum) || valorNum <= 0) { toast.error('Valor inválido'); return }

    setLoading(true)
    const data = {
      nome, valor: valorNum, categoria,
      rentabilidade_anual: rentabilidade ? parseFloat(rentabilidade.replace(',', '.')) : undefined,
      vencimento: vencimento || undefined,
      liquidez: liquidez || undefined,
      observacao: observacao || undefined,
      data_aporte: dataAporte,
    }
    const result = item ? await editarInvestimento(item.id, data) : await criarInvestimento(data)
    setLoading(false)

    if (result.error) { toast.error(result.error); return }
    toast.success(item ? 'Investimento atualizado!' : 'Investimento adicionado!')
    setOpen(false)
    resetForm()
    onSuccess?.()
  }

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
        {item ? <Pencil size={15} /> : <><Plus size={16} /><span>Adicionar investimento</span></>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-fraunces text-[22px] text-[#3c4a3c] mb-5">
              {item ? 'Editar investimento' : 'Novo investimento'}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Nome">
                <input value={nome} onChange={e => setNome(e.target.value)} required
                  placeholder="Ex: Tesouro Selic, IVVB11..." className={inputCls} />
              </Field>

              <Field label="Valor aportado (R$)">
                <input value={valor} onChange={e => setValor(e.target.value)} required
                  placeholder="0,00" inputMode="decimal" className={inputCls} />
              </Field>

              <Field label="Categoria">
                <select value={categoria} onChange={e => setCategoria(e.target.value as CategoriaValue)} className={inputCls}>
                  {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>

              <Field label="Data do aporte">
                <input type="date" value={dataAporte} onChange={e => setDataAporte(e.target.value)}
                  className={inputCls} />
              </Field>

              <Field label="Rentabilidade anual estimada (%, opcional)">
                <input value={rentabilidade} onChange={e => setRentabilidade(e.target.value)}
                  placeholder="Ex: 12,5" inputMode="decimal" className={inputCls} />
              </Field>

              <Field label="Vencimento (opcional)">
                <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)}
                  className={inputCls} />
              </Field>

              <Field label="Liquidez (opcional)">
                <input value={liquidez} onChange={e => setLiquidez(e.target.value)}
                  placeholder="Ex: Diária, D+1, 90 dias..." className={inputCls} />
              </Field>

              <Field label="Observação (opcional)">
                <textarea value={observacao} onChange={e => setObservacao(e.target.value)}
                  placeholder="Notas sobre este investimento..." rows={2}
                  className={inputCls + ' resize-none'} />
              </Field>

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
