import type { StatusMes } from '@/types'

interface CardStatusProps {
  status: StatusMes | null
  loading?: boolean
}

const statusConfig = {
  bom: {
    label: 'Bom',
    emoji: '🟢',
    color: '#57cc99',
    bg: '#f0fdf4',
    border: '#86efac',
    message: 'Seu mês está no caminho certo.',
  },
  atencao: {
    label: 'Atenção',
    emoji: '🟡',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fcd34d',
    message: 'Seus gastos estão próximos da sua receita.',
  },
  ruim: {
    label: 'Ruim',
    emoji: '🔴',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fca5a5',
    message: 'Atenção: seus gastos superaram a receita.',
  },
}

export function CardStatus({ status, loading }: CardStatusProps) {
  const config = status ? statusConfig[status] : null

  return (
    <div
      className="rounded-2xl p-6 border flex flex-col gap-3"
      style={{
        backgroundColor: config?.bg ?? '#f8fafb',
        borderColor: config?.border ?? '#ece4db',
      }}
    >
      <span className="text-[13px] text-[#6b7280] font-medium uppercase tracking-wide">
        Status do mês
      </span>
      {loading ? (
        <div className="h-8 bg-[#f2ede7] rounded animate-pulse w-24" />
      ) : config ? (
        <>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.emoji}</span>
            <p
              className="font-fraunces text-[28px] leading-none"
              style={{ color: config.color }}
            >
              {config.label}
            </p>
          </div>
          <p className="text-[13px]" style={{ color: config.color }}>
            {config.message}
          </p>
        </>
      ) : (
        <>
          <p className="font-fraunces text-[28px] text-[#d7cfc7] leading-none">—</p>
          <p className="text-[13px] text-[#6b7280]">Adicione receitas para ver o status.</p>
        </>
      )}
    </div>
  )
}
