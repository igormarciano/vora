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

/** Soma (ou subtrai) `delta` meses a uma referência 'YYYY-MM-DD' (primeiro dia do mês), retornando outra referência no mesmo formato. */
export function deslocarMesReferencia(mesReferencia: string, delta: number): string {
  const [ano, mes] = mesReferencia.split('-').map(Number)
  const data = new Date(ano, mes - 1 + delta, 1)
  return getMesReferencia(data)
}

/** Diferença em meses inteiros entre duas referências 'YYYY-MM-DD' (b - a). */
export function diferencaEmMeses(a: string, b: string): number {
  const [anoA, mesA] = a.split('-').map(Number)
  const [anoB, mesB] = b.split('-').map(Number)
  return (anoB - anoA) * 12 + (mesB - mesA)
}

/** Rótulo amigável em português para uma referência de mês, ex: "Junho de 2026". */
export function formatarMesReferencia(mesReferencia: string): string {
  const [ano, mes] = mesReferencia.split('-').map(Number)
  const data = new Date(ano, mes - 1, 1)
  const label = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * Projeta gastos variáveis parcelados para o mês alvo, sem duplicar registros no banco.
 * Cada compra parcelada é armazenada uma única vez (no mês da primeira parcela); aqui
 * calculamos, a partir de `mes_referencia` + `parcela_atual` + `total_parcelas`, se a
 * compra ainda está "ativa" no mês alvo e qual seria o número da parcela projetada.
 */
export function projetarGastosParcelados(parcelados: GastoVariavel[], mesAlvo: string): GastoVariavel[] {
  const projetados: GastoVariavel[] = []
  for (const gasto of parcelados) {
    if (!gasto.parcelado || !gasto.total_parcelas) continue
    const delta = diferencaEmMeses(gasto.mes_referencia, mesAlvo)
    const parcelaProjetada = gasto.parcela_atual + delta
    if (parcelaProjetada >= 1 && parcelaProjetada <= gasto.total_parcelas) {
      projetados.push({ ...gasto, parcela_atual: parcelaProjetada, mes_referencia: mesAlvo })
    }
  }
  return projetados
}
