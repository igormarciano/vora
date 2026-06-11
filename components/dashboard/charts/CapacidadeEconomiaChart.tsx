'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import type { ProjecaoMensal } from '@/types'
import { formatCurrency, formatarMesAbreviado } from '@/lib/engine'

interface CapacidadeEconomiaChartProps {
  projecao: ProjecaoMensal[]
}

/**
 * Gráfico de capacidade de economia (Change Request 001, item 1.3 — prioridade 3).
 * Compara receita, gastos e economia mês a mês em barras, ajudando a visualizar
 * quanto sobra (ou falta) em cada mês projetado.
 */
export function CapacidadeEconomiaChart({ projecao }: CapacidadeEconomiaChartProps) {
  const data = projecao.map(p => ({
    mes: formatarMesAbreviado(p.mes),
    Receita: p.receitas,
    Gastos: p.gastos,
    Economia: p.economia,
  }))

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#ece4db]">
      <div className="mb-4">
        <h2 className="font-fraunces text-[18px] text-[#3c4a3c]">Capacidade de economia</h2>
        <p className="text-[13px] text-[#6b7280] mt-0.5">
          Receita, gastos e economia lado a lado em cada mês
        </p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
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
          <Bar dataKey="Receita" fill="#8faf8f" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gastos" fill="#d7cfc7" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Economia" fill="#38a3a5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
