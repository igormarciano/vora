'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { formatCurrency, formatarMesAbreviado } from '@/lib/engine'

export interface EvolucaoPatrimonialPonto {
  mes: string
  patrimonioAtual: number
  economiasAcumuladas: number
  patrimonioTotal: number
}

interface EvolucaoPatrimonialChartProps {
  evolucao: EvolucaoPatrimonialPonto[]
}

/**
 * Gráfico de evolução patrimonial (Change Request 001, item 1.1 — prioridade 2;
 * cálculo revisado no CR003, itens 8 e 9). Mostra a projeção do patrimônio total
 * mês a mês = patrimônio atual + economias futuras acumuladas + rentabilidade.
 */
export function EvolucaoPatrimonialChart({ evolucao }: EvolucaoPatrimonialChartProps) {
  const data = evolucao.map(p => ({
    mes: formatarMesAbreviado(p.mes),
    'Patrimônio total': p.patrimonioTotal,
    'Patrimônio atual': p.patrimonioAtual,
    'Economias acumuladas': p.economiasAcumuladas,
  }))

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#ece4db]">
      <div className="mb-4">
        <h2 className="font-fraunces text-[18px] text-[#3c4a3c]">Evolução patrimonial</h2>
        <p className="text-[13px] text-[#6b7280] mt-0.5">
          Projeção de quanto seu patrimônio pode crescer mês a mês
        </p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ece4db" />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#ece4db' }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => formatCurrency(v).replace('R$', '').trim()}
            width={64}
          />
          <Tooltip formatter={(value: ValueType | undefined) => formatCurrency(Number(Array.isArray(value) ? value[0] : (value ?? 0)))} contentStyle={{ borderRadius: 12, borderColor: '#ece4db', fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line type="monotone" dataKey="Patrimônio total" stroke="#3c4a3c" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Patrimônio atual" stroke="#8faf8f" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          <Line type="monotone" dataKey="Economias acumuladas" stroke="#38a3a5" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
