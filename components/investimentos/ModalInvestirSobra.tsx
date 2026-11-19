'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Sprout } from 'lucide-react'
import { investirSobra } from '@/app/(auth)/investimentos/actions'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { formatCurrency } from '@/lib/engine'

const CATEGORIAS = [
  { value: 'renda_fixa', label: '🏦 Renda Fixa' },
  { value: 'renda_variavel', label: '📈 Renda Variável' },
  { value: 'cripto', label: '₿ Cripto' },
  { value: 'credito_privado', label: '📄 Crédito Privado' },
  { value: 'internacional', label: '🌎 Internacional' },
] as const

type CategoriaValue = typeof CATEGORIAS[number]['value']

const inputCls = 'h-12 bg-white border border-hairline rounded-[14px] px-4 text-[16px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_4px_rgb(95_138_98/0.14)] transition w-full'

interface ModalInvestirSobraProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Quanto da sobra ainda está disponível para alocar neste mês */
  disponivel: number
  mes: string
}

/**
 * Modal para transferir parte da sobra do mês para um novo investimento (item 3.12).
 * O valor é validado novamente no servidor (ver `investirSobra`), que recalcula a
 * economia a partir dos dados reais do usuário antes de criar o investimento.
 */
export function ModalInvestirSobra({ open, onOpenChange, disponivel, mes }: ModalInvestirSobraProps) {
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState<number | null>(disponivel > 0 ? disponivel : null)
  const [categoria, setCategoria] = useState<CategoriaValue>('renda_fixa')
  const [dataAporte, setDataAporte] = useState(new Date().toISOString().slice(0, 10))

  function resetForm() {
    setNome(''); setValor(disponivel > 0 ? disponivel : null); setCategoria('renda_fixa')
    setDataAporte(new Date().toISOString().slice(0, 10))
  }

  function handleClose() {
    onOpenChange(false)
    resetForm()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valorNum = valor ?? 0
    if (!nome.trim()) { toast.error('Dê um nome para esse investimento'); return }
    if (valorNum <= 0) { toast.error('Informe um valor para investir'); return }
    if (valorNum > disponivel) {
      toast.error(`O valor não pode ultrapassar a sobra disponível (${formatCurrency(disponivel)})`)
      return
    }

    setLoading(true)
    const result = await investirSobra({
      nome: nome.trim(), valor: valorNum, categoria, data_aporte: dataAporte, mes_referencia: mes,
    })
    setLoading(false)

    if (result.error) { toast.error(result.error); return }
    toast.success('Sobra investida com sucesso! 🌱')
    handleClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in" onClick={handleClose} />
      <div className="relative bg-canvas sm:bg-white w-full sm:max-w-md sm:mx-4 rounded-t-[28px] sm:rounded-[24px] p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-6 shadow-[var(--shadow-float)] max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 sm:fade-in duration-300">
        <div className="flex items-center gap-2 mb-1">
          <Sprout size={20} className="text-brand" />
          <h3 className="text-[22px] font-bold tracking-[-0.02em] text-ink">Investir sobra do mês</h3>
        </div>
        <p className="text-[13px] text-ink-2 mb-5">
          Você tem <span className="font-medium text-ink">{formatCurrency(disponivel)}</span> de sobra disponível este mês. Escolha quanto e onde investir.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Nome do investimento">
            <input value={nome} onChange={e => setNome(e.target.value)} required
              placeholder="Ex: Tesouro Selic, IVVB11..." className={inputCls} />
          </Field>

          <Field label={`Valor a investir (máx. ${formatCurrency(disponivel)})`}>
            <CurrencyInput value={valor} onValueChange={setValor} required />
          </Field>

          <Field label="Categoria">
            <select value={categoria} onChange={e => setCategoria(e.target.value as CategoriaValue)} className={inputCls}>
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>

          <Field label="Data do aporte">
            <input type="date" value={dataAporte} onChange={e => setDataAporte(e.target.value)} className={inputCls} />
          </Field>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={handleClose}
              className="px-4 py-2 text-[14px] text-ink-2 hover:text-ink transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="h-11 px-6 text-[15px] font-medium bg-brand-strong text-white rounded-full hover:bg-[#2f3b2f] transition-opacity disabled:opacity-60">
              {loading ? 'Investindo...' : 'Investir agora'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
