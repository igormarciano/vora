'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { TrendingDown, TrendingUp, Sparkles, Scale, CalendarClock } from 'lucide-react'
import type { EventoReducao, PontoTimeline } from '@/lib/engine/mes'
import { Page, PageHeader, Panel, Section, StatStrip } from '@/components/layout/Page'
import { formatCurrency, formatarMesAbreviado, formatarMesReferencia } from '@/lib/engine'

export interface Sugestao {
  tipo: 'acima_media' | 'discricionario' | 'peso'
  titulo: string
  descricao: string
  /** Quanto dá pra liberar por mês, quando é possível estimar. */
  economia: number | null
}

interface AnaliseClientProps {
  mes: string
  receitaMes: number
  gastosMes: number
  economia: number
  metaPct: number
  corteNecessario: number
  categorias: { categoria: string; atual: number; media: number | null; pctReceita: number; discricionaria: boolean }[]
  sugestoes: Sugestao[]
  maioresGastos: { nome: string; categoria: string; valor: number; tipo: string }[]
  timeline: PontoTimeline[]
  eventos: EventoReducao[]
}

const ICONE = { acima_media: TrendingUp, discricionario: Sparkles, peso: Scale }

export function AnaliseClient(props: AnaliseClientProps) {
  const { mes, receitaMes, gastosMes, economia, metaPct, corteNecessario, categorias, sugestoes, maioresGastos, timeline, eventos } = props
  const maxCategoria = Math.max(...categorias.map(c => Math.max(c.atual, c.media ?? 0)), 1)

  return (
    <Page>
      <PageHeader
        eyebrow={formatarMesReferencia(mes)}
        title="Onde cortar"
        description="O que está pesando no seu mês, o que fugiu do seu padrão e quando seus compromissos começam a diminuir."
      />

      <div className="mb-8">
        <StatStrip
          items={[
            { label: 'Receita do mês', value: formatCurrency(receitaMes) },
            { label: 'Gastos do mês', value: formatCurrency(gastosMes) },
            { label: 'Sobra', value: formatCurrency(economia), tone: economia < 0 ? 'neg' : 'pos' },
            corteNecessario > 0
              ? { label: `Falta p/ meta de ${metaPct}%`, value: formatCurrency(corteNecessario), tone: 'neg' }
              : { label: `Meta de ${metaPct}%`, value: 'Batida', tone: 'pos' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
        {/* Sugestões */}
        <Section
          className="lg:col-span-3"
          title="O que dá pra cortar"
          description={corteNecessario > 0
            ? `Para bater a meta você precisa liberar ${formatCurrency(corteNecessario)} por mês. Comece por aqui:`
            : 'Você já está na meta. Ainda assim, estes pontos merecem atenção:'}
        >
          {sugestoes.length === 0 ? (
            <Panel className="px-5 py-8 text-center text-[14px] text-[#9ca3af]">
              Nada fora do padrão neste mês. Continue registrando seus gastos para a análise ficar mais precisa.
            </Panel>
          ) : (
            <div className="flex flex-col gap-3">
              {sugestoes.map((s, i) => {
                const Icon = ICONE[s.tipo]
                return (
                  <Panel key={i} className="px-5 py-4 flex gap-4 items-start">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.tipo === 'acima_media' ? 'bg-[#fdecea] text-[#dc2626]' : 'bg-[#dce6dc] text-[#3c4a3c]'}`}>
                      <Icon size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium text-[#3c4a3c]">{s.titulo}</p>
                      <p className="text-[13px] text-[#6b7280] mt-0.5">{s.descricao}</p>
                    </div>
                    {s.economia != null && s.economia > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-[#9ca3af] uppercase tracking-wide">Libera até</p>
                        <p className="text-[15px] font-medium text-[#16a34a]">{formatCurrency(s.economia)}</p>
                      </div>
                    )}
                  </Panel>
                )
              })}
            </div>
          )}
        </Section>

        {/* Maiores gastos */}
        <Section className="lg:col-span-2" title="Maiores gastos do mês" description="Os itens que mais pesam, individualmente.">
          <Panel className="px-5">
            {maioresGastos.length === 0 ? (
              <p className="text-[14px] text-[#9ca3af] py-8 text-center">Sem gastos neste mês.</p>
            ) : maioresGastos.map((g, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-[#f2ede7] last:border-0">
                <span className="w-5 text-[12px] text-[#9ca3af]">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#3c4a3c] truncate">{g.nome}</p>
                  <p className="text-[12px] text-[#9ca3af] truncate">{g.categoria} · {g.tipo}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-medium text-[#3c4a3c]">{formatCurrency(g.valor)}</p>
                  {receitaMes > 0 && <p className="text-[11px] text-[#9ca3af]">{Math.round((g.valor / receitaMes) * 100)}% da renda</p>}
                </div>
              </div>
            ))}
          </Panel>
        </Section>
      </div>

      {/* Categorias vs média */}
      {categorias.length > 0 && (
        <Section
          className="mb-10"
          title="Categorias vs. sua média"
          description="Barra cheia é este mês; o traço marca a média dos últimos 3 meses com dados."
        >
          <Panel className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
            {categorias.map(c => {
              const acima = c.media != null && c.atual > c.media * 1.2
              return (
                <div key={c.categoria}>
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <span className="text-[13px] font-medium text-[#3c4a3c] truncate">
                      {c.categoria}
                      {c.discricionaria && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[#f2ede7] text-[#6b7280] font-normal">escolha</span>}
                    </span>
                    <span className="text-[13px] text-[#3c4a3c] shrink-0">
                      {formatCurrency(c.atual)}
                      {c.media != null && <span className="text-[#9ca3af]"> · média {formatCurrency(c.media)}</span>}
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-[#f2ede7]">
                    <div className="h-full rounded-full" style={{ width: `${(c.atual / maxCategoria) * 100}%`, backgroundColor: acima ? '#dc2626' : '#8faf8f' }} />
                    {c.media != null && (
                      <div className="absolute -top-1 w-0.5 h-4 bg-[#3c4a3c]" style={{ left: `calc(${(c.media / maxCategoria) * 100}% - 1px)` }} />
                    )}
                  </div>
                </div>
              )
            })}
          </Panel>
        </Section>
      )}

      {/* Timeline */}
      <Section
        title="Quando seus gastos começam a cair"
        description="Compromissos já assumidos nos próximos 12 meses: parcelas, contas com prazo e recorrências."
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Panel className="lg:col-span-3 p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={timeline.map(p => ({
                  mes: formatarMesAbreviado(p.mes),
                  Parcelas: p.parcelas,
                  'Fixos com prazo': p.fixosComPrazo,
                  'Fixos recorrentes': p.fixosRecorrentes,
                }))}
                margin={{ top: 5, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ece4db" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#ece4db' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => formatCurrency(v).replace('R$', '').replace(/,\d{2}$/, '').trim()}
                  width={56}
                />
                <Tooltip
                  formatter={(value: ValueType | undefined) => formatCurrency(Number(Array.isArray(value) ? value[0] : (value ?? 0)))}
                  contentStyle={{ borderRadius: 12, borderColor: '#ece4db', fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Fixos recorrentes" stackId="a" fill="#d7cfc7" />
                <Bar dataKey="Fixos com prazo" stackId="a" fill="#a5bfa5" />
                <Bar dataKey="Parcelas" stackId="a" fill="#38a3a5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel className="lg:col-span-2 px-5 py-2">
            {eventos.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarClock size={24} className="mx-auto text-[#a5bfa5] mb-2" />
                <p className="text-[14px] text-[#9ca3af]">Nenhuma parcela ou conta com prazo termina nos próximos 12 meses.</p>
              </div>
            ) : (
              <ol className="relative">
                {agruparPorMes(eventos).map(([m, evs]) => (
                  <li key={m} className="py-3 border-b border-[#f2ede7] last:border-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-2 text-[13px] font-medium text-[#3c4a3c] capitalize">
                        <TrendingDown size={15} className="text-[#16a34a]" /> A partir de {formatarMesReferencia(m)}
                      </span>
                      <span className="text-[13px] font-medium text-[#16a34a]">
                        −{formatCurrency(evs.reduce((s, e) => s + e.valor, 0))}/mês
                      </span>
                    </div>
                    {evs.map((e, i) => (
                      <p key={i} className="text-[12px] text-[#6b7280] pl-6 flex justify-between gap-2">
                        <span className="truncate">{e.nome} <span className="text-[#9ca3af]">({e.tipo === 'parcela' ? e.detalhe : `conta fixa, ${e.detalhe}`})</span></span>
                        <span className="shrink-0">{formatCurrency(e.valor)}</span>
                      </p>
                    ))}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </Section>
    </Page>
  )
}

function agruparPorMes(eventos: EventoReducao[]): [string, EventoReducao[]][] {
  const map = new Map<string, EventoReducao[]>()
  for (const e of eventos) {
    if (!map.has(e.mes)) map.set(e.mes, [])
    map.get(e.mes)!.push(e)
  }
  return Array.from(map.entries())
}
