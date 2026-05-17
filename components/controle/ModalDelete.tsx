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
        className="p-1.5 rounded text-[#6b7280] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
        title="Excluir"
      >
        <Trash2 size={15} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 shadow-lg max-w-sm w-full mx-4 flex flex-col gap-4">
            <h3 className="font-fraunces text-[20px] text-[#3c4a3c]">Confirmar exclusão</h3>
            <p className="text-[15px] text-[#6b7280] leading-relaxed">
              Tem certeza que quer remover <strong className="text-[#3c4a3c]">{label}</strong>?
              Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-[14px] text-[#6b7280] hover:text-[#3c4a3c] transition-colors"
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
