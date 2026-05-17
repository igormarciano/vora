import type { Receita, GastoFixo, GastoVariavel, StatusMes } from '@/types'

export function calcularReceitas(receitas: Receita[]): number {
  return receitas.reduce((sum, r) => sum + r.valor, 0)
}

export function calcularGastosFixos(gastos: GastoFixo[]): number {
  return gastos.reduce((sum, g) => sum + g.valor, 0)
}

export function calcularGastosVariaveis(gastos: GastoVariavel[]): number {
  return gastos.reduce((sum, g) => {
    const valor = g.parcelado && g.valor_parcela != null ? g.valor_parcela : g.valor
    return sum + valor
  }, 0)
}

export function calcularTotalGastos(fixos: number, variaveis: number): number {
  return fixos + variaveis
}

export function calcularEconomia(receitas: number, gastos: number): number {
  return receitas - gastos
}

export function calcularMeta(receitas: number, percentual: number): number {
  return receitas * (percentual / 100)
}

export function calcularStatus(economia: number, meta: number): StatusMes {
  if (economia >= meta) return 'bom'
  if (economia > 0) return 'atencao'
  return 'ruim'
}

export function calcularSaldoLivre(economia: number, totalInvestido: number): number {
  return economia - totalInvestido
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function getMesReferencia(date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
}
