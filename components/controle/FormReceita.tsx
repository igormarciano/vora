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
}

const TIPOS = [
  { value: 'salario', label: 'Salário' },
  { value: 'renda_extra', label: 'Renda extra' },
  { value: 'outros', label: 'Outros' },
]

export function FormReceita({ item, onSuccess }: FormReceitaProps) {
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
      <button
        onClick={() => setOpen(true)}
        className={item
          ? 'p-1.5 rounded text-[#6b7280] hover:text-[#3c4a3c] hover:bg-[#f2ede7] transition-colors'
          : 'flex items-center gap-2 text-[14px] font-medium text-[#8faf8f] hover:text-[#4f604f] transition-colors'
        }
        title={item ? 'Editar' : undefined}
      >
        {item ? <Pencil size={15} /> : <><Plus size={16} /><span>Adicionar receita</span></>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-fraunces text-[22px] text-[#3c4a3c] mb-5">
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
                <label htmlFor="recorrente" className="text-[14px] text-[#3c4a3c]">
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
