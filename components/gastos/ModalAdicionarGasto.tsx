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
}

/**
 * Modal unificado para adicionar gastos — fixo ou variável.
 * Se `defaultTipo` for informado (ex: usuário está na subaba "Fixos"),
 * pula a etapa de seleção e abre direto no formulário correspondente.
 */
export function ModalAdicionarGasto({ cartoes, customCategories = [], defaultTipo, onSuccess, label = 'Adicionar gasto' }: ModalAdicionarGastoProps) {
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
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-[14px] font-medium text-[#8faf8f] hover:text-[#4f604f] transition-colors"
      >
        <Plus size={16} /><span>{label}</span>
      </button>

      {/* Etapa de seleção de tipo */}
      {open && tipo === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
          <div className="relative bg-white rounded-2xl p-6 shadow-lg max-w-md w-full mx-4">
            <h3 className="font-fraunces text-[22px] text-[#3c4a3c] mb-1">Novo gasto</h3>
            <p className="text-[14px] text-[#6b7280] mb-5">Esse gasto se repete todo mês ou varia?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTipo('fixo')}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-[#ece4db] hover:border-[#8faf8f] hover:bg-[#f2ede7] transition-colors text-center"
              >
                <div className="w-11 h-11 rounded-xl bg-[#dce6dc] flex items-center justify-center">
                  <Repeat size={20} className="text-[#3c4a3c]" />
                </div>
                <span className="text-[15px] font-medium text-[#3c4a3c]">Fixo</span>
                <span className="text-[12px] text-[#9ca3af]">Aluguel, internet, assinaturas...</span>
              </button>
              <button
                onClick={() => setTipo('variavel')}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-[#ece4db] hover:border-[#8faf8f] hover:bg-[#f2ede7] transition-colors text-center"
              >
                <div className="w-11 h-11 rounded-xl bg-[#dce6dc] flex items-center justify-center">
                  <ShoppingBag size={20} className="text-[#3c4a3c]" />
                </div>
                <span className="text-[15px] font-medium text-[#3c4a3c]">Variável</span>
                <span className="text-[12px] text-[#9ca3af]">Mercado, lazer, compras...</span>
              </button>
            </div>
            <button onClick={handleClose} className="w-full mt-5 text-[14px] text-[#6b7280] hover:text-[#3c4a3c] text-center transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Formulário (controlado) — renderizado fora da árvore de seleção para reaproveitar os forms existentes */}
      {open && tipo === 'fixo' && (
        <FormGastoFixo cartoes={cartoes} customCategories={customCategories} hideTrigger open={open} onOpenChange={setOpen} onSuccess={handleSuccess} />
      )}
      {open && tipo === 'variavel' && (
        <FormGastoVariavel cartoes={cartoes} customCategories={customCategories} hideTrigger open={open} onOpenChange={setOpen} onSuccess={handleSuccess} />
      )}
    </>
  )
}
