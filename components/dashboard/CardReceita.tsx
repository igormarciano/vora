import { formatCurrency } from '@/lib/engine'
import { TrendingUp } from 'lucide-react'

interface CardReceitaProps {
  total: number
  loading?: boolean
}

export function CardReceita({ total, loading }: CardReceitaProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#ece4db] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#6b7280] font-medium uppercase tracking-wide">
          Receita total
        </span>
        <div className="w-8 h-8 rounded-full bg-[#dce6dc] flex items-center justify-center">
          <TrendingUp size={16} className="text-[#3c4a3c]" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 bg-[#f2ede7] rounded animate-pulse w-32" />
      ) : (
        <p className="font-fraunces text-[28px] text-[#3c4a3c] leading-none">
          {formatCurrency(total)}
        </p>
      )}
      <p className="text-[13px] text-[#6b7280]">Este mês</p>
    </div>
  )
}
