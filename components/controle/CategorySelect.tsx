'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { CustomCategory } from '@/types'
import { criarCategoriaPersonalizada } from '@/app/(auth)/controle/actions'

const inputCls = 'border border-[#ece4db] rounded-lg px-3 py-2.5 text-[15px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white transition-colors w-full'

interface CategorySelectProps {
  value: string
  onChange: (categoria: string) => void
  /** Categorias padrão do sistema (já filtradas por PF/PJ quando aplicável) */
  categoriasPadrao: string[]
  /** Categorias personalizadas do usuário (já carregadas da tabela custom_categories) */
  customCategories: CustomCategory[]
  /** Contexto do formulário, usado para filtrar quais categorias personalizadas aparecem */
  contexto: 'fixo' | 'variavel'
}

/**
 * Select de categoria reutilizável que combina as categorias padrão do
 * sistema com as categorias personalizadas do usuário (item 3.4), e
 * permite criar uma nova categoria sem sair do formulário ("inline").
 */
export function CategorySelect({ value, onChange, categoriasPadrao, customCategories, contexto }: CategorySelectProps) {
  const [showForm, setShowForm] = useState(false)
  const [emoji, setEmoji] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)

  const personalizadas = customCategories.filter(c => c.contexto === 'ambos' || c.contexto === contexto)
  const opcoesPersonalizadas = personalizadas.map(c => `${c.emoji} ${c.nome}`)

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!emoji.trim() || !nome.trim()) {
      toast.error('Informe um emoji e um nome para a categoria')
      return
    }
    setLoading(true)
    const result = await criarCategoriaPersonalizada({ emoji: emoji.trim(), nome: nome.trim(), contexto: 'ambos' })
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Categoria criada!')
    onChange(`${emoji.trim()} ${nome.trim()}`)
    setEmoji(''); setNome('')
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
        {categoriasPadrao.map(c => <option key={c} value={c}>{c}</option>)}
        {opcoesPersonalizadas.length > 0 && (
          <optgroup label="Minhas categorias">
            {opcoesPersonalizadas.map(c => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        )}
      </select>

      {!showForm ? (
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#8faf8f] hover:text-[#4f604f] transition-colors self-start">
          <Plus size={13} />Criar categoria personalizada
        </button>
      ) : (
        <div className="flex flex-col gap-2 bg-[#f9f7f4] rounded-lg p-3">
          {/* Hierarquia [Emoji][Nome] — emoji compacto, nome em destaque (CR003, item 1) */}
          <div className="flex gap-2">
            <input value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🎨" maxLength={2} aria-label="Emoji"
              className="w-11 shrink-0 border border-[#ece4db] rounded-lg px-0 py-2 text-center text-[18px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white transition-colors" />
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da categoria..." aria-label="Nome"
              className="flex-1 min-w-0 border border-[#ece4db] rounded-lg px-3 py-2 text-[15px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white transition-colors" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setEmoji(''); setNome('') }}
              className="px-3 py-1.5 text-[12px] text-[#6b7280] hover:text-[#3c4a3c] transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleCriar} disabled={loading}
              className="px-3 py-1.5 text-[12px] font-medium bg-[#8faf8f] text-white rounded-lg hover:opacity-90 disabled:opacity-60">
              {loading ? 'Criando...' : 'Criar e usar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
