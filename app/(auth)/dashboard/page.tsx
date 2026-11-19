import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/Page'
import { Card } from '@/components/vora/ui'
import { createClient } from '@/lib/supabase/server'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { AnaliseMensalSection } from '@/components/dashboard/AnaliseMensalSection'
import {
  calcularGastosFixos,
  calcularGastosVariaveis,
  calcularMeta,
  calcularSaldoLivre,
  getMesReferencia,
  formatCurrency,
  formatarMesReferencia,
  gerarProjecaoMensal,
  projetarGastosFixosRecorrentes,
  projetarGastosParcelados,
} from '@/lib/engine'

const QUANT_MESES = 6

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const mesRef = getMesReferencia()

  // Busca todo o histórico do usuário (sem filtro de mês) para alimentar a
  // projeção dos próximos meses (Change Request 001, item 1) — os mesmos
  // helpers de "no duplication" usados em /gastos e /investimentos calculam,
  // a partir desses dados, o que se repete (recorrências e parcelas) em cada mês.
  const [{ data: receitasTodas }, { data: gastosFixosTodos }, { data: gastosVariaveisTodos }, { data: investimentosTodos }, { data: profile }, { data: analiseMensal }] =
    await Promise.all([
      supabase.from('receitas').select('*').eq('user_id', user.id),
      supabase.from('gastos_fixos').select('*').eq('user_id', user.id),
      supabase.from('gastos_variaveis').select('*').eq('user_id', user.id),
      supabase.from('investimentos').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('analises_mensais').select('*').eq('user_id', user.id).eq('mes_referencia', mesRef).maybeSingle(),
    ])

  const receitas = receitasTodas ?? []
  const gastosFixos = gastosFixosTodos ?? []
  const gastosVariaveis = gastosVariaveisTodos ?? []
  const investimentos = investimentosTodos ?? []

  const gastosVariaveisParcelados = gastosVariaveis.filter(g => g.parcelado)
  const gastosVariaveisAvulsos = gastosVariaveis.filter(g => !g.parcelado)

  const metaPercentual = profile?.meta_economia_percentual ?? 30

  // Projeção dos próximos QUANT_MESES (incluindo o mês atual) — base do gráfico
  // principal "Projeção futura" (1.4) e do gráfico "Capacidade de economia" (1.3).
  const projecao = gerarProjecaoMensal(
    { receitas, gastosFixos, gastosVariaveisParcelados, gastosVariaveisAvulsos },
    mesRef,
    QUANT_MESES,
    metaPercentual
  )

  // Indicadores do mês atual (mantidos idênticos ao cálculo anterior, agora
  // derivados do mesmo `projecao` usado pelos gráficos — sem regressões).
  const mesAtualProjetado = projecao[0]
  const totalReceitas = mesAtualProjetado.receitas
  const totalGastos = mesAtualProjetado.gastos
  const economia = mesAtualProjetado.economia
  const meta = calcularMeta(totalReceitas, metaPercentual)
  const status = mesAtualProjetado.status

  // Composição do mês atual (gastos fixos x variáveis x investido x saldo
  // livre) — para o gráfico de composição financeira (1.2).
  const fixosDoMes = gastosFixos.filter(g => g.mes_referencia === mesRef)
  const fixosProjetadosMes = projetarGastosFixosRecorrentes(gastosFixos, mesRef)
  const fixosMes = calcularGastosFixos([...fixosDoMes, ...fixosProjetadosMes])

  const variaveisAvulsosDoMes = gastosVariaveisAvulsos.filter(g => g.mes_referencia === mesRef)
  const parceladosProjetadosMes = projetarGastosParcelados(gastosVariaveisParcelados, mesRef)
  const variaveisMes = calcularGastosVariaveis([...variaveisAvulsosDoMes, ...parceladosProjetadosMes])

  const investidoMes = investimentos
    .filter(inv => getMesReferencia(new Date(inv.data_aporte)) === mesRef)
    .reduce((sum, inv) => sum + inv.valor, 0)

  const saldoLivreMes = calcularSaldoLivre(economia, investidoMes)

  // Evolução patrimonial projetada (CR003, itens 8 e 9):
  //   Patrimônio Futuro = Patrimônio Atual + Economias Futuras Acumuladas + Rentabilidade Projetada
  // Composta mês a mês a partir do patrimônio atual (soma dos investimentos),
  // somando a economia prevista de cada mês e o rendimento dos ativos.
  const patrimonioAtual = investimentos.reduce((sum, inv) => sum + inv.valor, 0)

  // Taxa de rentabilidade mensal ponderada pelos investimentos que têm rentabilidade definida.
  const investimentosComRent = investimentos.filter(inv => inv.rentabilidade_anual != null)
  const baseComRent = investimentosComRent.reduce((sum, inv) => sum + inv.valor, 0)
  const taxaAnualPonderada = baseComRent > 0
    ? investimentosComRent.reduce((sum, inv) => sum + inv.valor * (inv.rentabilidade_anual ?? 0), 0) / baseComRent
    : 0
  const taxaMensal = taxaAnualPonderada / 100 / 12

  // Economia prevista por mês: usa a economia real calculada do mês; quando não há
  // dados suficientes (mês sem receita projetada), recorre à meta configurada.
  const metaValorMensal = totalReceitas * (metaPercentual / 100)

  let patrimonio = patrimonioAtual
  const evolucao = projecao.map((p, i) => {
    if (i > 0) {
      const economiaPrevista = p.receitas > 0 ? p.economia : metaValorMensal
      const rendimento = patrimonio * taxaMensal
      patrimonio = patrimonio + economiaPrevista + rendimento
    }
    return {
      mes: p.mes,
      patrimonioAtual,
      economiasAcumuladas: patrimonio - patrimonioAtual,
      patrimonioTotal: patrimonio,
    }
  })

  const mesAtual = formatarMesReferencia(mesRef)
  const primeiroNome = (profile?.nome as string | null)?.split(' ')[0]
  const progressoMeta = meta > 0 ? Math.max(0, Math.min(1, economia / meta)) : 0
  const statusTexto =
    status === 'bom' ? 'Meta de economia batida'
    : status === 'atencao' ? 'Abaixo da meta, mas sobrando'
    : status === 'ruim' ? 'Gastos acima da receita'
    : 'Comece pelas receitas e gastos'

  return (
    <Page>
      <PageHeader eyebrow={mesAtual} title={primeiroNome ? `Olá, ${primeiroNome}` : 'Visão geral'} />

      {totalReceitas === 0 ? (
        <Card className="p-6 lg:p-10 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="w-14 h-14 rounded-[18px] bg-brand-soft flex items-center justify-center text-[28px] shrink-0">🌿</div>
          <div className="flex-1">
            <h2 className="text-[22px] font-bold tracking-[-0.02em] text-ink">Monte seu mês em 3 minutos</h2>
            <p className="text-[15px] text-ink-2 mt-1 max-w-xl">Responda algumas perguntas e a Vora cria suas receitas, contas fixas, assinaturas e cartões. Você só ajusta o que quiser.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link href="/setup" className="h-12 px-6 rounded-full bg-brand-strong text-white text-[15px] font-medium inline-flex items-center justify-center">Montar meu mês</Link>
            <Link href="/receitas" className="h-12 px-6 rounded-full bg-white border border-hairline text-ink text-[15px] font-medium inline-flex items-center justify-center">Adicionar manualmente</Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3 lg:gap-4">
            {/* Destaque: sobra do mês */}
            <div className="rounded-[24px] p-6 lg:p-7 bg-[linear-gradient(150deg,#3c4a3c_0%,#2c372c_100%)] text-white shadow-[var(--shadow-float)]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-white/65">Sobra prevista no mês</p>
                <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${status === 'bom' ? 'bg-[#a9c2a7] text-[#1d261d]' : status === 'ruim' ? 'bg-[#f3b7ae] text-[#5a1b14]' : 'bg-white/15 text-white'}`}>{statusTexto}</span>
              </div>
              <p className="mt-2 text-[44px] lg:text-[52px] font-bold tracking-[-0.04em] leading-none tabular">{formatCurrency(economia)}</p>
              <div className="mt-6">
                <div className="flex justify-between text-[13px] text-white/65 mb-2">
                  <span>Meta de {metaPercentual}%</span>
                  <span className="tabular">{formatCurrency(Math.max(economia, 0))} de {formatCurrency(meta)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full rounded-full bg-[#a9c2a7]" style={{ width: `${progressoMeta * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Entradas e saídas */}
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              <Tile href="/receitas" label="Entra" value={formatCurrency(totalReceitas)} tone="pos" />
              <Tile href="/gastos" label="Sai" value={formatCurrency(totalGastos)} />
              <Tile href="/gastos" label="Contas fixas" value={formatCurrency(fixosMes)} sub={`${totalReceitas > 0 ? Math.round((fixosMes / totalReceitas) * 100) : 0}% da renda`} />
              <Tile href="/gastos" label="Dia a dia" value={formatCurrency(variaveisMes)} sub={`${totalReceitas > 0 ? Math.round((variaveisMes / totalReceitas) * 100) : 0}% da renda`} />
            </div>
          </div>

          {/* Atalhos */}
          <div className="mt-3 lg:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <Atalho href="/analise" titulo="Onde cortar" texto="Veja o que está pesando e quando seus gastos caem" />
            <Atalho href="/cartoes" titulo="Cartões" texto="Faturas do mês com contas fixas e parcelas" />
            <Atalho href="/investimentos" titulo="Investir a sobra" texto={investidoMes > 0 ? `${formatCurrency(investidoMes)} investidos este mês` : 'Transforme a sobra em patrimônio'} />
          </div>

          <div className="mt-8"><AnaliseMensalSection analiseInicial={analiseMensal} /></div>

          <DashboardCharts
            projecao={projecao}
            evolucao={evolucao}
            composicao={{
              gastosFixos: fixosMes,
              gastosVariaveis: variaveisMes,
              investido: investidoMes,
              saldoLivre: saldoLivreMes,
            }}
          />
        </>
      )}
    </Page>
  )
}

function Tile({ href, label, value, sub, tone }: { href: string; label: string; value: string; sub?: string; tone?: 'pos' }) {
  return (
    <Link href={href} className="bg-surface rounded-[20px] p-4 lg:p-5 shadow-[var(--shadow-card)] flex flex-col justify-between min-h-[104px] active:scale-[0.99] transition">
      <span className="text-[13px] font-medium text-ink-3">{label}</span>
      <span>
        <span className={`block text-[20px] lg:text-[24px] font-semibold tracking-[-0.02em] tabular ${tone === 'pos' ? 'text-positive' : 'text-ink'}`}>{value}</span>
        {sub && <span className="block text-[12px] text-ink-3 mt-0.5">{sub}</span>}
      </span>
    </Link>
  )
}

function Atalho({ href, titulo, texto }: { href: string; titulo: string; texto: string }) {
  return (
    <Link href={href} className="group bg-surface rounded-[20px] p-4 lg:p-5 shadow-[var(--shadow-card)] flex items-center gap-3 active:scale-[0.99] transition">
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-ink">{titulo}</span>
        <span className="block text-[13px] text-ink-3 mt-0.5">{texto}</span>
      </span>
      <ChevronRight size={18} className="text-ink-3 group-hover:text-ink transition-colors" />
    </Link>
  )
}
