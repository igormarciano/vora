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
} from '@/lib/engine'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const mesRef = getMesReferencia()

  const [{ data: receitas }, { data: gastosFixos }, { data: gastosVariaveis }, { data: profile }] =
    await Promise.all([
      supabase.from('receitas').select('*').eq('user_id', user.id).eq('mes_referencia', mesRef),
      supabase.from('gastos_fixos').select('*').eq('user_id', user.id).eq('mes_referencia', mesRef),
      supabase.from('gastos_variaveis').select('*').eq('user_id', user.id).eq('mes_referencia', mesRef),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])

  const totalReceitas = calcularReceitas(receitas ?? [])
  const totalFixos = calcularGastosFixos(gastosFixos ?? [])
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

      {/* Empty state CTA */}
      {totalReceitas === 0 && (
        <div className="mt-8 bg-[#dce6dc] rounded-2xl p-6 flex flex-col gap-3">
          <h2 className="font-fraunces text-[20px] text-[#3c4a3c]">
            Por onde começar?
          </h2>
          <p className="text-[15px] text-[#4f604f] leading-relaxed">
            Adicione sua receita primeiro — ela é a base de tudo. Depois registre seus gastos fixos e a Vora monta sua projeção.
          </p>
          <div className="flex gap-3 mt-2">
            <a
              href="/controle"
              className="font-fraunces text-[15px] px-5 py-2.5 text-center transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#8faf8f', color: '#f9f7f4' }}
            >
              Ir para Controle
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
