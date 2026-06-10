import { createClient } from '@/lib/supabase/server'
import { CardReceita } from '@/components/dashboard/CardReceita'
import { CardGastos } from '@/components/dashboard/CardGastos'
import { CardEconomia } from '@/components/dashboard/CardEconomia'
import { CardStatus } from '@/components/dashboard/CardStatus'
import {
  calcularReceitas,
  calcularGastosFixos,
  calcularGastosVariaveis,
  calcularTotalGastos,
  calcularEconomia,
  calcularMeta,
  calcularStatus,
  getMesReferencia,
  projetarGastosFixosRecorrentes,
} from '@/lib/engine'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const mesRef = getMesReferencia()

  const [{ data: receitas }, { data: fixosDoMes }, { data: fixosRecorrentesAnteriores }, { data: gastosVariaveis }, { data: profile }] =
    await Promise.all([
      supabase.from('receitas').select('*').eq('user_id', user.id).eq('mes_referencia', mesRef),
      supabase.from('gastos_fixos').select('*').eq('user_id', user.id).eq('mes_referencia', mesRef),
      // Gastos fixos recorrentes lançados em meses anteriores, projetados para o mês atual
      // (ver lib/engine: projetarGastosFixosRecorrentes) — sem duplicar registros no banco
      supabase.from('gastos_fixos').select('*').eq('user_id', user.id).eq('recorrente', true).lt('mes_referencia', mesRef),
      supabase.from('gastos_variaveis').select('*').eq('user_id', user.id).eq('mes_referencia', mesRef),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])

  const fixosProjetados = projetarGastosFixosRecorrentes(fixosRecorrentesAnteriores ?? [], mesRef)
  const gastosFixos = [...(fixosDoMes ?? []), ...fixosProjetados]

  const totalReceitas = calcularReceitas(receitas ?? [])
  const totalFixos = calcularGastosFixos(gastosFixos)
  const totalVariaveis = calcularGastosVariaveis(gastosVariaveis ?? [])
  const totalGastos = calcularTotalGastos(totalFixos, totalVariaveis)
  const economia = calcularEconomia(totalReceitas, totalGastos)
  const metaPercentual = profile?.meta_economia_percentual ?? 30
  const meta = calcularMeta(totalReceitas, metaPercentual)
  const status = totalReceitas > 0 ? calcularStatus(economia, meta) : null

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
