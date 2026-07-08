export interface Profile {
  id: string
  nome: string | null
  meta_economia_percentual: number
  layout_preferencia: 'horizontal' | 'vertical'
  created_at: string
}

export interface Receita {
  id: string
  user_id: string
  nome: string
  valor: number
  tipo: 'salario' | 'renda_extra' | 'outros'
  tipo_custom: string | null
  recorrente: boolean
  duracao_meses: number | null
  mes_referencia: string
  created_at: string
}

export interface Cartao {
  id: string
  user_id: string
  nome: string
  bandeira: string | null
  limite: number | null
  color: string | null
  created_at: string
}

export type PersonType = 'PF' | 'PJ'

export interface GastoFixo {
  id: string
  user_id: string
  nome: string
  valor: number
  categoria: string
  icone: string | null
  vencimento: number | null
  recorrente: boolean
  duracao_meses: number | null
  vinculado_cartao_id: string | null
  person_type: PersonType
  description: string | null
  is_paid: boolean
  mes_referencia: string
  created_at: string
}

export interface GastoVariavel {
  id: string
  user_id: string
  nome: string
  valor: number
  categoria: string
  icone: string | null
  forma_pagamento: 'dinheiro' | 'debito' | 'credito'
  cartao_id: string | null
  parcelado: boolean
  total_parcelas: number | null
  parcela_atual: number
  valor_parcela: number | null
  description: string | null
  is_paid: boolean
  expense_nature: PersonType
  mes_referencia: string
  created_at: string
}

export interface CustomCategory {
  id: string
  user_id: string
  emoji: string
  nome: string
  contexto: 'fixo' | 'variavel' | 'ambos'
  created_at: string
}

export interface Investimento {
  id: string
  user_id: string
  nome: string
  valor: number
  categoria: 'renda_fixa' | 'renda_variavel' | 'cripto' | 'credito_privado' | 'internacional'
  rentabilidade_anual: number | null
  vencimento: string | null
  liquidez: string | null
  observacao: string | null
  data_aporte: string
  created_at: string
}

export interface PendenciaInvestimento {
  id: string
  user_id: string
  valor_disponivel: number
  valor_restante: number
  mes_referencia: string
  status: 'pendente' | 'distribuido' | 'dispensado'
  created_at: string
}

export interface SnapshotMensal {
  id: string
  user_id: string
  mes_referencia: string
  total_receitas: number
  total_gastos_fixos: number
  total_gastos_variaveis: number
  total_gastos: number
  economia: number
  meta_economia: number
  status: 'bom' | 'atencao' | 'ruim' | null
  total_investido: number
  saldo_livre: number
  created_at: string
}

export type StatusMes = 'bom' | 'atencao' | 'ruim'

export interface DashboardData {
  totalReceitas: number
  totalGastos: number
  economia: number
  meta: number
  status: StatusMes | null
  saldoLivre: number
}

export interface ProjecaoMensal {
  mes: string
  receitas: number
  gastos: number
  economia: number
  status: StatusMes | null
}

export interface AnaliseInsight {
  titulo: string
  descricao: string
}

export interface AnaliseRecomendacao {
  acao: string
  impacto_estimado: string | null
}

export interface AnaliseMensal {
  id: string
  user_id: string
  mes_referencia: string
  status_geral: 'bom' | 'atencao' | 'critico'
  resumo: string
  insights: AnaliseInsight[]
  recomendacoes: AnaliseRecomendacao[]
  created_at: string
}
