'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'
import type { GastoFixo, Cartao, PersonType, CustomCategory } from '@/types'
import { criarGastoFixo, editarGastoFixo } from '@/app/(auth)/controle/actions'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { CategorySelect } from '@/components/controle/CategorySelect'

interface FormGastoFixoProps {
  item?: GastoFixo
  cartoes: Cartao[]
  customCategories?: CustomCategory[]
  onSuccess?: () => void
  /** Modo controlado: oculta o botão de gatilho e usa open/onOpenChange externos (usado pelo modal unificado) */
  hideTrigger?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Mês em foco na tela de Gastos — recorrência inicia em max(mês, atual) (Change Request 003, item 6) */
  mesSelecionado?: string
}

const CATEGORIAS_PF = [
  '🏠 Moradia', '🍽️ Alimentação', '🚗 Transporte', '💊 Saúde',
  '📚 Educação', '📺 Streaming', '📡 Internet/Telefone', '⚡ Energia/Água',
  '💳 Financiamento', '🔧 Manutenção', '🐾 Pets', '💼 Trabalho', '🔖 Outros',
]

const CATEGORIAS_PJ = [
  '🏢 Escritório/Aluguel', '💼 Trabalho', '👥 Folha de pagamento', '📑 Impostos e taxas',
  '📡 Internet/Telefone', '⚡ Energia/Água', '📦 Fornecedores', '🔧 Serviços contratados',
  '📣 Marketing', '🔖 Outros',
]

export function FormGastoFixo({ item, cartoes, customCategories = [], onSuccess, hideTrigger, open: openProp, onOpenChange, mesSelecionado }: FormGastoFixoProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(item?.nome ?? '')
  const [valor, setValor] = useState<number | null>(item ? item.valor : null)
  const [personType, setPersonType] = useState<PersonType>(item?.person_type ?? 'PF')
  const categorias = personType === 'PF' ? CATEGORIAS_PF : CATEGORIAS_PJ
  const [categoria, setCategoria] = useState(item?.categoria ?? categorias[0])
  const [vencimento, setVencimento] = useState(item?.vencimento ? String(item.vencimento) : '')
  const [recorrente, setRecorrente] = useState(item?.recorrente ?? true)
  const [duracaoMeses, setDuracaoMeses] = useState(item?.duracao_meses ? String(item.duracao_meses) : '')
  const [cartaoId, setCartaoId] = useState(item?.vinculado_cartao_id ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [isPaid, setIsPaid] = useState(item?.is_paid ?? false)

  function handlePersonTypeChange(novo: PersonType) {
    setPersonType(novo)
    const novasCategorias = novo === 'PF' ? CATEGORIAS_PF : CATEGORIAS_PJ
    if (!novasCategorias.includes(categoria)) setCategoria(novasCategorias[0])
  }

  function resetForm() {
    if (!item) {
      setNome(''); setValor(null); setPersonType('PF'); setCategoria(CATEGORIAS_PF[0])
      setVencimento(''); setRecorrente(true); setDuracaoMeses(''); setCartaoId('')
      setDescription(''); setIsPaid(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valorNum = valor ?? 0
    if (valorNum <= 0) { toast.error('Valor inválido'); return }
    if (description.length > 500) { toast.error('Descrição muito longa (máx. 500 caracteres)'); return }

    setLoading(true)
    const data = {
      nome, valor: valorNum, categoria,
      vencimento: vencimento ? parseInt(vencimento) : undefined,
      recorrente,
      duracao_meses: duracaoMeses ? parseInt(duracaoMeses) : undefined,
      vinculado_cartao_id: cartaoId || null,
      person_type: personType,
      description: description.trim() || undefined,
      is_paid: isPaid,
    }
    const result = item
      ? await editarGastoFixo(item.id, data)
      : await criarGastoFixo({ ...data, mes_selecionado: mesSelecionado })
    setLoading(false)

    if (result.error) { toast.error(result.error); return }
    toast.success(item ? 'Gasto fixo atualizado!' : 'Gasto fixo adicionado!')
    setOpen(false)
    resetForm()
    onSuccess?.()
  }

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
          {item ? <Pencil size={15} /> : <><Plus size={16} /><span>Adicionar gasto fixo</span></>}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in" onClick={() => setOpen(false)} />
          <div className="relative bg-canvas sm:bg-white w-full sm:max-w-md sm:mx-4 rounded-t-[28px] sm:rounded-[24px] p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-6 shadow-[var(--shadow-float)] max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 sm:fade-in duration-300">
            <h3 className="text-[22px] font-bold tracking-[-0.02em] text-ink mb-5">
              {item ? 'Editar gasto fixo' : 'Novo gasto fixo'}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Nome">
                <input value={nome} onChange={e => setNome(e.target.value)} required
                  placeholder="Ex: Aluguel, Academia..." className={inputCls} />
              </Field>

              <Field label="Valor">
                <CurrencyInput value={valor} onValueChange={setValor} required />
              </Field>

              <Field label="Esse gasto é pessoal ou da empresa?">
                <div className="flex gap-2">
                  {(['PF', 'PJ'] as const).map(pt => (
                    <button key={pt} type="button"
                      onClick={() => handlePersonTypeChange(pt)}
                      className="flex-1 py-2 text-[13px] rounded-lg border transition-colors"
                      style={{
                        backgroundColor: personType === pt ? '#dce6dc' : 'white',
                        borderColor: personType === pt ? '#8faf8f' : '#ece4db',
                        color: personType === pt ? '#3c4a3c' : '#6b7280',
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
                  categoriasPadrao={categorias}
                  customCategories={customCategories}
                  contexto="fixo"
                />
              </Field>

              <Field label="Descrição (opcional)">
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Algum detalhe a mais sobre esse gasto..." maxLength={500} rows={2}
                  className={`${inputCls} resize-none`} />
                <p className="text-[11px] text-ink-3 text-right mt-0.5">{description.length}/500</p>
              </Field>

              <Field label="Vencimento (dia do mês, opcional)">
                <input value={vencimento} onChange={e => setVencimento(e.target.value)}
                  placeholder="Ex: 10" inputMode="numeric" min="1" max="31" className={inputCls} />
              </Field>

              {cartoes.length > 0 && (
                <Field label="Vinculado a cartão (opcional)">
                  <select value={cartaoId} onChange={e => setCartaoId(e.target.value)} className={inputCls}>
                    <option value="">Sem cartão</option>
                    {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </Field>
              )}

              <div className="flex items-center gap-3">
                <input type="checkbox" id="fixo-rec" checked={recorrente}
                  onChange={e => setRecorrente(e.target.checked)} className="w-4 h-4 accent-[#8faf8f]" />
                <label htmlFor="fixo-rec" className="text-[14px] text-ink">
                  Recorrente (se repete todo mês)
                </label>
              </div>

              {recorrente && (
                <Field label="Por quantos meses? (deixe vazio = indefinido)">
                  <input value={duracaoMeses} onChange={e => setDuracaoMeses(e.target.value)}
                    placeholder="Ex: 12" inputMode="numeric" className={inputCls} />
                </Field>
              )}

              <div className="flex items-center gap-3">
                <input type="checkbox" id="fixo-pago" checked={isPaid}
                  onChange={e => setIsPaid(e.target.checked)} className="w-4 h-4 accent-[#8faf8f]" />
                <label htmlFor="fixo-pago" className="text-[14px] text-ink">
                  Já paguei esse mês
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
