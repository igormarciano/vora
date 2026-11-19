'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, Check, Sparkles, CreditCard, Wallet, Home, Car, Tv, HeartPulse, ShoppingBasket, Target } from 'lucide-react'
import { NumericFormat } from 'react-number-format'
import { salvarOnboarding, marcarSetupCompleto } from '@/app/setup/actions'
import { formatCurrency } from '@/lib/engine'
import { cn } from '@/lib/utils'
import { BrandMark, Button, OptionCard, Progress, Segmented } from '@/components/vora/ui'
import {
  ASSINATURAS, BANCOS, CONTAS_CASA, ESTILOS, FAMILIA, PRE_MARCADOS, RESPOSTAS_INICIAIS, TIPOS_MORADIA, TIPOS_RENDA, TRANSPORTES,
  montarMes, sugerirDiaADia, type ItemCatalogo, type RespostasOnboarding, type Selecao,
} from '@/lib/onboarding'

type Passo = 'inicio' | 'renda' | 'moradia' | 'casa' | 'transporte' | 'assinaturas' | 'familia' | 'cartoes' | 'diaadia' | 'meta' | 'resumo'
const PASSOS: Passo[] = ['inicio', 'renda', 'moradia', 'casa', 'transporte', 'assinaturas', 'familia', 'cartoes', 'diaadia', 'meta', 'resumo']
const DRAFT_KEY = 'vora_onboarding_v2'

export function Onboarding({ nome }: { nome: string | null }) {
  const router = useRouter()
  const [passo, setPasso] = useState<Passo>('inicio')
  const [r, setR] = useState<RespostasOnboarding>(RESPOSTAS_INICIAIS)
  const [hidratado, setHidratado] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Rascunho local: se fechar a aba no meio, continua de onde parou.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        if (d?.r) setR({ ...RESPOSTAS_INICIAIS, ...d.r })
        if (d?.passo && PASSOS.includes(d.passo)) setPasso(d.passo)
      }
    } catch {}
    setHidratado(true)
  }, [])
  useEffect(() => {
    if (!hidratado) return
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ r, passo })) } catch {}
  }, [r, passo, hidratado])

  const mes = useMemo(() => montarMes(r), [r])
  const idx = PASSOS.indexOf(passo)
  const set = (patch: Partial<RespostasOnboarding>) => setR(prev => ({ ...prev, ...patch }))

  const podeAvancar =
    passo === 'renda' ? r.tipoRenda != null && r.renda > 0
    : passo === 'moradia' ? r.moradia != null
    : passo === 'diaadia' ? r.estilo != null
    : true

  function avancar() {
    if (passo === 'diaadia' && !r.estilo) return
    // Ao chegar no dia a dia, sugere valores com base na renda (só na primeira vez).
    const prox = PASSOS[idx + 1]
    if (prox === 'diaadia' && !r.estilo) {
      set({ estilo: 'equilibrado', diaADia: sugerirDiaADia(r.renda, 'equilibrado') })
    }
    const pre = PRE_MARCADOS[prox]
    if (pre && !r.vistos.includes(prox)) {
      const atual = r[pre.campo]
      const marcado = Object.fromEntries(Object.entries(atual).map(([id, sel]) => [id, pre.ids.includes(id) ? { ...sel, on: true } : sel]))
      set({ [pre.campo]: marcado, vistos: [...r.vistos, prox] } as Partial<RespostasOnboarding>)
    }
    setPasso(prox)
    window.scrollTo({ top: 0 })
  }
  function voltar() {
    if (idx > 0) setPasso(PASSOS[idx - 1])
  }

  async function concluir() {
    setSalvando(true)
    const res = await salvarOnboarding(r)
    if (res.error) {
      setSalvando(false)
      toast.error(res.error)
      return
    }
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    router.push('/dashboard')
    router.refresh()
  }

  async function explorarSozinho() {
    setSalvando(true)
    await marcarSetupCompleto()
    router.push('/dashboard')
    router.refresh()
  }

  if (!hidratado) return <div className="min-h-dvh bg-canvas" />

  if (passo === 'inicio') {
    return <Boasvindas nome={nome} onComecar={() => setPasso('renda')} onExplorar={explorarSozinho} carregando={salvando} />
  }

  const ctaLabel = passo === 'resumo' ? 'Criar meu mês' : passo === 'meta' ? 'Ver meu mês' : 'Continuar'
  const progresso = idx / (PASSOS.length - 1)

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Barra superior */}
      <header className="glass sticky top-0 z-30 border-b border-hairline pt-safe">
        <div className="max-w-[1200px] mx-auto h-14 lg:h-16 px-3 lg:px-8 flex items-center gap-3">
          <button onClick={voltar} className="w-10 h-10 rounded-full flex items-center justify-center text-brand hover:bg-fill" aria-label="Voltar">
            <ChevronLeft size={24} />
          </button>
          <div className="hidden lg:block"><BrandMark size={22} /></div>
          <Progress value={progresso} className="flex-1 lg:max-w-[360px] lg:mx-auto" />
          <span className="text-[13px] font-medium text-ink-3 tabular w-10 text-right">{idx}/{PASSOS.length - 1}</span>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto lg:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 xl:gap-16">
        {/* Pergunta */}
        <main className="px-5 pt-6 pb-40 lg:pb-16 lg:pt-12 max-w-[600px] w-full lg:mx-auto">
          <div key={passo} className="animate-rise">
            {passo === 'renda' && <PassoRenda r={r} set={set} />}
            {passo === 'moradia' && <PassoMoradia r={r} set={set} />}
            {passo === 'casa' && <PassoLista titulo="Quais contas chegam todo mês?" sub="Já deixamos as mais comuns marcadas. Ajuste os valores para perto do que você paga." itens={CONTAS_CASA} sel={r.contas} onChange={contas => set({ contas })} icon={<Home size={22} />} />}
            {passo === 'transporte' && <PassoTransporte r={r} set={set} />}
            {passo === 'assinaturas' && <PassoLista titulo="Quais assinaturas você tem?" sub="Valores aproximados dos planos mais comuns. Toque no valor para ajustar." itens={ASSINATURAS} sel={r.assinaturas} onChange={assinaturas => set({ assinaturas })} grid icon={<Tv size={22} />} />}
            {passo === 'familia' && <PassoLista titulo="Saúde, estudo e família" sub="Marque o que faz parte do seu mês." itens={FAMILIA} sel={r.familia} onChange={familia => set({ familia })} icon={<HeartPulse size={22} />} />}
            {passo === 'cartoes' && <PassoCartoes r={r} set={set} temAssinaturas={Object.values(r.assinaturas).some(a => a.on)} />}
            {passo === 'diaadia' && <PassoDiaADia r={r} set={set} />}
            {passo === 'meta' && <PassoMeta r={r} set={set} sobra={mes.sobra} />}
            {passo === 'resumo' && <PassoResumo mes={mes} meta={r.meta} irPara={setPasso} />}
          </div>

          {/* CTA desktop */}
          <div className="hidden lg:flex items-center gap-3 mt-10">
            <Button size="lg" onClick={passo === 'resumo' ? concluir : avancar} disabled={!podeAvancar} loading={salvando} className="min-w-[200px]">{ctaLabel}</Button>
            {['casa', 'transporte', 'assinaturas', 'familia', 'cartoes'].includes(passo) && (
              <Button variant="plain" onClick={avancar}>Pular</Button>
            )}
          </div>
        </main>

        {/* Prévia ao vivo (desktop) */}
        <aside className="hidden lg:block pt-12">
          <div className="sticky top-28"><Previa mes={mes} meta={r.meta} /></div>
        </aside>
      </div>

      {/* CTA mobile fixo */}
      <div className="lg:hidden glass fixed bottom-0 inset-x-0 z-30 border-t border-hairline px-5 pt-3 pb-[max(env(safe-area-inset-bottom),14px)]">
        {passo !== 'resumo' && mes.totalReceitas > 0 && (
          <div className="flex items-center justify-between text-[13px] mb-2.5">
            <span className="text-ink-3">Sobra prevista</span>
            <span className={cn('font-semibold tabular', mes.sobra >= 0 ? 'text-positive' : 'text-negative')}>{formatCurrency(mes.sobra)}</span>
          </div>
        )}
        <Button size="lg" block onClick={passo === 'resumo' ? concluir : avancar} disabled={!podeAvancar} loading={salvando}>{ctaLabel}</Button>
      </div>
    </div>
  )
}

// ── Boas-vindas ────────────────────────────────────────────────────────────────

function Boasvindas({ nome, onComecar, onExplorar, carregando }: { nome: string | null; onComecar: () => void; onExplorar: () => void; carregando: boolean }) {
  const passos = [
    { icon: <Wallet size={18} />, t: 'Como você recebe' },
    { icon: <Home size={18} />, t: 'Casa, contas e transporte' },
    { icon: <Tv size={18} />, t: 'Assinaturas e cartões' },
    { icon: <Target size={18} />, t: 'Dia a dia e meta de economia' },
  ]
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#e6eee4_0%,#f5f4f0_55%)] flex flex-col">
      <div className="max-w-[1100px] w-full mx-auto px-6 lg:px-12 pt-[max(env(safe-area-inset-top),24px)] lg:pt-10"><BrandMark size={26} /></div>
      <div className="flex-1 max-w-[1100px] w-full mx-auto px-6 lg:px-12 flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-20 py-10">
        <div className="flex-1 animate-rise">
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/70 text-[12px] font-semibold text-brand-strong"><Sparkles size={13} /> Leva uns 3 minutos</span>
          <h1 className="mt-5 text-[38px] lg:text-[56px] font-bold tracking-[-0.03em] leading-[1.02] text-ink">
            {nome ? <>Oi, {nome.split(' ')[0]}.<br /></> : null}Vamos montar<br />o seu mês.
          </h1>
          <p className="mt-5 text-[17px] text-ink-2 leading-relaxed max-w-[460px]">
            Responda algumas perguntas rápidas e a Vora já cria suas receitas, contas fixas, assinaturas e cartões. Você chega no painel com tudo pronto e só ajusta o que quiser.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-[460px]">
            <Button size="lg" onClick={onComecar} className="sm:min-w-[220px]">Montar meu mês</Button>
            <Button size="lg" variant="ghost" onClick={onExplorar} loading={carregando}>Explorar sozinho</Button>
          </div>
        </div>
        <div className="lg:w-[400px] animate-rise [animation-delay:120ms]">
          <div className="bg-white/80 backdrop-blur-xl rounded-[24px] p-2 shadow-[var(--shadow-float)]">
            {passos.map((p, i) => (
              <div key={p.t} className="flex items-center gap-3.5 px-4 py-3.5">
                <span className="w-9 h-9 rounded-[11px] bg-brand-soft text-brand-strong flex items-center justify-center">{p.icon}</span>
                <span className="flex-1 text-[15px] font-medium text-ink">{p.t}</span>
                <span className="text-[12px] text-ink-3 tabular">{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 px-2 text-[13px] text-ink-3">Nada é definitivo. Tudo que for criado aqui você edita ou apaga depois.</p>
        </div>
      </div>
    </div>
  )
}

// ── Peças comuns ───────────────────────────────────────────────────────────────

function Titulo({ icon, titulo, sub }: { icon?: React.ReactNode; titulo: string; sub?: string }) {
  return (
    <div className="mb-7">
      {icon && <span className="w-12 h-12 rounded-[15px] bg-brand-soft text-brand-strong flex items-center justify-center mb-4">{icon}</span>}
      <h1 className="text-[28px] lg:text-[34px] font-bold tracking-[-0.025em] leading-[1.1] text-ink">{titulo}</h1>
      {sub && <p className="mt-2.5 text-[15px] lg:text-[16px] text-ink-2 leading-relaxed">{sub}</p>}
    </div>
  )
}

function Dinheiro({ value, onChange, grande, className, autoFocus }: { value: number; onChange: (v: number) => void; grande?: boolean; className?: string; autoFocus?: boolean }) {
  return (
    <NumericFormat
      value={value || ''}
      onValueChange={v => onChange(v.floatValue ?? 0)}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      prefix="R$ "
      allowNegative={false}
      inputMode="decimal"
      placeholder="R$ 0"
      autoFocus={autoFocus}
      className={cn(
        'tabular bg-white border border-hairline outline-none focus:border-brand focus:shadow-[0_0_0_4px_rgb(95_138_98/0.14)] transition text-ink',
        grande ? 'w-full h-16 rounded-[18px] px-5 text-[28px] font-semibold tracking-[-0.02em]' : 'w-[118px] h-10 rounded-[12px] px-3 text-[15px] font-medium text-right',
        className,
      )}
    />
  )
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className={cn('relative w-[51px] h-[31px] rounded-full transition-colors shrink-0', on ? 'bg-brand' : 'bg-[#e1e4df]')}>
      <span className={cn('absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.18)] transition-transform', on && 'translate-x-5')} />
    </button>
  )
}

// ── Passos ─────────────────────────────────────────────────────────────────────

type PassoProps = { r: RespostasOnboarding; set: (p: Partial<RespostasOnboarding>) => void }

function PassoRenda({ r, set }: PassoProps) {
  return (
    <>
      <Titulo icon={<Wallet size={22} />} titulo="Como você recebe?" sub="Use o valor que cai na conta, já com descontos." />
      <div className="grid sm:grid-cols-2 gap-2.5 mb-7">
        {TIPOS_RENDA.map(t => (
          <OptionCard key={t.id} icon={t.icon} title={t.titulo} description={t.descricao} selected={r.tipoRenda === t.id} onClick={() => set({ tipoRenda: t.id })} />
        ))}
      </div>
      <p className="text-[13px] font-medium text-ink-2 mb-2">Quanto entra por mês?</p>
      <Dinheiro grande value={r.renda} onChange={renda => set({ renda })} />
      {r.tipoRenda === 'autonomo' && <p className="mt-2 text-[13px] text-ink-3">Se varia, use uma média dos últimos 3 meses.</p>}

      <div className="mt-6 bg-surface rounded-[18px] shadow-[var(--shadow-card)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-ink">Tenho uma renda extra fixa</p>
            <p className="text-[13px] text-ink-3">Freela recorrente, aluguel que recebe, pensão...</p>
          </div>
          <Switch on={r.temExtra} onClick={() => set({ temExtra: !r.temExtra })} />
        </div>
        {r.temExtra && <div className="mt-3"><Dinheiro grande value={r.extra} onChange={extra => set({ extra })} className="h-14 text-[22px]" /></div>}
      </div>
    </>
  )
}

function PassoMoradia({ r, set }: PassoProps) {
  const atual = TIPOS_MORADIA.find(t => t.id === r.moradia)
  return (
    <>
      <Titulo icon={<Home size={22} />} titulo="E onde você mora?" sub="Moradia costuma ser o maior gasto do mês." />
      <div className="grid sm:grid-cols-2 gap-2.5">
        {TIPOS_MORADIA.map(t => (
          <OptionCard key={t.id} icon={t.icon} title={t.titulo} description={t.descricao} selected={r.moradia === t.id}
            onClick={() => set({ moradia: t.id, moradiaValor: r.moradia === t.id ? r.moradiaValor : t.sugestao })} />
        ))}
      </div>
      {atual && atual.id !== 'propria' && (
        <div className="mt-7 flex flex-col gap-5 animate-rise">
          <div>
            <p className="text-[13px] font-medium text-ink-2 mb-2">{atual.id === 'aluguel' ? 'Valor do aluguel' : atual.id === 'financiamento' ? 'Parcela do financiamento' : 'Quanto você ajuda em casa'}</p>
            <Dinheiro grande value={r.moradiaValor} onChange={moradiaValor => set({ moradiaValor })} />
          </div>
          {atual.id !== 'familia' && (
            <div>
              <p className="text-[13px] font-medium text-ink-2 mb-2">Condomínio <span className="text-ink-3 font-normal">(se tiver)</span></p>
              <Dinheiro grande value={r.condominio} onChange={condominio => set({ condominio })} className="h-14 text-[22px]" />
            </div>
          )}
        </div>
      )}
    </>
  )
}

function PassoLista({ titulo, sub, itens, sel, onChange, grid, icon }: {
  titulo: string; sub: string; itens: ItemCatalogo[]; sel: Record<string, Selecao>
  onChange: (s: Record<string, Selecao>) => void; grid?: boolean; icon?: React.ReactNode
}) {
  const toggle = (id: string) => onChange({ ...sel, [id]: { ...sel[id], on: !sel[id].on } })
  const valor = (id: string, v: number) => onChange({ ...sel, [id]: { on: true, valor: v } })
  const total = itens.reduce((s, i) => s + (sel[i.id]?.on ? sel[i.id].valor : 0), 0)

  return (
    <>
      <Titulo icon={icon} titulo={titulo} sub={sub} />
      <div className={cn(grid ? 'grid grid-cols-2 sm:grid-cols-3 gap-2.5' : 'bg-surface rounded-[20px] shadow-[var(--shadow-card)] divide-y divide-[rgb(60_74_60/0.08)] overflow-hidden')}>
        {itens.map(i => {
          const s = sel[i.id]
          if (grid) {
            // Card em grade: ícone e check em cima, nome inteiro, valor embaixo
            return (
              <div key={i.id} className={cn('flex flex-col gap-2.5 p-3.5 rounded-[18px] bg-white border transition-all',
                s.on ? 'border-brand shadow-[0_0_0_3px_rgb(95_138_98/0.14)]' : 'border-hairline')}>
                <button type="button" onClick={() => toggle(i.id)} className="flex items-start justify-between text-left">
                  <span className={cn('w-10 h-10 rounded-[12px] flex items-center justify-center text-[20px] transition-colors', s.on ? 'bg-brand-soft' : 'bg-sand')}>{i.icon}</span>
                  <span className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center', s.on ? 'bg-brand border-brand text-white' : 'border-[#d5d9d3]')}>
                    {s.on && <Check size={14} strokeWidth={3} />}
                  </span>
                </button>
                <button type="button" onClick={() => toggle(i.id)} className={cn('text-left text-[15px] font-semibold leading-tight', s.on ? 'text-ink' : 'text-ink-2')}>{i.nome}</button>
                {s.on
                  ? <Dinheiro value={s.valor} onChange={v => valor(i.id, v)} className="w-full text-left h-9" />
                  : <button type="button" onClick={() => toggle(i.id)} className="text-left text-[14px] text-ink-3 tabular h-9">{formatCurrency(i.valor)}/mês</button>}
              </div>
            )
          }
          return (
            <div
              key={i.id}
              className={cn(
                'flex items-center gap-3 p-3.5 pl-4 transition-colors',
                grid && 'rounded-[18px] bg-white border',
                grid && (s.on ? 'border-brand shadow-[0_0_0_3px_rgb(95_138_98/0.14)]' : 'border-hairline'),
              )}
            >
              <button type="button" onClick={() => toggle(i.id)} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                <span className={cn('w-10 h-10 rounded-[12px] flex items-center justify-center text-[20px] shrink-0 transition-colors', s.on ? 'bg-brand-soft' : 'bg-sand')}>{i.icon}</span>
                <span className={cn('text-[15px] font-medium truncate', s.on ? 'text-ink' : 'text-ink-2')}>{i.nome}</span>
              </button>
              {s.on ? (
                <Dinheiro value={s.valor} onChange={v => valor(i.id, v)} className={grid ? 'w-[104px]' : ''} />
              ) : (
                <span className="text-[14px] text-ink-3 tabular">{formatCurrency(i.valor)}</span>
              )}
              {!grid && <Switch on={s.on} onClick={() => toggle(i.id)} />}
              {grid && (
                <button type="button" onClick={() => toggle(i.id)} aria-label={s.on ? 'Remover' : 'Adicionar'}
                  className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0', s.on ? 'bg-brand border-brand text-white' : 'border-[#d5d9d3]')}>
                  {s.on && <Check size={14} strokeWidth={3} />}
                </button>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-4 px-1 text-[14px] text-ink-2">Total marcado: <strong className="text-ink tabular">{formatCurrency(total)}</strong> por mês</p>
    </>
  )
}

function PassoTransporte({ r, set }: PassoProps) {
  const toggleModo = (id: string) => set({ transportes: r.transportes.includes(id) ? r.transportes.filter(t => t !== id) : [...r.transportes, id] })
  const ativos = TRANSPORTES.filter(t => r.transportes.includes(t.id))
  return (
    <>
      <Titulo icon={<Car size={22} />} titulo="Como você se locomove?" sub="Pode marcar mais de um." />
      <div className="grid grid-cols-2 gap-2.5">
        {TRANSPORTES.map(t => {
          const on = r.transportes.includes(t.id)
          return (
            <button key={t.id} type="button" onClick={() => toggleModo(t.id)}
              className={cn('flex flex-col items-start gap-3 p-4 rounded-[18px] bg-white border text-left transition-all active:scale-[0.98]',
                on ? 'border-brand shadow-[0_0_0_3px_rgb(95_138_98/0.14)]' : 'border-hairline')}>
              <span className="text-[28px]">{t.icon}</span>
              <span className="text-[15px] font-semibold text-ink">{t.titulo}</span>
            </button>
          )
        })}
      </div>
      {ativos.length > 0 && (
        <div className="mt-7 animate-rise">
          <p className="px-1 mb-2 text-[13px] font-medium text-ink-2">Quanto vai nisso por mês?</p>
          <div className="bg-surface rounded-[20px] shadow-[var(--shadow-card)] divide-y divide-[rgb(60_74_60/0.08)] overflow-hidden">
            {ativos.flatMap(t => t.itens).map(i => {
              const s = r.transporteItens[i.id]
              return (
                <div key={i.id} className="flex items-center gap-3 p-3.5 pl-4">
                  <span className="text-[20px] w-8 text-center">{i.icon}</span>
                  <span className={cn('flex-1 text-[15px] font-medium', s.on ? 'text-ink' : 'text-ink-3')}>{i.nome}</span>
                  {s.on && <Dinheiro value={s.valor} onChange={v => set({ transporteItens: { ...r.transporteItens, [i.id]: { on: true, valor: v } } })} />}
                  <Switch on={s.on} onClick={() => set({ transporteItens: { ...r.transporteItens, [i.id]: { ...s, on: !s.on } } })} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

function PassoCartoes({ r, set, temAssinaturas }: PassoProps & { temAssinaturas: boolean }) {
  function toggle(id: string) {
    const bancos = r.bancos.includes(id) ? r.bancos.filter(b => b !== id) : [...r.bancos, id]
    const bancoPrincipal = bancos.includes(r.bancoPrincipal ?? '') ? r.bancoPrincipal : bancos[0] ?? null
    set({ bancos, bancoPrincipal })
  }
  return (
    <>
      <Titulo icon={<CreditCard size={22} />} titulo="Quais cartões de crédito você usa?" sub="Criamos um cartão para cada um. Depois você vê a fatura de cada um na aba Cartões." />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {BANCOS.map(b => {
          const on = r.bancos.includes(b.id)
          return (
            <button key={b.id} type="button" onClick={() => toggle(b.id)}
              className={cn('relative h-[88px] rounded-[16px] p-3 text-left flex flex-col justify-between overflow-hidden transition-all active:scale-[0.97]',
                on ? 'ring-[3px] ring-offset-2 ring-offset-canvas' : 'opacity-90 hover:opacity-100')}
              style={{ background: `linear-gradient(135deg, ${b.cor}, ${b.cor}cc)`, ['--tw-ring-color' as string]: b.cor }}>
              <span className="w-7 h-5 rounded-[4px] bg-white/35" />
              <span className="text-[14px] font-semibold text-white drop-shadow-sm">{b.nome}</span>
              {on && <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white text-ink flex items-center justify-center"><Check size={14} strokeWidth={3} /></span>}
            </button>
          )
        })}
      </div>

      {r.bancos.length > 1 && (
        <div className="mt-7 animate-rise">
          <p className="px-1 mb-2 text-[13px] font-medium text-ink-2">Qual você mais usa?</p>
          <div className="flex flex-wrap gap-2">
            {r.bancos.map(id => {
              const b = BANCOS.find(x => x.id === id)!
              const on = r.bancoPrincipal === id
              return (
                <button key={id} type="button" onClick={() => set({ bancoPrincipal: id })}
                  className={cn('h-10 px-4 rounded-full border text-[14px] font-medium inline-flex items-center gap-2', on ? 'bg-brand-strong border-brand-strong text-white' : 'bg-white border-hairline text-ink')}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: b.cor }} />{b.nome}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {r.bancos.length > 0 && temAssinaturas && (
        <div className="mt-6 bg-surface rounded-[18px] shadow-[var(--shadow-card)] p-4 flex items-center gap-3 animate-rise">
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-ink">Assinaturas no {BANCOS.find(b => b.id === r.bancoPrincipal)?.nome}</p>
            <p className="text-[13px] text-ink-3">Elas já entram na fatura desse cartão.</p>
          </div>
          <Switch on={r.assinaturasNoCartao} onClick={() => set({ assinaturasNoCartao: !r.assinaturasNoCartao })} />
        </div>
      )}
    </>
  )
}

function PassoDiaADia({ r, set }: PassoProps) {
  const linhas: { k: keyof RespostasOnboarding['diaADia']; nome: string; icon: string }[] = [
    { k: 'mercado', nome: 'Mercado', icon: '🛒' },
    { k: 'restaurante', nome: 'Restaurantes e delivery', icon: '🍕' },
    { k: 'lazer', nome: 'Lazer e saídas', icon: '🎭' },
    { k: 'compras', nome: 'Compras e roupas', icon: '🛍️' },
  ]
  return (
    <>
      <Titulo icon={<ShoppingBasket size={22} />} titulo="Como é seu dia a dia?" sub="Escolha o estilo mais parecido com o seu. Sugerimos valores pela sua renda, e você ajusta." />
      <div className="flex flex-col gap-2.5">
        {ESTILOS.map(e => (
          <OptionCard key={e.id} icon={e.icon} title={e.titulo} description={e.descricao} selected={r.estilo === e.id}
            onClick={() => set({ estilo: e.id, diaADia: sugerirDiaADia(r.renda, e.id) })} />
        ))}
      </div>
      {r.estilo && (
        <div className="mt-7 bg-surface rounded-[20px] shadow-[var(--shadow-card)] divide-y divide-[rgb(60_74_60/0.08)] overflow-hidden animate-rise">
          {linhas.map(l => (
            <div key={l.k} className="flex items-center gap-3 p-3.5 pl-4">
              <span className="text-[20px] w-8 text-center">{l.icon}</span>
              <span className="flex-1 text-[15px] font-medium text-ink">{l.nome}</span>
              <Dinheiro value={r.diaADia[l.k]} onChange={v => set({ diaADia: { ...r.diaADia, [l.k]: v } })} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function PassoMeta({ r, set, sobra }: PassoProps & { sobra: number }) {
  const metaValor = r.renda * (r.meta / 100)
  const ok = sobra >= metaValor
  return (
    <>
      <Titulo icon={<Target size={22} />} titulo="Quanto você quer guardar por mês?" sub="A Vora acompanha essa meta e avisa quando o mês sai do trilho." />
      <div className="bg-surface rounded-[22px] shadow-[var(--shadow-card)] p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-[56px] font-bold tracking-[-0.04em] leading-none text-ink tabular">{r.meta}%</span>
          <span className="text-[18px] font-semibold text-brand-strong tabular">{formatCurrency(metaValor)}<span className="text-[13px] font-normal text-ink-3">/mês</span></span>
        </div>
        <input type="range" min={5} max={50} step={1} value={r.meta} onChange={e => set({ meta: Number(e.target.value) })}
          className="w-full mt-6 accent-[#5f8a62] h-2" aria-label="Meta de economia" />
        <div className="mt-4">
          <Segmented size="sm" value={String(r.meta)} onChange={v => set({ meta: Number(v) })} className="w-full"
            options={[10, 15, 20, 30].map(v => ({ value: String(v), label: `${v}%` }))} />
        </div>
      </div>
      <div className={cn('mt-4 rounded-[18px] p-4 text-[14px] leading-relaxed', ok ? 'bg-brand-soft text-brand-strong' : 'bg-[#fbf1e3] text-[#8a5a12]')}>
        {ok
          ? <>Com o que você contou, sobram <strong>{formatCurrency(sobra)}</strong>. Dá pra bater essa meta.</>
          : <>Hoje a sobra prevista é <strong>{formatCurrency(sobra)}</strong>. Faltam <strong>{formatCurrency(metaValor - sobra)}</strong> pra meta; a aba Onde cortar vai te mostrar caminhos.</>}
      </div>
    </>
  )
}

function PassoResumo({ mes, meta, irPara }: { mes: ReturnType<typeof montarMes>; meta: number; irPara: (p: Passo) => void }) {
  return (
    <>
      <Titulo titulo="Seu mês está pronto" sub="Confira o que vamos criar. Tudo pode ser editado depois." />
      <div className="lg:hidden mb-6"><Previa mes={mes} meta={meta} compacta /></div>
      <div className="flex flex-col gap-5">
        <BlocoResumo titulo="Receitas" itens={mes.receitas.map(x => ({ nome: x.nome, valor: x.valor, icon: '💰' }))} onEditar={() => irPara('renda')} />
        <BlocoResumo titulo="Contas fixas" itens={mes.fixos} onEditar={() => irPara('moradia')} />
        <BlocoResumo titulo="Estimativas do dia a dia" itens={mes.variaveis} onEditar={() => irPara('diaadia')} />
        {mes.cartoes.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-3">Cartões</h3>
              <button onClick={() => irPara('cartoes')} className="text-[14px] font-medium text-brand">Editar</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {mes.cartoes.map(c => (
                <span key={c.bancoId} className="h-9 px-3.5 rounded-full text-[13px] font-semibold text-white inline-flex items-center" style={{ background: c.cor }}>{c.nome}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function BlocoResumo({ titulo, itens, onEditar }: { titulo: string; itens: { nome: string; valor: number; icon: string }[]; onEditar: () => void }) {
  if (itens.length === 0) return null
  const total = itens.reduce((s, i) => s + i.valor, 0)
  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-3">{titulo} · <span className="tabular">{formatCurrency(total)}</span></h3>
        <button onClick={onEditar} className="text-[14px] font-medium text-brand">Editar</button>
      </div>
      <div className="bg-surface rounded-[18px] shadow-[var(--shadow-card)] divide-y divide-[rgb(60_74_60/0.08)] overflow-hidden">
        {itens.map((i, k) => (
          <div key={k} className="flex items-center gap-3 px-4 h-12">
            <span className="text-[17px] w-6 text-center">{i.icon}</span>
            <span className="flex-1 text-[15px] text-ink truncate">{i.nome}</span>
            <span className="text-[15px] font-medium text-ink tabular">{formatCurrency(i.valor)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Prévia ao vivo ─────────────────────────────────────────────────────────────

function Previa({ mes, meta, compacta }: { mes: ReturnType<typeof montarMes>; meta: number; compacta?: boolean }) {
  const gastos = mes.totalFixos + mes.totalVariaveis
  const pct = (v: number) => (mes.totalReceitas > 0 ? Math.min(100, (v / mes.totalReceitas) * 100) : 0)
  const bateMeta = mes.totalReceitas > 0 && mes.sobra >= mes.metaValor

  return (
    <div className="bg-surface rounded-[24px] shadow-[var(--shadow-float)] p-6">
      {!compacta && <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Prévia do seu mês</p>}
      <p className={cn('text-[13px] text-ink-3', !compacta && 'mt-4')}>Sobra prevista</p>
      <p className={cn('text-[40px] font-bold tracking-[-0.035em] leading-tight tabular', mes.sobra >= 0 ? 'text-ink' : 'text-negative')}>
        {formatCurrency(mes.sobra)}
      </p>
      {mes.totalReceitas > 0 && (
        <span className={cn('inline-flex mt-2 h-7 px-3 items-center rounded-full text-[12px] font-semibold', bateMeta ? 'bg-brand-soft text-brand-strong' : 'bg-[#fbf1e3] text-[#8a5a12]')}>
          {bateMeta ? `Meta de ${meta}% batida` : `Meta de ${meta}%: faltam ${formatCurrency(mes.metaValor - mes.sobra)}`}
        </span>
      )}

      <div className="mt-6 h-3 rounded-full bg-fill overflow-hidden flex">
        <div className="h-full bg-brand-strong transition-[width] duration-500" style={{ width: `${pct(mes.totalFixos)}%` }} />
        <div className="h-full bg-[#a9c2a7] transition-[width] duration-500" style={{ width: `${pct(mes.totalVariaveis)}%` }} />
      </div>

      <dl className="mt-5 flex flex-col gap-3 text-[14px]">
        <Linha label="Entra" valor={mes.totalReceitas} />
        <Linha label="Contas fixas" valor={-mes.totalFixos} cor="#3c4a3c" />
        <Linha label="Dia a dia" valor={-mes.totalVariaveis} cor="#a9c2a7" />
        <div className="h-px bg-hairline" />
        <Linha label="Total de gastos" valor={-gastos} forte />
      </dl>

      {!compacta && (mes.fixos.length + mes.variaveis.length > 0) && (
        <p className="mt-5 text-[12px] text-ink-3">
          {mes.receitas.length + mes.fixos.length + mes.variaveis.length} lançamentos{mes.cartoes.length ? ` e ${mes.cartoes.length} cartão${mes.cartoes.length > 1 ? 'ões' : ''}` : ''} serão criados.
        </p>
      )}
    </div>
  )
}

function Linha({ label, valor, cor, forte }: { label: string; valor: number; cor?: string; forte?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-ink-2">
        {cor && <span className="w-2.5 h-2.5 rounded-full" style={{ background: cor }} />}{label}
      </dt>
      <dd className={cn('tabular', forte ? 'font-semibold text-ink' : 'text-ink')}>{formatCurrency(valor)}</dd>
    </div>
  )
}
