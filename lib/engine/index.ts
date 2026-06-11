import type { Receita, GastoFixo, GastoVariavel, StatusMes, ProjecaoMensal } from '@/types'

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

/** Rótulo curto para eixos de gráfico, ex: "jun/26". */
export function formatarMesAbreviado(mesReferencia: string): string {
  const [ano, mes] = mesReferencia.split('-').map(Number)
  const data = new Date(ano, mes - 1, 1)
  return data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')
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

/**
 * Projeta gastos fixos recorrentes para o mês alvo, sem duplicar registros no banco.
 * Um gasto fixo recorrente (`recorrente = true`) é cadastrado uma única vez, no mês em
 * que foi criado (`mes_referencia`). A partir daí, ele se repete automaticamente nos
 * meses seguintes — indefinidamente, ou por `duracao_meses` meses (incluindo o mês de
 * criação) quando essa duração é definida.
 *
 * Use esta função com gastos cujo `mes_referencia` seja ANTERIOR ao mês alvo — o
 * registro do próprio mês de origem já é retornado pela consulta normal por
 * `mes_referencia = mesAlvo`, sem precisar de projeção.
 */
export function projetarGastosFixosRecorrentes(fixos: GastoFixo[], mesAlvo: string): GastoFixo[] {
  const projetados: GastoFixo[] = []
  for (const gasto of fixos) {
    if (!gasto.recorrente) continue
    const delta = diferencaEmMeses(gasto.mes_referencia, mesAlvo)
    if (delta <= 0) continue // mês de origem (ou anterior a ele) já é tratado pela consulta normal
    if (gasto.duracao_meses != null && delta >= gasto.duracao_meses) continue
    projetados.push({ ...gasto, mes_referencia: mesAlvo })
  }
  return projetados
}

/**
 * Projeta receitas recorrentes para o mês alvo, sem duplicar registros no banco.
 * Mesma lógica de `projetarGastosFixosRecorrentes`, aplicada a `receitas`
 * (que também possuem `recorrente` + `duracao_meses`).
 */
export function projetarReceitasRecorrentes(receitas: Receita[], mesAlvo: string): Receita[] {
  const projetadas: Receita[] = []
  for (const receita of receitas) {
    if (!receita.recorrente) continue
    const delta = diferencaEmMeses(receita.mes_referencia, mesAlvo)
    if (delta <= 0) continue
    if (receita.duracao_meses != null && delta >= receita.duracao_meses) continue
    projetadas.push({ ...receita, mes_referencia: mesAlvo })
  }
  return projetadas
}

/**
 * Gera a projeção financeira (receitas, gastos, economia e status) para uma sequência
 * de meses a partir de `mesInicial` (incluso) — base para o "Gráfico de projeção
 * futura" (Change Request 001, item 1.4) e para o "Gráfico de capacidade de economia"
 * (item 1.3). Usa as mesmas funções de projeção de recorrência/parcelamento já
 * aplicadas em `/gastos`, `/dashboard` e `/investimentos`, sem criar nenhum registro
 * novo no banco — tudo é calculado em memória a partir dos dados já existentes.
 */
export function gerarProjecaoMensal(
  dados: {
    receitas: Receita[]
    gastosFixos: GastoFixo[]
    /** Apenas compras parceladas (parcelado = true) */
    gastosVariaveisParcelados: GastoVariavel[]
    /** Apenas gastos variáveis não parcelados, de qualquer mês já lançado */
    gastosVariaveisAvulsos: GastoVariavel[]
  },
  mesInicial: string,
  quantidadeMeses: number,
  metaPercentual: number
): ProjecaoMensal[] {
  const { receitas, gastosFixos, gastosVariaveisParcelados, gastosVariaveisAvulsos } = dados
  const meses: ProjecaoMensal[] = []

  for (let i = 0; i < quantidadeMeses; i++) {
    const mes = deslocarMesReferencia(mesInicial, i)

    const receitasMes = calcularReceitas(receitas.filter(r => r.mes_referencia === mes))
      + calcularReceitas(projetarReceitasRecorrentes(receitas, mes))

    const fixosMes = calcularGastosFixos(gastosFixos.filter(g => g.mes_referencia === mes))
      + calcularGastosFixos(projetarGastosFixosRecorrentes(gastosFixos, mes))

    const variaveisMes = calcularGastosVariaveis(gastosVariaveisAvulsos.filter(g => g.mes_referencia === mes))
      + calcularGastosVariaveis(projetarGastosParcelados(gastosVariaveisParcelados, mes))

    const totalGastosMes = calcularTotalGastos(fixosMes, variaveisMes)
    const economiaMes = calcularEconomia(receitasMes, totalGastosMes)
    const status = receitasMes > 0 ? calcularStatus(economiaMes, calcularMeta(receitasMes, metaPercentual)) : null

    meses.push({ mes, receitas: receitasMes, gastos: totalGastosMes, economia: economiaMes, status })
  }

  return meses
}
