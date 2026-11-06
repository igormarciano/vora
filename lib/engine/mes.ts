import type { GastoFixo, GastoVariavel, Receita } from '@/types'
import {
  deslocarMesReferencia,
  diferencaEmMeses,
  projetarGastosFixosRecorrentes,
  projetarGastosParcelados,
  projetarReceitasRecorrentes,
} from '@/lib/engine'

/**
 * Helpers que montam "o que existe em um mês" a partir de TODOS os registros do
 * usuário, aplicando as mesmas projeções de recorrência/parcelamento usadas no
 * resto do app (sem duplicar nada no banco). Centralizar aqui evita que cada
 * tela repita a mesma combinação de filtros — origem do bug da lista de receitas.
 */

export function receitasDoMes(todas: Receita[], mes: string): Receita[] {
  return [...todas.filter(r => r.mes_referencia === mes), ...projetarReceitasRecorrentes(todas, mes)]
}

export function fixosDoMes(todos: GastoFixo[], mes: string): GastoFixo[] {
  return [...todos.filter(g => g.mes_referencia === mes), ...projetarGastosFixosRecorrentes(todos, mes)]
}

/** Avulsos lançados no mês + parcelas de compras parceladas ativas no mês. */
export function variaveisDoMes(todos: GastoVariavel[], mes: string): GastoVariavel[] {
  const avulsos = todos.filter(g => !g.parcelado && g.mes_referencia === mes)
  const parcelas = projetarGastosParcelados(todos.filter(g => g.parcelado), mes)
  return [...avulsos, ...parcelas]
}

/** Valor que o gasto variável pesa no mês (parcela, quando parcelado). */
export function valorNoMes(g: GastoVariavel): number {
  if (g.parcelado && g.total_parcelas) return g.valor_parcela ?? g.valor / g.total_parcelas
  return g.valor
}

// ── Cartões ──────────────────────────────────────────────────────────────────

export interface FaturaCartao {
  fixos: GastoFixo[]
  compras: GastoVariavel[]
  totalFixos: number
  totalCompras: number
  total: number
  /** Soma das parcelas que ainda vão cair nos meses seguintes ao `mes`. */
  parceladoFuturo: number
}

export function faturaDoCartao(
  cartaoId: string,
  fixos: GastoFixo[],
  variaveis: GastoVariavel[],
  mes: string,
): FaturaCartao {
  const fixosCartao = fixosDoMes(fixos.filter(f => f.vinculado_cartao_id === cartaoId), mes)
  const comprasCartao = variaveisDoMes(variaveis.filter(v => v.cartao_id === cartaoId), mes)
  const totalFixos = fixosCartao.reduce((s, f) => s + f.valor, 0)
  const totalCompras = comprasCartao.reduce((s, c) => s + valorNoMes(c), 0)

  let parceladoFuturo = 0
  for (const c of comprasCartao) {
    if (c.parcelado && c.total_parcelas) parceladoFuturo += valorNoMes(c) * (c.total_parcelas - c.parcela_atual)
  }

  return {
    fixos: fixosCartao,
    compras: comprasCartao,
    totalFixos,
    totalCompras,
    total: totalFixos + totalCompras,
    parceladoFuturo,
  }
}

// ── Análise: onde cortar ─────────────────────────────────────────────────────

/** Categorias que normalmente são escolha (dá pra reduzir sem mexer no essencial). */
const DISCRICIONARIAS = ['streaming', 'restaurante', 'lazer', 'roupas', 'beleza', 'compras online', 'marketing']

export function ehDiscricionaria(categoria: string): boolean {
  const c = categoria.toLowerCase()
  return DISCRICIONARIAS.some(k => c.includes(k))
}

export interface CategoriaAnalise {
  categoria: string
  atual: number
  /** Média dos meses anteriores com dados (até 3). null quando não há histórico. */
  media: number | null
  variacao: number | null
  pctReceita: number
  discricionaria: boolean
  itens: { nome: string; valor: number; tipo: 'fixo' | 'variavel' }[]
}

export function analisarCategorias(
  fixos: GastoFixo[],
  variaveis: GastoVariavel[],
  mes: string,
  receitaMes: number,
): CategoriaAnalise[] {
  const somar = (m: string) => {
    const map = new Map<string, { total: number; itens: CategoriaAnalise['itens'] }>()
    const add = (cat: string, nome: string, valor: number, tipo: 'fixo' | 'variavel') => {
      const key = cat || '🔖 Outros'
      if (!map.has(key)) map.set(key, { total: 0, itens: [] })
      const e = map.get(key)!
      e.total += valor
      e.itens.push({ nome, valor, tipo })
    }
    for (const f of fixosDoMes(fixos, m)) add(f.categoria, f.nome, f.valor, 'fixo')
    for (const v of variaveisDoMes(variaveis, m)) add(v.categoria, v.nome, valorNoMes(v), 'variavel')
    return map
  }

  const atual = somar(mes)
  const anteriores = [1, 2, 3].map(d => somar(deslocarMesReferencia(mes, -d))).filter(m => m.size > 0)

  return Array.from(atual.entries())
    .map(([categoria, { total, itens }]) => {
      const media = anteriores.length > 0
        ? anteriores.reduce((s, m) => s + (m.get(categoria)?.total ?? 0), 0) / anteriores.length
        : null
      return {
        categoria,
        atual: total,
        media,
        variacao: media && media > 0 ? (total - media) / media : null,
        pctReceita: receitaMes > 0 ? total / receitaMes : 0,
        discricionaria: ehDiscricionaria(categoria),
        itens: itens.sort((a, b) => b.valor - a.valor),
      }
    })
    .sort((a, b) => b.atual - a.atual)
}

// ── Timeline de compromissos ─────────────────────────────────────────────────

export interface PontoTimeline {
  mes: string
  parcelas: number
  fixosComPrazo: number
  fixosRecorrentes: number
}

export interface EventoReducao {
  /** Primeiro mês em que o gasto já não existe mais. */
  mes: string
  nome: string
  valor: number
  tipo: 'parcela' | 'fixo'
  detalhe: string
}

export function timelineCompromissos(
  fixos: GastoFixo[],
  variaveis: GastoVariavel[],
  mesInicial: string,
  quantMeses = 12,
): { pontos: PontoTimeline[]; eventos: EventoReducao[] } {
  const pontos: PontoTimeline[] = []
  for (let i = 0; i < quantMeses; i++) {
    const mes = deslocarMesReferencia(mesInicial, i)
    const fixosMes = fixosDoMes(fixos, mes).filter(f => f.recorrente)
    const parcelas = projetarGastosParcelados(variaveis.filter(v => v.parcelado), mes)
    pontos.push({
      mes,
      parcelas: parcelas.reduce((s, p) => s + valorNoMes(p), 0),
      fixosComPrazo: fixosMes.filter(f => f.duracao_meses != null).reduce((s, f) => s + f.valor, 0),
      fixosRecorrentes: fixosMes.filter(f => f.duracao_meses == null).reduce((s, f) => s + f.valor, 0),
    })
  }

  const fim = deslocarMesReferencia(mesInicial, quantMeses)
  const eventos: EventoReducao[] = []

  // Parcelas ativas hoje: quando termina cada uma
  for (const p of projetarGastosParcelados(variaveis.filter(v => v.parcelado), mesInicial)) {
    if (!p.total_parcelas) continue
    const restantes = p.total_parcelas - p.parcela_atual
    const mesFim = deslocarMesReferencia(mesInicial, restantes + 1)
    if (mesFim > fim) continue
    eventos.push({
      mes: mesFim,
      nome: p.nome,
      valor: valorNoMes(p),
      tipo: 'parcela',
      detalhe: restantes === 0 ? 'última parcela neste mês' : `faltam ${restantes} de ${p.total_parcelas} parcelas`,
    })
  }

  // Fixos com duração definida ativos hoje: quando acabam
  // (a projeção sobrescreve mes_referencia, então usamos o mês de origem do registro)
  const origem = new Map(fixos.map(f => [f.id, f.mes_referencia]))
  for (const f of fixosDoMes(fixos, mesInicial)) {
    if (!f.recorrente || f.duracao_meses == null) continue
    const inicio = origem.get(f.id) ?? f.mes_referencia
    const decorridos = diferencaEmMeses(inicio, mesInicial)
    const mesFim = deslocarMesReferencia(inicio, f.duracao_meses)
    if (mesFim > fim) continue
    eventos.push({
      mes: mesFim,
      nome: f.nome,
      valor: f.valor,
      tipo: 'fixo',
      detalhe: `${f.duracao_meses - decorridos - 1 <= 0 ? 'último mês agora' : `mais ${f.duracao_meses - decorridos - 1} meses`}`,
    })
  }

  eventos.sort((a, b) => a.mes.localeCompare(b.mes) || b.valor - a.valor)
  return { pontos, eventos }
}
