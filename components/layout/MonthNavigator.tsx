'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { deslocarMesReferencia, formatarMesReferencia, getMesReferencia } from '@/lib/engine'

/** Navegação entre meses: atualiza `?mes=` na URL e o server component recarrega os dados. */
export function MonthNavigator({ mes }: { mes: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const atual = getMesReferencia()

  function navegar(novoMes: string) {
    router.push(novoMes === atual ? pathname : `${pathname}?mes=${novoMes}`)
  }

  return (
    <div className="flex items-center gap-1 bg-white border border-hairline rounded-xl p-1">
      <button
        onClick={() => navegar(deslocarMesReferencia(mes, -1))}
        className="p-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-fill transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-[15px] font-semibold text-ink min-w-[150px] text-center">
        {formatarMesReferencia(mes)}
      </span>
      <button
        onClick={() => navegar(deslocarMesReferencia(mes, 1))}
        className="p-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-fill transition-colors"
        aria-label="Próximo mês"
      >
        <ChevronRight size={18} />
      </button>
      {mes !== atual && (
        <button
          onClick={() => navegar(atual)}
          className="text-[12px] font-medium text-brand hover:text-brand-strong px-2"
        >
          Hoje
        </button>
      )}
    </div>
  )
}

/** Lê `?mes=YYYY-MM-01` com fallback para o mês atual. */
export function mesDoParametro(mes?: string): string {
  return mes && /^\d{4}-\d{2}-\d{2}$/.test(mes) ? mes : getMesReferencia()
}
