'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ModalDeleteProps {
  label: string
  onConfirm: () => Promise<{ error?: string }>
}

export function ModalDelete({ label, onConfirm }: ModalDeleteProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const result = await onConfirm()
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`"${label}" removido.`)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded text-ink-2 hover:text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
        title="Excluir"
      >
        <Trash2 size={15} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in" onClick={() => setOpen(false)} />
          <div className="relative bg-canvas sm:bg-white w-full sm:max-w-sm sm:mx-4 rounded-t-[28px] sm:rounded-[24px] p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-6 shadow-[var(--shadow-float)] flex flex-col gap-4 animate-in slide-in-from-bottom sm:fade-in duration-300">
            <h3 className="text-[20px] font-semibold tracking-[-0.02em] tabular text-ink">Confirmar exclusão</h3>
            <p className="text-[15px] text-ink-2 leading-relaxed">
              Tem certeza que quer remover <strong className="text-ink">{label}</strong>?
              Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-[14px] text-ink-2 hover:text-ink transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-2 text-[14px] bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-colors disabled:opacity-60"
              >
                {loading ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
