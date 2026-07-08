import type { Receita, GastoFixo, GastoVariavel, Investimento } from '@/types'
import {
  calcularReceitas,
  calcularGastosFixos,
  calcularGastosVariaveis,
  calcularTotalGastos,
  calcularEconomia,
  calcularSaldoLivre,
  projetarGastosFixosRecorrentes,
  projetarGastosParcelados,
  projetarReceitasRecorrentes,
} from '@/lib/engine'

export interface CategoriaValor {
  categoria: string
  valor: number
}

export interface ParcelamentoAtivo {
  nome: string
  categoria: string
  parcelaAtual: number
  totalParcelas: number
  valorParcela: number
  valorRestante: number
}

export interface DadosMesAnalise {
  mesReferencia: string
  receitaTotal: number
  gastosFixosTotal: number
  gastosVariaveisTotal: number
  totalGastos: number
  economiaReal: number
  economiaPercentual: number
  saldoLivre: number
  categoriasFixos: CategoriaValor[]
  categoriasVariaveis: CategoriaValor[]
}

export interface DadosAnaliseMensal {
  mesAtual: DadosMesAnalise
  mesAnterior: DadosMesAnalise
  metaPercentual: number
  parcelamentosAtivos: ParcelamentoAtivo[]
  categoriasComMaiorVariacao: { categoria: string; valorAtual: number; valorAnterior: number; delta: number }[]
  patrimonioTotal: number
  distribuicaoPorClasse: { classe: string; valor: number; percentual: number }[]
}

interface DadosBrutos {
  receitas: Receita[]
  gastosFixos: GastoFixo[]
  gastosVariaveis: GastoVariavel[]
  investimentos: Investimento[]
}

function somarPorCategoria(items: { categoria: string; valor: number }[]): CategoriaValor[] {
  const mapa = new Map<string, number>()
  for (const item of items) {
    mapa.set(item.categoria, (mapa.get(item.categoria) ?? 0) + item.valor)
  }
  return [...mapa.entries()]
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)
}

function calcularMes(mes: string, dados: DadosBrutos, metaPercentual: number): DadosMesAnalise {
  const { receitas, gastosFixos, gastosVariaveis, investimentos } = dados
  const gastosVariaveisParcelados = gastosVariaveis.filter(g => g.parcelado)
  const gastosVariaveisAvulsos = gastosVariaveis.filter(g => !g.parcelado)

  const receitasMes = [
    ...receitas.filter(r => r.mes_referencia === mes),
    ...projetarReceitasRecorrentes(receitas, mes),
  ]
  const fixosMes = [
    ...gastosFixos.filter(g => g.mes_referencia === mes),
    ...projetarGastosFixosRecorrentes(gastosFixos, mes),
  ]
  const parceladosProjetadosMes = projetarGastosParcelados(gastosVariaveisParcelados, mes)
  const variaveisAvulsosMes = gastosVariaveisAvulsos.filter(g => g.mes_referencia === mes)

  const receitaTotal = calcularReceitas(receitasMes)
  const gastosFixosTotal = calcularGastosFixos(fixosMes)
  const gastosVariaveisTotal = calcularGastosVariaveis([...variaveisAvulsosMes, ...parceladosProjetadosMes])
  const totalGastos = calcularTotalGastos(gastosFixosTotal, gastosVariaveisTotal)
  const economiaReal = calcularEconomia(receitaTotal, totalGastos)
  const economiaPercentual = receitaTotal > 0 ? Math.round((economiaReal / receitaTotal) * 1000) / 10 : 0

  const investidoMes = investimentos
    .filter(inv => inv.data_aporte.slice(0, 7) === mes.slice(0, 7))
    .reduce((sum, inv) => sum + inv.valor, 0)
  const saldoLivre = calcularSaldoLivre(economiaReal, investidoMes)

  const categoriasFixos = somarPorCategoria(fixosMes)
  const categoriasVariaveis = somarPorCategoria(
    [...variaveisAvulsosMes, ...parceladosProjetadosMes.map(g => ({
      categoria: g.categoria,
      valor: g.valor_parcela ?? g.valor,
    }))]
  )

  return {
    mesReferencia: mes,
    receitaTotal,
    gastosFixosTotal,
    gastosVariaveisTotal,
    totalGastos,
    economiaReal,
    economiaPercentual,
    saldoLivre,
    categoriasFixos,
    categoriasVariaveis,
  }
}

function listarParcelamentosAtivos(gastosVariaveis: GastoVariavel[], mesAtual: string): ParcelamentoAtivo[] {
  const parcelados = gastosVariaveis.filter(g => g.parcelado && g.total_parcelas)
  return projetarGastosParcelados(parcelados, mesAtual).map(g => {
    const totalParcelas = g.total_parcelas!
    const valorParcela = g.valor_parcela ?? g.valor
    const parcelasRestantes = totalParcelas - g.parcela_atual + 1
    return {
      nome: g.nome,
      categoria: g.categoria,
      parcelaAtual: g.parcela_atual,
      totalParcelas,
      valorParcela,
      valorRestante: parcelasRestantes * valorParcela,
    }
  })
}

function calcularVariacaoPorCategoria(mesAtual: DadosMesAnalise, mesAnterior: DadosMesAnalise) {
  const totalAtual = new Map<string, number>()
  const totalAnterior = new Map<string, number>()
  for (const { categoria, valor } of [...mesAtual.categoriasFixos, ...mesAtual.categoriasVariaveis]) {
    totalAtual.set(categoria, (totalAtual.get(categoria) ?? 0) + valor)
  }
  for (const { categoria, valor } of [...mesAnterior.categoriasFixos, ...mesAnterior.categoriasVariaveis]) {
    totalAnterior.set(categoria, (totalAnterior.get(categoria) ?? 0) + valor)
  }
  const categorias = new Set([...totalAtual.keys(), ...totalAnterior.keys()])
  return [...categorias]
    .map(categoria => {
      const valorAtual = totalAtual.get(categoria) ?? 0
      const valorAnterior = totalAnterior.get(categoria) ?? 0
      return { categoria, valorAtual, valorAnterior, delta: valorAtual - valorAnterior }
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5)
}

export function montarDadosAnaliseMensal(
  dados: DadosBrutos,
  mesAtualRef: string,
  mesAnteriorRef: string,
  metaPercentual: number
): DadosAnaliseMensal {
  const mesAtual = calcularMes(mesAtualRef, dados, metaPercentual)
  const mesAnterior = calcularMes(mesAnteriorRef, dados, metaPercentual)
  const parcelamentosAtivos = listarParcelamentosAtivos(dados.gastosVariaveis, mesAtualRef)
  const categoriasComMaiorVariacao = calcularVariacaoPorCategoria(mesAtual, mesAnterior)

  const investimentosAteAgora = dados.investimentos.filter(inv => inv.data_aporte.slice(0, 7) <= mesAtualRef.slice(0, 7))
  const patrimonioTotal = investimentosAteAgora.reduce((sum, inv) => sum + inv.valor, 0)
  const porClasse = new Map<string, number>()
  for (const inv of investimentosAteAgora) {
    porClasse.set(inv.categoria, (porClasse.get(inv.categoria) ?? 0) + inv.valor)
  }
  const distribuicaoPorClasse = [...porClasse.entries()]
    .map(([classe, valor]) => ({
      classe,
      valor,
      percentual: patrimonioTotal > 0 ? Math.round((valor / patrimonioTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.valor - a.valor)

  return {
    mesAtual,
    mesAnterior,
    metaPercentual,
    parcelamentosAtivos,
    categoriasComMaiorVariacao,
    patrimonioTotal,
    distribuicaoPorClasse,
  }
}
