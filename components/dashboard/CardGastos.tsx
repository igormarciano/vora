import { formatCurrency } from '@/lib/engine'
import { Wallet } from 'lucide-react'

interface CardGastosProps {
  total: number
  loading?: boolean
}

export function CardGastos({ total, loading }: CardGastosProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#ece4db] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#6b7280] font-medium uppercase tracking-wide">
          Total de gastos
        </span>
        <div className="w-8 h-8 rounded-full bg-[#f2ede7] flex items-center justify-center">
          <Wallet size={16} className="text-[#3c4a3c]" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 bg-[#f2ede7] rounded animate-pulse w-32" />
      ) : (
        <p className="font-fraunces text-[28px] text-[#3c4a3c] leading-none">
          {formatCurrency(total)}
        </p>
      )}
      <p className="text-[13px] text-[#6b7280]">Fixos + variáveis</p>
    </div>
  )
}
