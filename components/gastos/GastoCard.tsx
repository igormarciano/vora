'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ExternalLink } from 'lucide-react'

const URL_REGEX = /(https?:\/\/[^\s]+)/i

interface GastoCardProps {
  nome: string
  valor: string
  badge?: string
  sub?: string
  description?: string | null
  isPaid: boolean
  onTogglePaid: (paid: boolean) => Promise<{ error?: string } | void>
  editButton: React.ReactNode
  deleteButton: React.ReactNode
  /** Conteúdo extra exibido acima do nome (ex: destaque de parcela — item 3.8) */
  destaque?: React.ReactNode
}

/**
 * Card de gasto reutilizável (fixo ou variável) — exibe nome, valor, categoria,
 * checkbox de pago/pendente com atualização otimista (item 3.7) e descrição
 * opcional com prévia de link e expansão (item 3.6).
 */
export function GastoCard({ nome, valor, badge, sub, description, isPaid, onTogglePaid, editButton, deleteButton, destaque }: GastoCardProps) {
  const [paid, setPaid] = useState(isPaid)
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)

  // Sincroniza com o status vindo do servidor (ex: ao navegar entre meses, uma
  // mesma ocorrência projetada pode estar paga em um mês e pendente em outro —
  // CR003, item 5). Não conflita com a atualização otimista, pois o prop só muda
  // após o revalidate.
  useEffect(() => { setPaid(isPaid) }, [isPaid])

  function handleToggle() {
    const novo = !paid
    setPaid(novo) // otimista
    startTransition(async () => {
      const result = await onTogglePaid(novo)
      if (result?.error) {
        setPaid(!novo) // reverte em caso de erro
        toast.error(result.error)
      }
    })
  }

  const link = description?.match(URL_REGEX)?.[0]
  const isLong = (description?.length ?? 0) > 90

  return (
    <div className="flex flex-col gap-1.5 py-3.5 border-b border-[rgb(60_74_60/0.08)] last:border-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          title={paid ? 'Marcar como pendente' : 'Marcar como pago'}
          className="shrink-0 w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center transition-colors disabled:opacity-60"
          style={{
            backgroundColor: paid ? '#5f8a62' : 'white',
            borderColor: paid ? '#5f8a62' : '#c9cfc7',
          }}
        >
          {paid && <CheckIcon />}
        </button>

        <div className="flex-1 min-w-0">
          {destaque}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[15px] font-medium truncate ${paid ? 'text-ink-3 line-through' : 'text-ink'}`}>{nome}</span>
            {badge && (
              <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full bg-fill text-ink-2">{badge}</span>
            )}
            <span className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-full font-medium ${paid ? 'bg-brand-soft text-brand-strong' : 'bg-[#f9f1e4] text-[#a8772f]'}`}>
              {paid ? 'Pago' : 'Pendente'}
            </span>
          </div>
          {(sub || badge) && (
            <p className="text-[12px] text-ink-3 mt-0.5 truncate">
              {badge && <span className="sm:hidden">{badge}{sub ? ' · ' : ''}</span>}
              {sub}
            </p>
          )}
        </div>
        <span className={`text-[15px] font-semibold tabular shrink-0 ${paid ? 'text-ink-3' : 'text-ink'}`}>{valor}</span>
        <div className="flex items-center -mr-1.5 shrink-0">
          {editButton}
          {deleteButton}
        </div>
      </div>

      {description && (
        <div className="ml-8 flex flex-col gap-1">
          <p className={`text-[13px] text-ink-2 ${!expanded && isLong ? 'line-clamp-1' : ''}`}>
            {description}
          </p>
          <div className="flex items-center gap-3">
            {isLong && (
              <button onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1 text-[12px] text-brand hover:text-brand-strong transition-colors">
                {expanded ? 'Ver menos' : 'Ver mais'}
                <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            )}
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[12px] text-brand hover:text-brand-strong transition-colors truncate max-w-[220px]">
                <ExternalLink size={12} />
                <span className="truncate">{link}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.5L4.8 8.8L9.5 3.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
