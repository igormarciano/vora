'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'
import type { Investimento } from '@/types'
import { criarInvestimento, editarInvestimento } from '@/app/(auth)/investimentos/actions'
import { CurrencyInput } from '@/components/ui/CurrencyInput'

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

const inputCls = 'h-12 bg-white border border-hairline rounded-[14px] px-4 text-[16px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_4px_rgb(95_138_98/0.14)] transition w-full'

export function FormInvestimento({ item, onSuccess }: FormInvestimentoProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(item?.nome ?? '')
  const [valor, setValor] = useState<number | null>(item ? item.valor : null)
  const [categoria, setCategoria] = useState<CategoriaValue>(item?.categoria ?? 'renda_fixa')
  const [rentabilidade, setRentabilidade] = useState(item?.rentabilidade_anual ? String(item.rentabilidade_anual) : '')
  const [vencimento, setVencimento] = useState(item?.vencimento ?? '')
  const [liquidez, setLiquidez] = useState(item?.liquidez ?? '')
  const [observacao, setObservacao] = useState(item?.observacao ?? '')
  const [dataAporte, setDataAporte] = useState(item?.data_aporte ?? new Date().toISOString().slice(0, 10))

  function resetForm() {
    if (!item) {
      setNome(''); setValor(null); setCategoria('renda_fixa')
      setRentabilidade(''); setVencimento(''); setLiquidez(''); setObservacao('')
      setDataAporte(new Date().toISOString().slice(0, 10))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valorNum = valor ?? 0
    if (valorNum <= 0) { toast.error('Valor inválido'); return }

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
          ? 'p-1.5 rounded text-ink-2 hover:text-ink hover:bg-fill transition-colors'
          : 'flex items-center gap-2 text-[14px] font-medium text-brand hover:text-brand-strong transition-colors'
        }
        title={item ? 'Editar' : undefined}
      >
        {item ? <Pencil size={15} /> : <><Plus size={16} /><span>Adicionar investimento</span></>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in" onClick={() => setOpen(false)} />
          <div className="relative bg-canvas sm:bg-white w-full sm:max-w-md sm:mx-4 rounded-t-[28px] sm:rounded-[24px] p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-6 shadow-[var(--shadow-float)] max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 sm:fade-in duration-300">
            <h3 className="text-[22px] font-bold tracking-[-0.02em] text-ink mb-5">
              {item ? 'Editar investimento' : 'Novo investimento'}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Nome">
                <input value={nome} onChange={e => setNome(e.target.value)} required
                  placeholder="Ex: Tesouro Selic, IVVB11..." className={inputCls} />
              </Field>

              <Field label="Valor aportado">
                <CurrencyInput value={valor} onValueChange={setValor} required />
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
