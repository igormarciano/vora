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

const inputCls = 'border border-[#ece4db] rounded-lg px-3 py-2.5 text-[15px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white transition-colors w-full'

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
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-fraunces text-[32px] text-[#3c4a3c] mb-6">Configurações</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Perfil */}
        <section className="bg-white rounded-2xl border border-[#ece4db] p-5 flex flex-col gap-4">
          <h2 className="font-fraunces text-[18px] text-[#3c4a3c]">Perfil</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#3c4a3c]">Nome</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome..."
              className={inputCls}
            />
          </div>
        </section>

        {/* Meta financeira */}
        <section className="bg-white rounded-2xl border border-[#ece4db] p-5 flex flex-col gap-4">
          <div>
            <h2 className="font-fraunces text-[18px] text-[#3c4a3c]">Meta de economia</h2>
            <p className="text-[13px] text-[#9ca3af] mt-1">
              Percentual da renda que você quer guardar todo mês.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#3c4a3c]">Meta (%)</label>
            <div className="relative">
              <input
                value={meta}
                onChange={e => setMeta(e.target.value)}
                placeholder="Ex: 20"
                inputMode="decimal"
                className={inputCls + ' pr-8'}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-[#9ca3af]">%</span>
            </div>
            <p className="text-[12px] text-[#9ca3af]">
              Recomendado: 20% (regra 50/30/20)
            </p>
          </div>

          {/* Visualização da meta */}
          {!isNaN(parseFloat(meta)) && parseFloat(meta) > 0 && (
            <div className="flex items-center gap-3 bg-[#f2ede7] rounded-xl px-4 py-3">
              <span className="text-[20px]">🎯</span>
              <p className="text-[13px] text-[#3c4a3c]">
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
