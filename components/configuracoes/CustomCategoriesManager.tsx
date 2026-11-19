'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { CustomCategory } from '@/types'
import { criarCategoriaPersonalizada, deletarCategoriaPersonalizada } from '@/app/(auth)/controle/actions'
import { ModalDelete } from '@/components/controle/ModalDelete'

const CONTEXTOS = [
  { value: 'ambos', label: 'Fixos e variáveis' },
  { value: 'fixo', label: 'Somente fixos' },
  { value: 'variavel', label: 'Somente variáveis' },
] as const

const inputCls = 'h-12 bg-white border border-hairline rounded-[14px] px-4 text-[16px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_4px_rgb(95_138_98/0.14)] transition'

/**
 * Gerenciamento de categorias personalizadas (item 3.4) — criação inline
 * (emoji + nome + contexto de uso) e remoção, com RLS garantindo que cada
 * usuário só veja e edite as suas próprias categorias.
 */
export function CustomCategoriesManager({ categories }: { categories: CustomCategory[] }) {
  const [showForm, setShowForm] = useState(false)
  const [emoji, setEmoji] = useState('')
  const [nome, setNome] = useState('')
  const [contexto, setContexto] = useState<'fixo' | 'variavel' | 'ambos'>('ambos')
  const [loading, setLoading] = useState(false)

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!emoji.trim() || !nome.trim()) {
      toast.error('Informe um emoji e um nome para a categoria')
      return
    }
    setLoading(true)
    const result = await criarCategoriaPersonalizada({ emoji: emoji.trim(), nome: nome.trim(), contexto })
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Categoria criada!')
    setEmoji(''); setNome(''); setContexto('ambos')
    setShowForm(false)
  }

  return (
    <section className="bg-surface rounded-[20px] shadow-[var(--shadow-card)] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-ink">Categorias personalizadas</h2>
          <p className="text-[13px] text-ink-3 mt-1">
            Crie categorias com seu próprio emoji e nome para organizar seus gastos do seu jeito.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-brand hover:text-brand-strong transition-colors shrink-0"
        >
          <Plus size={15} />Nova
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCriar} className="flex flex-col gap-3 bg-[#f9f7f4] rounded-xl p-4">
          {/* Hierarquia [Emoji][Nome] — emoji compacto, nome em destaque (CR003, item 1) */}
          <div className="flex gap-2">
            <input
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              placeholder="🎨"
              maxLength={2}
              aria-label="Emoji"
              className="w-12 shrink-0 border border-hairline rounded-lg px-0 py-2.5 text-center text-[20px] text-ink outline-none focus:border-[#8faf8f] bg-white transition-colors"
            />
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Nome da categoria..."
              aria-label="Nome"
              className={inputCls + ' flex-1 min-w-0'}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-ink">Onde ela aparece?</label>
            <div className="flex gap-2 flex-wrap">
              {CONTEXTOS.map(c => (
                <button key={c.value} type="button"
                  onClick={() => setContexto(c.value)}
                  className="px-3 py-1.5 text-[12px] rounded-lg border transition-colors"
                  style={{
                    backgroundColor: contexto === c.value ? '#dce6dc' : 'white',
                    borderColor: contexto === c.value ? '#8faf8f' : '#ece4db',
                    color: contexto === c.value ? '#3c4a3c' : '#6b7280',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-[13px] text-ink-2 hover:text-ink transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="h-10 px-5 text-[14px] font-medium bg-brand-strong text-white rounded-full hover:bg-[#2f3b2f] disabled:opacity-60">
              {loading ? 'Salvando...' : 'Criar categoria'}
            </button>
          </div>
        </form>
      )}

      {categories.length === 0 ? (
        <p className="text-[13px] text-ink-3 text-center py-2">Nenhuma categoria personalizada ainda.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between bg-[#f9f7f4] rounded-lg px-3 py-2">
              <span className="flex items-center gap-2 text-[14px] text-ink">
                <span className="text-[18px]">{cat.emoji}</span>
                {cat.nome}
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-ink-3 border border-hairline">
                  {CONTEXTOS.find(c => c.value === cat.contexto)?.label}
                </span>
              </span>
              <ModalDelete label={cat.nome} onConfirm={() => deletarCategoriaPersonalizada(cat.id)} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
