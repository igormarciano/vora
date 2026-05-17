import { formatCurrency } from '@/lib/engine'
import { PiggyBank } from 'lucide-react'

interface CardEconomiaProps {
  economia: number
  meta: number
  loading?: boolean
}

export function CardEconomia({ economia, meta, loading }: CardEconomiaProps) {
  const percentual = meta > 0 ? Math.round((economia / meta) * 100) : 0

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#ece4db] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#6b7280] font-medium uppercase tracking-wide">
          Economia
        </span>
        <div className="w-8 h-8 rounded-full bg-[#dce6dc] flex items-center justify-center">
          <PiggyBank size={16} className="text-[#3c4a3c]" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 bg-[#f2ede7] rounded animate-pulse w-32" />
      ) : (
        <p className="font-fraunces text-[28px] text-[#3c4a3c] leading-none">
          {formatCurrency(economia)}
        </p>
      )}
      {!loading && meta > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 bg-[#ece4db] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(percentual, 100)}%`,
                backgroundColor: percentual >= 100 ? '#57cc99' : '#8faf8f',
              }}
            />
          </div>
          <p className="text-[13px] text-[#6b7280]">
            Meta: {formatCurrency(meta)} ({percentual}%)
          </p>
        </div>
      )}
      {!loading && meta === 0 && (
        <p className="text-[13px] text-[#6b7280]">Este mês</p>
      )}
    </div>
  )
}
