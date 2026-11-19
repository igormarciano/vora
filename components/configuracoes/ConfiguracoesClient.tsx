'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { Profile, CustomCategory } from '@/types'
import { atualizarPerfil } from '@/app/(auth)/configuracoes/actions'
import { CustomCategoriesManager } from './CustomCategoriesManager'

interface ConfiguracoesClientProps {
  profile: Profile
  customCategories: CustomCategory[]
}

const inputCls = 'h-12 bg-white border border-hairline rounded-[14px] px-4 text-[16px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_4px_rgb(95_138_98/0.14)] transition w-full'

export function ConfiguracoesClient({ profile, customCategories }: ConfiguracoesClientProps) {
  const [nome, setNome] = useState(profile.nome ?? '')
  const [meta, setMeta] = useState(String(profile.meta_economia_percentual))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const metaNum = parseFloat(meta.replace(',', '.'))
    if (isNaN(metaNum) || metaNum < 0 || metaNum > 100) {
      toast.error('Meta deve ser um número entre 0 e 100')
      return
    }
    setLoading(true)
    const result = await atualizarPerfil({ nome, meta_economia_percentual: metaNum })
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Configurações salvas!')
  }

  return (
    <div className="w-full max-w-2xl px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
      <h1 className="text-[32px] lg:text-[36px] font-bold tracking-[-0.025em] text-ink mb-6">Configurações</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Perfil */}
        <section className="bg-surface rounded-[20px] shadow-[var(--shadow-card)] p-5 flex flex-col gap-4">
          <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-ink">Perfil</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-ink">Nome</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome..."
              className={inputCls}
            />
          </div>
        </section>

        {/* Meta financeira */}
        <section className="bg-surface rounded-[20px] shadow-[var(--shadow-card)] p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-ink">Meta de economia</h2>
            <p className="text-[13px] text-ink-3 mt-1">
              Percentual da renda que você quer guardar todo mês.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-ink">Meta (%)</label>
            <div className="relative">
              <input
                value={meta}
                onChange={e => setMeta(e.target.value)}
                placeholder="Ex: 20"
                inputMode="decimal"
                className={inputCls + ' pr-8'}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-ink-3">%</span>
            </div>
            <p className="text-[12px] text-ink-3">
              Recomendado: 30%
            </p>
          </div>

          {/* Visualização da meta */}
          {!isNaN(parseFloat(meta)) && parseFloat(meta) > 0 && (
            <div className="flex items-center gap-3 bg-fill rounded-xl px-4 py-3">
              <span className="text-[20px]">🎯</span>
              <p className="text-[13px] text-ink">
                Com uma renda de <strong>R$ 5.000</strong>, sua meta seria guardar{' '}
                <strong>{formatMeta(parseFloat(meta), 5000)}</strong> por mês.
              </p>
            </div>
          )}
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-[15px] font-medium bg-[#8faf8f] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </form>

      <div className="mt-6">
        <CustomCategoriesManager categories={customCategories} />
      </div>
    </div>
  )
}

function formatMeta(percentual: number, renda: number) {
  const valor = (percentual / 100) * renda
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
