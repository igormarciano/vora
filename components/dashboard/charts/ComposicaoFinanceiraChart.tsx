'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { formatCurrency } from '@/lib/engine'

export interface ComposicaoFinanceiraDados {
  gastosFixos: number
  gastosVariaveis: number
  investido: number
  saldoLivre: number
}

interface ComposicaoFinanceiraChartProps {
  dados: ComposicaoFinanceiraDados
}

const CORES = {
  'Gastos fixos': '#dc2626',
  'Gastos variáveis': '#d7cfc7',
  'Investido': '#38a3a5',
  'Saldo livre': '#8faf8f',
}

/**
 * Gráfico de composição financeira (Change Request 001, item 1.2 — prioridade 4).
 * Mostra "para onde o dinheiro está indo" no mês atual: gastos fixos, gastos
 * variáveis, valor investido e saldo livre, em um donut.
 */
export function ComposicaoFinanceiraChart({ dados }: ComposicaoFinanceiraChartProps) {
  const data = [
    { name: 'Gastos fixos', value: Math.max(dados.gastosFixos, 0) },
    { name: 'Gastos variáveis', value: Math.max(dados.gastosVariaveis, 0) },
    { name: 'Investido', value: Math.max(dados.investido, 0) },
    { name: 'Saldo livre', value: Math.max(dados.saldoLivre, 0) },
  ].filter(d => d.value > 0)

  const semDados = data.length === 0

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#ece4db]">
      <div className="mb-4">
        <h2 className="font-fraunces text-[18px] text-[#3c4a3c]">Composição financeira</h2>
        <p className="text-[13px] text-[#6b7280] mt-0.5">
          Para onde o dinheiro do mês está indo
        </p>
      </div>
      {semDados ? (
        <div className="h-[240px] flex items-center justify-center text-[13px] text-[#9ca3af]">
          Adicione receitas e gastos para ver a composição do mês.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map(entry => (
                <Cell key={entry.name} fill={CORES[entry.name as keyof typeof CORES]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: ValueType | undefined) => formatCurrency(Number(Array.isArray(value) ? value[0] : (value ?? 0)))} contentStyle={{ borderRadius: 12, borderColor: '#ece4db', fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
