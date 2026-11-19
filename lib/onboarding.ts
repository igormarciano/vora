/**
 * Modelo do onboarding "Monte seu mês".
 *
 * O usuário responde perguntas de perfil (como recebe, onde mora, como se locomove,
 * assinaturas, bancos...) e este módulo converte as respostas em lançamentos reais
 * (receitas, gastos fixos, estimativas de gastos variáveis e cartões). É puro: a
 * mesma função alimenta a prévia ao vivo no cliente e a gravação no servidor.
 *
 * Os valores sugeridos são pontos de partida editáveis, não verdades. Preços de
 * assinaturas são aproximados (referência: 2026) e o usuário ajusta na hora.
 */

// ── Catálogos ──────────────────────────────────────────────────────────────────

export type TipoRenda = 'clt' | 'pj' | 'autonomo' | 'aposentado' | 'outro'

export const TIPOS_RENDA: { id: TipoRenda; titulo: string; descricao: string; icon: string }[] = [
  { id: 'clt', titulo: 'Salário (CLT)', descricao: 'Carteira assinada', icon: '💼' },
  { id: 'pj', titulo: 'PJ', descricao: 'Nota fiscal por empresa', icon: '🧾' },
  { id: 'autonomo', titulo: 'Autônomo ou freela', descricao: 'Renda que varia', icon: '🧑‍💻' },
  { id: 'aposentado', titulo: 'Aposentadoria ou pensão', descricao: 'Benefício mensal', icon: '🏖️' },
  { id: 'outro', titulo: 'Outro', descricao: 'Mesada, bolsa, aluguel...', icon: '✨' },
]

export type TipoMoradia = 'aluguel' | 'financiamento' | 'propria' | 'familia'

export const TIPOS_MORADIA: { id: TipoMoradia; titulo: string; descricao: string; icon: string; sugestao: number }[] = [
  { id: 'aluguel', titulo: 'Aluguel', descricao: 'Pago aluguel todo mês', icon: '🔑', sugestao: 1800 },
  { id: 'financiamento', titulo: 'Financiamento', descricao: 'Estou pagando o imóvel', icon: '🏦', sugestao: 2200 },
  { id: 'propria', titulo: 'Casa quitada', descricao: 'Sem parcela de moradia', icon: '🏡', sugestao: 0 },
  { id: 'familia', titulo: 'Com a família', descricao: 'Ajudo com algumas contas', icon: '👨‍👩‍👧', sugestao: 500 },
]

export interface ItemCatalogo {
  id: string
  nome: string
  icon: string
  valor: number
  categoria: string
  tipo: 'fixo' | 'variavel'
}

export const CONTAS_CASA: ItemCatalogo[] = [
  { id: 'energia', nome: 'Energia', icon: '⚡', valor: 160, categoria: '⚡ Energia/Água', tipo: 'fixo' },
  { id: 'agua', nome: 'Água', icon: '💧', valor: 80, categoria: '⚡ Energia/Água', tipo: 'fixo' },
  { id: 'internet', nome: 'Internet', icon: '📶', valor: 110, categoria: '📡 Internet/Telefone', tipo: 'fixo' },
  { id: 'celular', nome: 'Plano de celular', icon: '📱', valor: 60, categoria: '📡 Internet/Telefone', tipo: 'fixo' },
  { id: 'gas', nome: 'Gás', icon: '🔥', valor: 45, categoria: '⚡ Energia/Água', tipo: 'fixo' },
  { id: 'diarista', nome: 'Diarista', icon: '🧹', valor: 600, categoria: '🏠 Moradia', tipo: 'fixo' },
]

export const TRANSPORTES: { id: string; titulo: string; icon: string; itens: ItemCatalogo[] }[] = [
  {
    id: 'carro', titulo: 'Carro', icon: '🚗', itens: [
      { id: 'combustivel', nome: 'Combustível', icon: '⛽', valor: 450, categoria: '⛽ Combustível', tipo: 'variavel' },
      { id: 'seguro', nome: 'Seguro do carro', icon: '🛡️', valor: 200, categoria: '🚗 Transporte', tipo: 'fixo' },
      { id: 'estacionamento', nome: 'Estacionamento', icon: '🅿️', valor: 120, categoria: '🚌 Transporte', tipo: 'variavel' },
    ],
  },
  {
    id: 'moto', titulo: 'Moto', icon: '🏍️', itens: [
      { id: 'combustivel_moto', nome: 'Combustível da moto', icon: '⛽', valor: 180, categoria: '⛽ Combustível', tipo: 'variavel' },
    ],
  },
  {
    id: 'app', titulo: 'Apps de corrida', icon: '📲', itens: [
      { id: 'uber', nome: 'Corridas por app', icon: '📲', valor: 250, categoria: '🚌 Transporte', tipo: 'variavel' },
    ],
  },
  {
    id: 'publico', titulo: 'Transporte público', icon: '🚇', itens: [
      { id: 'onibus', nome: 'Transporte público', icon: '🚇', valor: 220, categoria: '🚌 Transporte', tipo: 'variavel' },
    ],
  },
]

export const ASSINATURAS: ItemCatalogo[] = [
  { id: 'netflix', nome: 'Netflix', icon: '🎬', valor: 44.9, categoria: '📺 Streaming', tipo: 'fixo' },
  { id: 'spotify', nome: 'Spotify', icon: '🎧', valor: 23.9, categoria: '📺 Streaming', tipo: 'fixo' },
  { id: 'prime', nome: 'Amazon Prime', icon: '📦', valor: 19.9, categoria: '📺 Streaming', tipo: 'fixo' },
  { id: 'disney', nome: 'Disney+', icon: '🏰', valor: 46.9, categoria: '📺 Streaming', tipo: 'fixo' },
  { id: 'max', nome: 'Max', icon: '📺', valor: 39.9, categoria: '📺 Streaming', tipo: 'fixo' },
  { id: 'globoplay', nome: 'Globoplay', icon: '🌐', valor: 24.9, categoria: '📺 Streaming', tipo: 'fixo' },
  { id: 'youtube', nome: 'YouTube Premium', icon: '▶️', valor: 26.9, categoria: '📺 Streaming', tipo: 'fixo' },
  { id: 'icloud', nome: 'iCloud / Google One', icon: '☁️', valor: 14.9, categoria: '📺 Streaming', tipo: 'fixo' },
  { id: 'chatgpt', nome: 'IA (ChatGPT, Claude...)', icon: '🤖', valor: 110, categoria: '💼 Trabalho', tipo: 'fixo' },
  { id: 'academia', nome: 'Academia', icon: '🏋️', valor: 130, categoria: '💊 Saúde', tipo: 'fixo' },
]

export const FAMILIA: ItemCatalogo[] = [
  { id: 'plano_saude', nome: 'Plano de saúde', icon: '🩺', valor: 450, categoria: '💊 Saúde', tipo: 'fixo' },
  { id: 'escola', nome: 'Escola dos filhos', icon: '🎒', valor: 1200, categoria: '📚 Educação', tipo: 'fixo' },
  { id: 'curso', nome: 'Faculdade ou curso', icon: '🎓', valor: 600, categoria: '📚 Educação', tipo: 'fixo' },
  { id: 'terapia', nome: 'Terapia', icon: '🧠', valor: 600, categoria: '💊 Saúde', tipo: 'fixo' },
  { id: 'pet', nome: 'Pet (ração e cuidados)', icon: '🐾', valor: 200, categoria: '🐾 Pets', tipo: 'variavel' },
  { id: 'farmacia', nome: 'Farmácia', icon: '💊', valor: 120, categoria: '💊 Farmácia', tipo: 'variavel' },
]

export const BANCOS: { id: string; nome: string; cor: string }[] = [
  { id: 'nubank', nome: 'Nubank', cor: '#820AD1' },
  { id: 'itau', nome: 'Itaú', cor: '#EC7000' },
  { id: 'inter', nome: 'Inter', cor: '#FF7A00' },
  { id: 'c6', nome: 'C6 Bank', cor: '#2B2B2B' },
  { id: 'bradesco', nome: 'Bradesco', cor: '#CC092F' },
  { id: 'santander', nome: 'Santander', cor: '#EC0000' },
  { id: 'bb', nome: 'Banco do Brasil', cor: '#2A5CAA' },
  { id: 'caixa', nome: 'Caixa', cor: '#005CA9' },
  { id: 'xp', nome: 'XP', cor: '#111111' },
  { id: 'mercadopago', nome: 'Mercado Pago', cor: '#00A6E0' },
  { id: 'picpay', nome: 'PicPay', cor: '#11C76F' },
  { id: 'btg', nome: 'BTG', cor: '#0B2A4A' },
]

export type EstiloDiaADia = 'enxuto' | 'equilibrado' | 'solto'

/** Percentuais da renda usados como sugestão inicial do dia a dia, por estilo. */
export const ESTILOS: { id: EstiloDiaADia; titulo: string; descricao: string; icon: string; pct: { mercado: number; restaurante: number; lazer: number; compras: number } }[] = [
  { id: 'enxuto', titulo: 'Enxuto', descricao: 'Cozinho em casa, saio pouco', icon: '🥗', pct: { mercado: 0.10, restaurante: 0.03, lazer: 0.03, compras: 0.02 } },
  { id: 'equilibrado', titulo: 'Equilibrado', descricao: 'Peço delivery e saio às vezes', icon: '🍕', pct: { mercado: 0.11, restaurante: 0.06, lazer: 0.05, compras: 0.04 } },
  { id: 'solto', titulo: 'Solto', descricao: 'Restaurantes, bares e compras com frequência', icon: '🥂', pct: { mercado: 0.12, restaurante: 0.10, lazer: 0.08, compras: 0.07 } },
]

// ── Respostas ──────────────────────────────────────────────────────────────────

export interface Selecao { on: boolean; valor: number }

export interface RespostasOnboarding {
  tipoRenda: TipoRenda | null
  renda: number
  temExtra: boolean
  extra: number
  moradia: TipoMoradia | null
  moradiaValor: number
  condominio: number
  contas: Record<string, Selecao>
  transportes: string[]
  transporteItens: Record<string, Selecao>
  assinaturas: Record<string, Selecao>
  familia: Record<string, Selecao>
  bancos: string[]
  bancoPrincipal: string | null
  assinaturasNoCartao: boolean
  estilo: EstiloDiaADia | null
  diaADia: { mercado: number; restaurante: number; lazer: number; compras: number }
  meta: number
  /** Passos com sugestões pré-marcadas que o usuário já abriu */
  vistos: string[]
}

export const RESPOSTAS_INICIAIS: RespostasOnboarding = {
  tipoRenda: null,
  renda: 0,
  temExtra: false,
  extra: 0,
  moradia: null,
  moradiaValor: 0,
  condominio: 0,
  contas: Object.fromEntries(CONTAS_CASA.map(c => [c.id, { on: false, valor: c.valor }])),
  transportes: [],
  transporteItens: Object.fromEntries(TRANSPORTES.flatMap(t => t.itens).map(i => [i.id, { on: true, valor: i.valor }])),
  assinaturas: Object.fromEntries(ASSINATURAS.map(a => [a.id, { on: false, valor: a.valor }])),
  familia: Object.fromEntries(FAMILIA.map(f => [f.id, { on: false, valor: f.valor }])),
  bancos: [],
  bancoPrincipal: null,
  assinaturasNoCartao: true,
  estilo: null,
  diaADia: { mercado: 0, restaurante: 0, lazer: 0, compras: 0 },
  meta: 20,
  vistos: [],
}

/** Itens pré-marcados quando o usuário abre o passo pela primeira vez. */
export const PRE_MARCADOS: Record<string, { campo: 'contas' | 'familia'; ids: string[] }> = {
  casa: { campo: 'contas', ids: ['energia', 'agua', 'internet', 'celular'] },
  familia: { campo: 'familia', ids: ['farmacia'] },
}

/** Sugestão de dia a dia a partir da renda e do estilo, arredondada para múltiplos de 50. */
export function sugerirDiaADia(renda: number, estilo: EstiloDiaADia) {
  const pct = ESTILOS.find(e => e.id === estilo)!.pct
  const r = (v: number) => Math.max(50, Math.round((renda * v) / 50) * 50)
  return { mercado: r(pct.mercado), restaurante: r(pct.restaurante), lazer: r(pct.lazer), compras: r(pct.compras) }
}

// ── Montagem do mês ────────────────────────────────────────────────────────────

export interface LancamentoMontado {
  nome: string
  valor: number
  categoria: string
  icon: string
  /** id do banco (BANCOS) quando o gasto fixo é cobrado no cartão */
  bancoId?: string
}

export interface MesMontado {
  receitas: { nome: string; valor: number; tipo: 'salario' | 'renda_extra' | 'outros'; tipo_custom?: string }[]
  fixos: LancamentoMontado[]
  variaveis: LancamentoMontado[]
  cartoes: { bancoId: string; nome: string; cor: string }[]
  totalReceitas: number
  totalFixos: number
  totalVariaveis: number
  sobra: number
  metaValor: number
}

const RECEITA_POR_TIPO: Record<TipoRenda, { nome: string; tipo: 'salario' | 'renda_extra' | 'outros'; tipo_custom?: string }> = {
  clt: { nome: 'Salário', tipo: 'salario' },
  pj: { nome: 'Renda PJ', tipo: 'outros', tipo_custom: 'PJ' },
  autonomo: { nome: 'Renda como autônomo', tipo: 'outros', tipo_custom: 'Autônomo' },
  aposentado: { nome: 'Aposentadoria', tipo: 'outros', tipo_custom: 'Aposentadoria' },
  outro: { nome: 'Minha renda', tipo: 'outros' },
}

export function montarMes(r: RespostasOnboarding): MesMontado {
  const receitas: MesMontado['receitas'] = []
  if (r.renda > 0) receitas.push({ ...RECEITA_POR_TIPO[r.tipoRenda ?? 'outro'], valor: r.renda })
  if (r.temExtra && r.extra > 0) receitas.push({ nome: 'Renda extra', valor: r.extra, tipo: 'renda_extra' })

  const fixos: LancamentoMontado[] = []
  const variaveis: LancamentoMontado[] = []
  const add = (item: ItemCatalogo, valor: number, bancoId?: string) => {
    if (valor <= 0) return
    const l = { nome: item.nome, valor, categoria: item.categoria, icon: item.icon, bancoId }
    if (item.tipo === 'fixo') fixos.push(l)
    else variaveis.push({ ...l, bancoId: undefined })
  }

  // Moradia
  if (r.moradia && r.moradia !== 'propria' && r.moradiaValor > 0) {
    const nome = r.moradia === 'aluguel' ? 'Aluguel' : r.moradia === 'financiamento' ? 'Financiamento do imóvel' : 'Ajuda em casa'
    fixos.push({ nome, valor: r.moradiaValor, categoria: r.moradia === 'financiamento' ? '💳 Financiamento' : '🏠 Moradia', icon: '🏠' })
  }
  if (r.condominio > 0) fixos.push({ nome: 'Condomínio', valor: r.condominio, categoria: '🏠 Moradia', icon: '🏢' })

  for (const c of CONTAS_CASA) if (r.contas[c.id]?.on) add(c, r.contas[c.id].valor)

  for (const t of TRANSPORTES) {
    if (!r.transportes.includes(t.id)) continue
    for (const i of t.itens) if (r.transporteItens[i.id]?.on) add(i, r.transporteItens[i.id].valor)
  }

  const bancoAssinaturas = r.assinaturasNoCartao && r.bancoPrincipal ? r.bancoPrincipal : undefined
  for (const a of ASSINATURAS) if (r.assinaturas[a.id]?.on) add(a, r.assinaturas[a.id].valor, bancoAssinaturas)

  for (const f of FAMILIA) if (r.familia[f.id]?.on) add(f, r.familia[f.id].valor)

  // Dia a dia (estimativas do mês, ficam como gastos variáveis editáveis)
  const d = r.diaADia
  if (d.mercado > 0) variaveis.push({ nome: 'Mercado', valor: d.mercado, categoria: '🛒 Mercado', icon: '🛒' })
  if (d.restaurante > 0) variaveis.push({ nome: 'Restaurantes e delivery', valor: d.restaurante, categoria: '🍕 Restaurante', icon: '🍕' })
  if (d.lazer > 0) variaveis.push({ nome: 'Lazer e saídas', valor: d.lazer, categoria: '🎭 Lazer', icon: '🎭' })
  if (d.compras > 0) variaveis.push({ nome: 'Compras e roupas', valor: d.compras, categoria: '👗 Roupas', icon: '🛍️' })

  const cartoes = r.bancos
    .map(id => BANCOS.find(b => b.id === id))
    .filter((b): b is (typeof BANCOS)[number] => !!b)
    .map(b => ({ bancoId: b.id, nome: b.nome, cor: b.cor }))

  const totalReceitas = receitas.reduce((s, x) => s + x.valor, 0)
  const totalFixos = fixos.reduce((s, x) => s + x.valor, 0)
  const totalVariaveis = variaveis.reduce((s, x) => s + x.valor, 0)
  return {
    receitas, fixos, variaveis, cartoes,
    totalReceitas, totalFixos, totalVariaveis,
    sobra: totalReceitas - totalFixos - totalVariaveis,
    metaValor: totalReceitas * (r.meta / 100),
  }
}
