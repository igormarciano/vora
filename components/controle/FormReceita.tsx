'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'
import type { Receita } from '@/types'
import { criarReceita, editarReceita } from '@/app/(auth)/controle/actions'
import { CurrencyInput } from '@/components/ui/CurrencyInput'

interface FormReceitaProps {
  item?: Receita
  onSuccess?: () => void
  /** 'link' = botão de texto sálvia (padrão); 'primary' = CTA gradiente em destaque (Change Request 003, item 4) */
  variant?: 'link' | 'primary'
}

const TIPOS = [
  { value: 'salario', label: 'Salário' },
  { value: 'renda_extra', label: 'Renda extra' },
  { value: 'outros', label: 'Outros' },
]

export function FormReceita({ item, onSuccess, variant = 'link' }: FormReceitaProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(item?.nome ?? '')
  const [valor, setValor] = useState<number | null>(item ? item.valor : null)
  const [tipo, setTipo] = useState<'salario' | 'renda_extra' | 'outros'>(item?.tipo ?? 'salario')
  const [tipoCustom, setTipoCustom] = useState(item?.tipo_custom ?? '')
  const [recorrente, setRecorrente] = useState(item?.recorrente ?? true)
  const [duracaoMeses, setDuracaoMeses] = useState(item?.duracao_meses ? String(item.duracao_meses) : '')

  function resetForm() {
    if (!item) {
      setNome(''); setValor(null); setTipo('salario')
      setTipoCustom(''); setRecorrente(true); setDuracaoMeses('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valorNum = valor ?? 0
    if (valorNum <= 0) { toast.error('Valor inválido'); return }

    setLoading(true)
    const data = {
      nome, valor: valorNum, tipo, tipo_custom: tipo === 'outros' ? tipoCustom : undefined,
      recorrente, duracao_meses: duracaoMeses ? parseInt(duracaoMeses) : undefined,
    }
    const result = item ? await editarReceita(item.id, data) : await criarReceita(data)
    setLoading(false)

    if (result.error) { toast.error(result.error); return }
    toast.success(item ? 'Receita atualizada!' : 'Receita adicionada!')
    setOpen(false)
    resetForm()
    onSuccess?.()
  }

  return (
    <>
      {item ? (
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded text-ink-2 hover:text-ink hover:bg-fill transition-colors"
          title="Editar"
        >
          <Pencil size={15} />
        </button>
      ) : variant === 'primary' ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-5 rounded-full font-medium text-[14px] text-white transition-opacity hover:opacity-90 shadow-sm"
          style={{ background: '#3c4a3c' }}
        >
          <Plus size={17} /><span>Nova receita</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-[14px] font-medium text-brand hover:text-brand-strong transition-colors"
        >
          <Plus size={16} /><span>Adicionar receita</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in" onClick={() => setOpen(false)} />
          <div className="relative bg-canvas sm:bg-white w-full sm:max-w-md sm:mx-4 rounded-t-[28px] sm:rounded-[24px] p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-6 shadow-[var(--shadow-float)] max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 sm:fade-in duration-300">
            <h3 className="text-[22px] font-bold tracking-[-0.02em] text-ink mb-5">
              {item ? 'Editar receita' : 'Nova receita'}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Nome">
                <input value={nome} onChange={e => setNome(e.target.value)} required
                  placeholder="Ex: Salário, Freela..." className={inputCls} />
              </Field>

              <Field label="Valor">
                <CurrencyInput value={valor} onValueChange={setValor} required />
              </Field>

              <Field label="Tipo">
                <select value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)} className={inputCls}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>

              {tipo === 'outros' && (
                <Field label="Qual tipo?">
                  <input value={tipoCustom} onChange={e => setTipoCustom(e.target.value)}
                    placeholder="Descreva a renda..." className={inputCls} />
                </Field>
              )}

              <div className="flex items-center gap-3">
                <input type="checkbox" id="recorrente" checked={recorrente}
                  onChange={e => setRecorrente(e.target.checked)} className="w-4 h-4 accent-[#8faf8f]" />
                <label htmlFor="recorrente" className="text-[14px] text-ink">
                  Recorrente (se repete todo mês)
                </label>
              </div>

              {recorrente && (
                <Field label="Por quantos meses? (deixe vazio = indefinido)">
                  <input value={duracaoMeses} onChange={e => setDuracaoMeses(e.target.value)}
                    placeholder="Ex: 12" inputMode="numeric" className={inputCls} />
                </Field>
              )}

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
