import { formatarMesReferencia } from '@/lib/engine'
import type { DadosAnaliseMensal, CategoriaValor, ParcelamentoAtivo } from './aggregate'

export const SYSTEM_PROMPT = `Você é um analista financeiro pessoal que trabalha para o app Vora. Sua função é analisar o mês financeiro de um usuário e devolver uma leitura curta e acionável — nunca um resumo genérico dos números que ele já vê na tela.

Regras:
- Não repita números que já aparecem no dashboard (total de receita, total de gastos). Foque em padrões, riscos e oportunidades que exigem interpretação.
- Priorize no máximo 3 recomendações, ordenadas por impacto financeiro.
- Compare sempre com o mês anterior e com a meta de economia do usuário, quando disponíveis.
- Se o usuário está batendo a meta, não sugira cortes artificiais — sugira para onde direcionar o excedente (quitação de dívida, investimento, reserva).
- Se algum gasto variável está concentrado em poucas categorias ou crescendo mês a mês, aponte isso especificamente.
- Tom: direto, sem jargão financeiro, como um amigo que entende de dinheiro. Nunca alarmista.
- Responda em português do Brasil.
- Retorne SOMENTE um JSON válido no formato especificado, sem texto antes ou depois.

Formato de saída (JSON):
{
  "status_geral": "bom" | "atencao" | "critico",
  "resumo": "1-2 frases sobre o mês, sem repetir números do dashboard",
  "insights": [
    { "titulo": "string curto", "descricao": "1-2 frases explicando o padrão observado" }
  ],
  "recomendacoes": [
    { "acao": "string curta e específica", "impacto_estimado": "string, ex: 'libera R$300/mês' ou null se não quantificável" }
  ]
}`

function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatarListaCategorias(categorias: CategoriaValor[]): string {
  if (categorias.length === 0) return '(nenhum gasto lançado)'
  return categorias.map(c => `- ${c.categoria}: R$ ${formatarValor(c.valor)}`).join('\n')
}

function formatarParcelamentos(parcelamentos: ParcelamentoAtivo[]): string {
  if (parcelamentos.length === 0) return '(nenhum parcelamento em andamento)'
  return parcelamentos
    .map(p =>
      `- ${p.nome} (${p.categoria}): parcela ${p.parcelaAtual}/${p.totalParcelas} de R$ ${formatarValor(p.valorParcela)}, restam R$ ${formatarValor(p.valorRestante)}`
    )
    .join('\n')
}

function formatarVariacoes(variacoes: DadosAnaliseMensal['categoriasComMaiorVariacao']): string {
  if (variacoes.length === 0) return '(sem dados do mês anterior para comparar)'
  return variacoes
    .map(v => {
      const sinal = v.delta >= 0 ? '+' : ''
      return `${v.categoria}: ${sinal}R$ ${formatarValor(v.delta)} (de R$ ${formatarValor(v.valorAnterior)} para R$ ${formatarValor(v.valorAtual)})`
    })
    .join('; ')
}

function formatarDistribuicao(distribuicao: DadosAnaliseMensal['distribuicaoPorClasse']): string {
  if (distribuicao.length === 0) return '(sem investimentos cadastrados)'
  return distribuicao.map(d => `${d.classe}: R$ ${formatarValor(d.valor)} (${d.percentual}%)`).join('; ')
}

export function buildUserPrompt(dados: DadosAnaliseMensal): string {
  const { mesAtual, mesAnterior, metaPercentual, parcelamentosAtivos, categoriasComMaiorVariacao, patrimonioTotal, distribuicaoPorClasse } = dados

  return `Analise o mês financeiro abaixo.

DADOS DO MÊS ATUAL (${formatarMesReferencia(mesAtual.mesReferencia)}):
- Receita total: R$ ${formatarValor(mesAtual.receitaTotal)}
- Gastos fixos: R$ ${formatarValor(mesAtual.gastosFixosTotal)}
- Gastos variáveis: R$ ${formatarValor(mesAtual.gastosVariaveisTotal)}
- Saldo livre: R$ ${formatarValor(mesAtual.saldoLivre)}
- Economia real: R$ ${formatarValor(mesAtual.economiaReal)} (${mesAtual.economiaPercentual}% da receita)
- Meta de economia: ${metaPercentual}%

GASTOS FIXOS POR CATEGORIA:
${formatarListaCategorias(mesAtual.categoriasFixos)}

GASTOS VARIÁVEIS POR CATEGORIA:
${formatarListaCategorias(mesAtual.categoriasVariaveis)}

GASTOS PARCELADOS EM ANDAMENTO:
${formatarParcelamentos(parcelamentosAtivos)}

COMPARATIVO COM MÊS ANTERIOR (${formatarMesReferencia(mesAnterior.mesReferencia)}):
- Receita: R$ ${formatarValor(mesAnterior.receitaTotal)}
- Gastos totais: R$ ${formatarValor(mesAnterior.totalGastos)}
- Economia: ${mesAnterior.economiaPercentual}%
- Maiores variações por categoria: ${formatarVariacoes(categoriasComMaiorVariacao)}

INVESTIMENTOS:
- Patrimônio total: R$ ${formatarValor(patrimonioTotal)}
- Distribuição: ${formatarDistribuicao(distribuicaoPorClasse)}

Gere a análise no formato JSON especificado.`
}
