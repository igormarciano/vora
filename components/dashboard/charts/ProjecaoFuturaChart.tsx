'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import type { ProjecaoMensal } from '@/types'
import { formatCurrency, formatarMesAbreviado } from '@/lib/engine'

interface ProjecaoFuturaChartProps {
  projecao: ProjecaoMensal[]
}

/**
 * Gráfico principal da Visão Geral (Change Request 001, item 1.4 — prioridade 1).
 * Mostra a projeção futura de receitas, gastos e economia mês a mês, a partir do
 * mês atual — o coração do princípio "ver o futuro financeiro antes dele acontecer".
 */
export function ProjecaoFuturaChart({ projecao }: ProjecaoFuturaChartProps) {
  const data = projecao.map(p => ({
    mes: formatarMesAbreviado(p.mes),
    Receitas: p.receitas,
    Gastos: p.gastos,
    Economia: p.economia,
  }))

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#ece4db]">
      <div className="mb-4">
        <h2 className="font-fraunces text-[20px] text-[#3c4a3c]">Projeção futura</h2>
        <p className="text-[13px] text-[#6b7280] mt-0.5">
          Como ficam suas receitas, gastos e economia nos próximos meses
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
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
          <Line type="monotone" dataKey="Receitas" stroke="#8faf8f" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Gastos" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Economia" stroke="#38a3a5" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
