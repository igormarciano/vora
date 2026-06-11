import type { ProjecaoMensal } from '@/types'
import { ProjecaoFuturaChart } from '@/components/dashboard/charts/ProjecaoFuturaChart'
import { EvolucaoPatrimonialChart, type EvolucaoPatrimonialPonto } from '@/components/dashboard/charts/EvolucaoPatrimonialChart'
import { CapacidadeEconomiaChart } from '@/components/dashboard/charts/CapacidadeEconomiaChart'
import { ComposicaoFinanceiraChart, type ComposicaoFinanceiraDados } from '@/components/dashboard/charts/ComposicaoFinanceiraChart'

interface DashboardChartsProps {
  projecao: ProjecaoMensal[]
  evolucao: EvolucaoPatrimonialPonto[]
  composicao: ComposicaoFinanceiraDados
}

/**
 * Agrupa os 4 gráficos da Visão Geral (Change Request 001, item 1), em ordem de
 * prioridade definida no spec — o gráfico de projeção futura (1.4) permanece o
 * principal, mantendo o foco em "ver o futuro financeiro antes dele acontecer".
 */
export function DashboardCharts({ projecao, evolucao, composicao }: DashboardChartsProps) {
  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* 1.4 — Projeção futura (prioridade 1, gráfico principal) */}
      <ProjecaoFuturaChart projecao={projecao} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1.1 — Evolução patrimonial (prioridade 2) */}
        <EvolucaoPatrimonialChart evolucao={evolucao} />

        {/* 1.3 — Capacidade de economia (prioridade 3) */}
        <CapacidadeEconomiaChart projecao={projecao} />
      </div>

      {/* 1.2 — Composição financeira (prioridade 4) */}
      <ComposicaoFinanceiraChart dados={composicao} />
    </div>
  )
}
