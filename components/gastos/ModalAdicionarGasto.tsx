'use client'

import { useState, useEffect } from 'react'
import { Plus, Repeat, ShoppingBag } from 'lucide-react'
import type { Cartao, CustomCategory } from '@/types'
import { FormGastoFixo } from '@/components/controle/FormGastoFixo'
import { FormGastoVariavel } from '@/components/controle/FormGastoVariavel'

type TipoGasto = 'fixo' | 'variavel'

interface ModalAdicionarGastoProps {
  cartoes: Cartao[]
  customCategories?: CustomCategory[]
  /** Se definido, pula a tela de seleção e abre direto no formulário do tipo */
  defaultTipo?: TipoGasto
  onSuccess?: () => void
  label?: string
  /** 'link' = botão de texto sálvia (padrão); 'primary' = CTA gradiente em destaque (Change Request 003, item 4) */
  variant?: 'link' | 'primary'
  /** Mês em foco na tela de Gastos — usado para iniciar recorrências sem retroatividade (Change Request 003, item 6) */
  mesSelecionado?: string
}

/**
 * Modal unificado para adicionar gastos — fixo ou variável.
 * Se `defaultTipo` for informado (ex: usuário está na subaba "Fixos"),
 * pula a etapa de seleção e abre direto no formulário correspondente.
 */
export function ModalAdicionarGasto({ cartoes, customCategories = [], defaultTipo, onSuccess, label = 'Adicionar gasto', variant = 'link', mesSelecionado }: ModalAdicionarGastoProps) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoGasto | null>(defaultTipo ?? null)

  // Reseta a seleção de tipo quando o modal fecha (a menos que haja um default fixo do contexto)
  useEffect(() => {
    if (!open) setTipo(defaultTipo ?? null)
  }, [open, defaultTipo])

  function handleClose() {
    setOpen(false)
  }

  function handleSuccess() {
    handleClose()
    onSuccess?.()
  }

  return (
    <>
      {variant === 'primary' ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-5 rounded-full font-medium text-[14px] text-white transition-opacity hover:opacity-90 shadow-sm"
          style={{ background: '#3c4a3c' }}
        >
          <Plus size={18} /><span>{label}</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-[14px] font-medium text-brand hover:text-brand-strong transition-colors"
        >
          <Plus size={16} /><span>{label}</span>
        </button>
      )}

      {/* Etapa de seleção de tipo */}
      {open && tipo === null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in" onClick={handleClose} />
          <div className="relative bg-canvas sm:bg-white w-full sm:max-w-md sm:mx-4 rounded-t-[28px] sm:rounded-[24px] p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-6 shadow-[var(--shadow-float)] animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 sm:fade-in duration-300">
            <h3 className="text-[22px] font-bold tracking-[-0.02em] text-ink mb-1">Novo gasto</h3>
            <p className="text-[14px] text-ink-2 mb-5">Esse gasto se repete todo mês ou varia?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTipo('fixo')}
                className="flex flex-col items-center gap-2 p-5 rounded-[20px] border border-hairline hover:border-[#8faf8f] hover:bg-fill transition-colors text-center"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center">
                  <Repeat size={20} className="text-ink" />
                </div>
                <span className="text-[15px] font-medium text-ink">Fixo</span>
                <span className="text-[12px] text-ink-3">Aluguel, internet, assinaturas...</span>
              </button>
              <button
                onClick={() => setTipo('variavel')}
                className="flex flex-col items-center gap-2 p-5 rounded-[20px] border border-hairline hover:border-[#8faf8f] hover:bg-fill transition-colors text-center"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center">
                  <ShoppingBag size={20} className="text-ink" />
                </div>
                <span className="text-[15px] font-medium text-ink">Variável</span>
                <span className="text-[12px] text-ink-3">Mercado, lazer, compras...</span>
              </button>
            </div>
            <button onClick={handleClose} className="w-full mt-5 text-[14px] text-ink-2 hover:text-ink text-center transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Formulário (controlado) — renderizado fora da árvore de seleção para reaproveitar os forms existentes */}
      {open && tipo === 'fixo' && (
        <FormGastoFixo cartoes={cartoes} customCategories={customCategories} mesSelecionado={mesSelecionado} hideTrigger open={open} onOpenChange={setOpen} onSuccess={handleSuccess} />
      )}
      {open && tipo === 'variavel' && (
        <FormGastoVariavel cartoes={cartoes} customCategories={customCategories} mesSelecionado={mesSelecionado} hideTrigger open={open} onOpenChange={setOpen} onSuccess={handleSuccess} />
      )}
    </>
  )
}
