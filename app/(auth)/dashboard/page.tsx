import { createClient } from '@/lib/supabase/server'
import { CardReceita } from '@/components/dashboard/CardReceita'
import { CardGastos } from '@/components/dashboard/CardGastos'
import { CardEconomia } from '@/components/dashboard/CardEconomia'
import { CardStatus } from '@/components/dashboard/CardStatus'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { AnaliseMensalSection } from '@/components/dashboard/AnaliseMensalSection'
import {
  calcularGastosFixos,
  calcularGastosVariaveis,
  calcularMeta,
  calcularSaldoLivre,
  getMesReferencia,
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

  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[13px] text-[#6b7280] uppercase tracking-wide mb-1 capitalize">
          {mesAtual}
        </p>
        <h1 className="font-fraunces text-[32px] text-[#3c4a3c] leading-tight">
          Visão geral
        </h1>
        {status === null && (
          <p className="text-[15px] text-[#6b7280] mt-2">
            Adicione suas receitas e gastos para ver seu mês tomar forma.
          </p>
        )}
        {status === 'bom' && (
          <p className="text-[15px] text-[#6b7280] mt-2">
            Você economizou {metaPercentual}% da sua receita este mês. 🎉
          </p>
        )}
        {status === 'atencao' && (
          <p className="text-[15px] text-[#6b7280] mt-2">
            Atenção: seus gastos estão próximos da sua receita.
          </p>
        )}
        {status === 'ruim' && (
          <p className="text-[15px] text-[#6b7280] mt-2">
            Seus gastos superaram a receita este mês.
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CardReceita total={totalReceitas} />
        <CardGastos total={totalGastos} />
        <CardEconomia economia={economia} meta={meta} />
        <CardStatus status={status} />
      </div>

      {/* Análise mensal por IA (Fase 1 do plano de IA) — gerada automaticamente
          pelo job de cron mensal (ver app/api/cron/analise-mensal) ou sob
          demanda pelo próprio usuário (ver app/(auth)/dashboard/actions.ts). */}
      {totalReceitas > 0 && <AnaliseMensalSection analiseInicial={analiseMensal} />}

      {/* Gráficos da Visão Geral (Change Request 001, item 1) — mantêm o foco em
          projeção futura, sem transformar a tela em painel histórico. */}
      {totalReceitas > 0 && (
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
      )}

      {/* Setup invitation card — aparece enquanto o usuário não preencheu nenhuma receita */}
      {totalReceitas === 0 && (
        <div className="mt-8 bg-[#dce6dc] rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#b4c9b4] flex items-center justify-center text-[22px] shrink-0">
              🌿
            </div>
            <div>
              <h2 className="font-fraunces text-[20px] text-[#3c4a3c] leading-tight">
                Monte seu mês em 2 minutos
              </h2>
              <p className="text-[13px] text-[#4f604f]">
                Configuração guiada passo a passo
              </p>
            </div>
          </div>
          <p className="text-[14px] text-[#4f604f] leading-relaxed">
            Me conta sua renda e principais gastos — eu monto a projeção do seu mês e você enxerga quanto vai sobrar.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="/setup"
              className="font-fraunces text-[15px] px-5 py-3 text-center rounded-xl transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#8faf8f', color: '#f9f7f4' }}
            >
              Começar configuração →
            </a>
            <a
              href="/controle"
              className="text-[13px] text-[#6b7280] text-center py-1 hover:text-[#3c4a3c] transition-colors"
            >
              Ou adicionar manualmente no Controle
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
