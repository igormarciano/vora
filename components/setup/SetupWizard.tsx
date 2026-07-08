'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X, ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import { salvarSetupInicial } from '@/app/setup/actions'
import { formatCurrency } from '@/lib/engine'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ExpenseItem {
  icon: string
  nome: string
  valor: number
  /** Categoria real do enum usado em FormGastoFixo/FormGastoVariavel — não uma string livre. */
  categoria: string
}

type Step = 'renda' | 'meta' | 'fixos' | 'variaveis' | 'lazer' | 'resumo'

const STEPS: Step[] = ['renda', 'meta', 'fixos', 'variaveis', 'lazer', 'resumo']

/** Meta oficial da Vora — mesmo número comunicado em Configurações. */
const META_ECONOMIA_DEFAULT = 30

/** Categoria "Outros" real de cada contexto (CATEGORIAS_PF em FormGastoFixo / CATEGORIAS em FormGastoVariavel) — usada para itens customizados. */
const CATEGORIA_OUTROS_FIXO = '🔖 Outros'
const CATEGORIA_OUTROS_VARIAVEL = '🔧 Outros'

const SETUP_DRAFT_KEY = 'vora_setup_wizard_draft'

// ── Suggestions ───────────────────────────────────────────────────────────────
// `categoria` mapeia cada sugestão para o valor real do enum usado no resto do
// app (CATEGORIAS_PF em FormGastoFixo.tsx / CATEGORIAS em FormGastoVariavel.tsx),
// para que o gasto criado no onboarding caia no filtro/agrupamento correto.

const FIXOS_SUGESTOES = [
  { icon: '🏠', nome: 'Aluguel / Moradia', valor: 1200, categoria: '🏠 Moradia' },
  { icon: '⚡', nome: 'Energia elétrica', valor: 120, categoria: '⚡ Energia/Água' },
  { icon: '💧', nome: 'Água', valor: 60, categoria: '⚡ Energia/Água' },
  { icon: '📶', nome: 'Internet', valor: 100, categoria: '📡 Internet/Telefone' },
  { icon: '📱', nome: 'Celular', valor: 70, categoria: '📡 Internet/Telefone' },
  { icon: '🎬', nome: 'Streamings', valor: 80, categoria: '📺 Streaming' },
]

const VARIAVEIS_SUGESTOES = [
  { icon: '🛒', nome: 'Mercado', valor: 500, categoria: '🛒 Mercado' },
  { icon: '🚌', nome: 'Transporte', valor: 200, categoria: '🚌 Transporte' },
  { icon: '💊', nome: 'Farmácia / Saúde', valor: 80, categoria: '💊 Farmácia' },
  { icon: '🧴', nome: 'Higiene / Beleza', valor: 100, categoria: '💄 Beleza' },
  { icon: '👕', nome: 'Roupas', valor: 150, categoria: '👗 Roupas' },
  { icon: '🐾', nome: 'Pet', valor: 120, categoria: '🐾 Pets' },
]

const LIFESTYLE_OPTIONS = [
  { id: 'tranquilo', icon: '🏠', title: 'Tranquilo', desc: 'Evito sair muito, prefiro ficar em casa', valor: 200 },
  { id: 'moderado',  icon: '🍕', title: 'Moderado',  desc: 'Saio algumas vezes, mas não todo dia',   valor: 500 },
  { id: 'ativo',     icon: '🎉', title: 'Ativo',      desc: 'Gosto de sair bastante, barzinho, etc', valor: 900 },
]

const RENDA_CHIPS = [2000, 3000, 4000, 5000, 7000, 10000]

// ── Main component ─────────────────────────────────────────────────────────────

interface WizardDraft {
  step: Step
  renda: string
  meta: number
  fixos: ExpenseItem[]
  variaveis: ExpenseItem[]
  lazer: number
  lifestyle: string
}

export function SetupWizard() {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const [step, setStep] = useState<Step>('renda')
  const [loading, setLoading] = useState(false)

  // State per step
  const [renda, setRenda] = useState('')
  const [meta, setMeta] = useState(META_ECONOMIA_DEFAULT)
  const [fixos, setFixos] = useState<ExpenseItem[]>([])
  const [fixoNome, setFixoNome] = useState('')
  const [fixoValor, setFixoValor] = useState('')

  const [variaveis, setVariaveis] = useState<ExpenseItem[]>([])
  const [varNome, setVarNome] = useState('')
  const [varValor, setVarValor] = useState('')

  const [lazer, setLazer] = useState(500)
  const [lifestyle, setLifestyle] = useState('moderado')

  // Restaura rascunho salvo em sessionStorage — evita perder o que já foi
  // preenchido se a página recarregar sem querer no meio do wizard.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SETUP_DRAFT_KEY)
      if (raw) {
        const draft: WizardDraft = JSON.parse(raw)
        setStep(draft.step)
        setRenda(draft.renda)
        setMeta(draft.meta)
        setFixos(draft.fixos)
        setVariaveis(draft.variaveis)
        setLazer(draft.lazer)
        setLifestyle(draft.lifestyle)
      }
    } catch {
      // rascunho corrompido ou indisponível — segue com os valores padrão
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const draft: WizardDraft = { step, renda, meta, fixos, variaveis, lazer, lifestyle }
    sessionStorage.setItem(SETUP_DRAFT_KEY, JSON.stringify(draft))
  }, [hydrated, step, renda, meta, fixos, variaveis, lazer, lifestyle])

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex) / (STEPS.length - 1)) * 100

  const rendaNum = parseFloat(renda.replace(',', '.')) || 0
  const totalFixos = fixos.reduce((s, i) => s + i.valor, 0)
  const totalVariaveis = variaveis.reduce((s, i) => s + i.valor, 0)
  const totalGastos = totalFixos + totalVariaveis + lazer
  const sobra = rendaNum - totalGastos
  const metaValorReais = rendaNum * (meta / 100)

  // ── Handlers ──

  function goNext() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }
  function goBack() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  function addFixoSugestao(s: typeof FIXOS_SUGESTOES[0]) {
    if (fixos.some(f => f.nome === s.nome)) return
    setFixos(prev => [...prev, { icon: s.icon, nome: s.nome, valor: s.valor, categoria: s.categoria }])
  }
  function addFixoCustom() {
    const nome = fixoNome.trim()
    const valor = parseFloat(fixoValor.replace(',', '.'))
    if (!nome || !valor || valor <= 0) { toast.error('Preenche nome e valor 😉'); return }
    setFixos(prev => [...prev, { icon: '📌', nome, valor, categoria: CATEGORIA_OUTROS_FIXO }])
    setFixoNome(''); setFixoValor('')
  }
  function updateFixoValor(nome: string, novoValor: number) {
    setFixos(prev => prev.map(f => (f.nome === nome ? { ...f, valor: novoValor } : f)))
  }
  function removeFixo(nome: string) {
    setFixos(prev => prev.filter(f => f.nome !== nome))
  }

  function addVarSugestao(s: typeof VARIAVEIS_SUGESTOES[0]) {
    if (variaveis.some(v => v.nome === s.nome)) return
    setVariaveis(prev => [...prev, { icon: s.icon, nome: s.nome, valor: s.valor, categoria: s.categoria }])
  }
  function addVarCustom() {
    const nome = varNome.trim()
    const valor = parseFloat(varValor.replace(',', '.'))
    if (!nome || !valor || valor <= 0) { toast.error('Preenche nome e valor 😉'); return }
    setVariaveis(prev => [...prev, { icon: '📌', nome, valor, categoria: CATEGORIA_OUTROS_VARIAVEL }])
    setVarNome(''); setVarValor('')
  }
  function updateVarValor(nome: string, novoValor: number) {
    setVariaveis(prev => prev.map(v => (v.nome === nome ? { ...v, valor: novoValor } : v)))
  }
  function removeVar(nome: string) {
    setVariaveis(prev => prev.filter(v => v.nome !== nome))
  }

  function selectLifestyle(val: number, id: string) {
    setLazer(val); setLifestyle(id)
  }

  async function handleFinish() {
    setLoading(true)
    const result = await salvarSetupInicial({ renda: rendaNum, meta, fixos, variaveis, lazer })
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    sessionStorage.removeItem(SETUP_DRAFT_KEY)
    router.refresh()
    router.push('/dashboard')
  }

  // ── Render ──

  return (
    <div className="min-h-screen bg-[#f2ede7] flex flex-col">

      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-[#f2ede7] px-5 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <Image src="/images/login-logo-icon.svg" alt="" width={22} height={22} />
          <span className="font-fraunces text-[16px] text-[#3c4a3c]">Vora</span>
          {step !== 'renda' && (
            <button onClick={goBack} className="ml-auto flex items-center gap-1 text-[13px] text-[#6b7280] hover:text-[#3c4a3c] transition-colors">
              <ChevronLeft size={16} /> Voltar
            </button>
          )}
        </div>

        {/* Barra de progresso */}
        {step !== 'resumo' && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-[3px] bg-[#d7cfc7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8faf8f] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] text-[#a5bfa5]">{stepIndex + 1} de {STEPS.length - 1}</span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto px-5 py-6 max-w-lg mx-auto w-full">

        {/* ── STEP: RENDA ── */}
        {step === 'renda' && (
          <div className="flex flex-col gap-6">
            <Mascot msg="Só preciso saber quanto entra por mês. Com isso já dá pra começar." />
            <div>
              <p className="text-[11px] font-medium text-[#8faf8f] uppercase tracking-widest mb-1">Passo 1 — Renda</p>
              <h2 className="font-fraunces text-[30px] text-[#3c4a3c] leading-tight mb-2">
                Quanto você<br />ganha por mês?
              </h2>
              <p className="text-[14px] text-[#6b7280] leading-relaxed">
                Pode ser salário, freela, pensão — o que entrar regularmente na sua conta.
              </p>
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#3c4a3c] block mb-2">Renda mensal</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-[#6b7280] font-medium">R$</span>
                <input
                  type="number"
                  value={renda}
                  onChange={e => setRenda(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                  className="w-full pl-12 pr-4 py-4 text-[24px] border border-[#ece4db] rounded-2xl bg-white text-[#3c4a3c] outline-none focus:border-[#8faf8f] transition-colors"
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#8faf8f] uppercase tracking-widest mb-3">Ou escolha um valor próximo</p>
              <div className="flex flex-wrap gap-2">
                {RENDA_CHIPS.map(v => (
                  <button
                    key={v}
                    onClick={() => setRenda(String(v))}
                    className="px-4 py-2 rounded-full border text-[13px] transition-colors"
                    style={{
                      borderColor: rendaNum === v ? '#8faf8f' : '#ece4db',
                      backgroundColor: rendaNum === v ? '#dce6dc' : 'white',
                      color: rendaNum === v ? '#3c4a3c' : '#6b7280',
                    }}
                  >
                    {formatCurrency(v)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#ece4db] rounded-xl px-4 py-3 text-[13px] text-[#6b7280] leading-relaxed border-l-4 border-[#8faf8f]">
              Seus dados ficam só na sua conta. A Vora não compartilha nada com ninguém.
            </div>
          </div>
        )}

        {/* ── STEP: META DE ECONOMIA ── */}
        {step === 'meta' && (
          <div className="flex flex-col gap-6">
            <Mascot msg="Com sua renda em mãos, bora definir uma meta. Isso muda como eu vou te mostrar seu mês daqui pra frente." />
            <div>
              <p className="text-[11px] font-medium text-[#8faf8f] uppercase tracking-widest mb-1">Passo 2 — Meta de economia</p>
              <h2 className="font-fraunces text-[30px] text-[#3c4a3c] leading-tight mb-2">
                Quanto você quer<br />guardar por mês?
              </h2>
              <p className="text-[14px] text-[#6b7280] leading-relaxed">
                A Vora recomenda 30% — mas o número é seu. Ajusta como fizer sentido pra sua realidade.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#ece4db] p-5">
              <div className="text-center mb-4">
                <div className="font-fraunces text-[44px] text-[#3c4a3c] leading-none">
                  {meta}<span className="text-[20px] text-[#6b7280]">%</span>
                </div>
                <div className="text-[13px] text-[#6b7280] mt-1">
                  {rendaNum > 0 ? `≈ ${formatCurrency(metaValorReais)} por mês` : 'da sua renda mensal'}
                </div>
              </div>
              <input
                type="range" min={0} max={100} step={1} value={meta}
                onChange={e => setMeta(Number(e.target.value))}
                className="w-full accent-[#8faf8f]"
              />
              <div className="flex justify-between text-[12px] text-[#6b7280] mt-1 mb-4">
                <span>0%</span><span>100%</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[12px] text-[#6b7280] shrink-0">Ajuste fino</label>
                <div className="relative flex-1">
                  <input
                    type="number" min={0} max={100} value={meta}
                    onChange={e => setMeta(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-full border border-[#ece4db] rounded-lg pl-3 pr-8 py-2 text-[14px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#6b7280]">%</span>
                </div>
              </div>
            </div>

            {rendaNum > 0 && meta < 20 && (
              <div className="bg-[#ece4db] rounded-xl px-4 py-3 text-[13px] text-[#6b7280] leading-relaxed border-l-4 border-[#8faf8f]">
                Combinado — isso significa cerca de {formatCurrency(metaValorReais)} ficando disponível todo mês, mas fora da meta ideal.
              </div>
            )}
          </div>
        )}

        {/* ── STEP: FIXOS ── */}
        {step === 'fixos' && (
          <div className="flex flex-col gap-5">
            <Mascot msg="Esses são os gastos que chegam todo mês, certinhos. Não precisa lembrar de todos agora." />
            <div>
              <p className="text-[11px] font-medium text-[#8faf8f] uppercase tracking-widest mb-1">Passo 3 — Gastos fixos</p>
              <h2 className="font-fraunces text-[30px] text-[#3c4a3c] leading-tight mb-2">
                O que você paga<br />todo mês?
              </h2>
              <p className="text-[14px] text-[#6b7280] leading-relaxed">
                Aluguel, conta de luz, internet, streaming — tudo que vem todo mês.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#6b7280] uppercase tracking-widest mb-3">Sugestões comuns</p>
              <div className="grid grid-cols-2 gap-2">
                {FIXOS_SUGESTOES.map(s => {
                  const added = fixos.find(f => f.nome === s.nome)
                  if (added) {
                    return (
                      <div key={s.nome} className="relative flex items-center gap-3 p-3 rounded-2xl border" style={{ borderColor: '#8faf8f', backgroundColor: '#dce6dc' }}>
                        <button type="button" onClick={() => removeFixo(s.nome)} aria-label={`Remover ${s.nome}`}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-[#6b7280] hover:text-[#ef4444] transition-colors">
                          <X size={12} />
                        </button>
                        <span className="text-[20px]">{s.icon}</span>
                        <div>
                          <div className="text-[13px] font-medium text-[#3c4a3c]">{s.nome}</div>
                          <EditableValor valor={added.valor} onChange={v => updateFixoValor(s.nome, v)} />
                        </div>
                      </div>
                    )
                  }
                  return (
                    <button
                      key={s.nome}
                      onClick={() => addFixoSugestao(s)}
                      className="flex items-center gap-3 p-3 rounded-2xl border text-left transition-all"
                      style={{ borderColor: '#ece4db', backgroundColor: 'white' }}
                    >
                      <span className="text-[20px]">{s.icon}</span>
                      <div>
                        <div className="text-[13px] font-medium text-[#3c4a3c]">{s.nome}</div>
                        <div className="text-[11px] text-[#6b7280]">Toque para add</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {fixos.some(f => f.categoria === CATEGORIA_OUTROS_FIXO) && (
              <div>
                <p className="text-[11px] font-medium text-[#6b7280] uppercase tracking-widest mb-2">Adicionados</p>
                <ExpenseList items={fixos.filter(f => f.categoria === CATEGORIA_OUTROS_FIXO)} onRemove={removeFixo} onValorChange={updateFixoValor} />
              </div>
            )}

            <div>
              <p className="text-[11px] font-medium text-[#6b7280] uppercase tracking-widest mb-2">Adicionar outro</p>
              <div className="flex gap-2">
                <input
                  value={fixoNome} onChange={e => setFixoNome(e.target.value)}
                  placeholder="Ex: Academia"
                  className="flex-1 border border-[#ece4db] rounded-xl px-3 py-2.5 text-[14px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6b7280]">R$</span>
                  <input
                    value={fixoValor} onChange={e => setFixoValor(e.target.value)}
                    placeholder="0" inputMode="numeric"
                    className="w-24 border border-[#ece4db] rounded-xl pl-8 pr-3 py-2.5 text-[14px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white"
                  />
                </div>
                <button onClick={addFixoCustom} className="w-11 h-11 rounded-xl bg-[#8faf8f] text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0">
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: VARIÁVEIS ── */}
        {step === 'variaveis' && (
          <div className="flex flex-col gap-5">
            <Mascot msg="Esses variam um pouco a cada mês — mas é bom ter uma noção pra a projeção ficar mais próxima da realidade." />
            <div>
              <p className="text-[11px] font-medium text-[#8faf8f] uppercase tracking-widest mb-1">Passo 4 — Gastos variáveis</p>
              <h2 className="font-fraunces text-[30px] text-[#3c4a3c] leading-tight mb-2">
                E o que muda<br />todo mês?
              </h2>
              <p className="text-[14px] text-[#6b7280] leading-relaxed">
                Mercado, farmácia, transporte — gastos que existem mas não têm valor fixo.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#6b7280] uppercase tracking-widest mb-3">Sugestões comuns</p>
              <div className="grid grid-cols-2 gap-2">
                {VARIAVEIS_SUGESTOES.map(s => {
                  const added = variaveis.find(v => v.nome === s.nome)
                  if (added) {
                    return (
                      <div key={s.nome} className="relative flex items-center gap-3 p-3 rounded-2xl border" style={{ borderColor: '#8faf8f', backgroundColor: '#dce6dc' }}>
                        <button type="button" onClick={() => removeVar(s.nome)} aria-label={`Remover ${s.nome}`}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-[#6b7280] hover:text-[#ef4444] transition-colors">
                          <X size={12} />
                        </button>
                        <span className="text-[20px]">{s.icon}</span>
                        <div>
                          <div className="text-[13px] font-medium text-[#3c4a3c]">{s.nome}</div>
                          <EditableValor valor={added.valor} onChange={v => updateVarValor(s.nome, v)} />
                        </div>
                      </div>
                    )
                  }
                  return (
                    <button
                      key={s.nome}
                      onClick={() => addVarSugestao(s)}
                      className="flex items-center gap-3 p-3 rounded-2xl border text-left transition-all"
                      style={{ borderColor: '#ece4db', backgroundColor: 'white' }}
                    >
                      <span className="text-[20px]">{s.icon}</span>
                      <div>
                        <div className="text-[13px] font-medium text-[#3c4a3c]">{s.nome}</div>
                        <div className="text-[11px] text-[#6b7280]">Toque para add</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {variaveis.some(v => v.categoria === CATEGORIA_OUTROS_VARIAVEL) && (
              <div>
                <p className="text-[11px] font-medium text-[#6b7280] uppercase tracking-widest mb-2">Adicionados</p>
                <ExpenseList items={variaveis.filter(v => v.categoria === CATEGORIA_OUTROS_VARIAVEL)} onRemove={removeVar} onValorChange={updateVarValor} />
              </div>
            )}

            <div>
              <p className="text-[11px] font-medium text-[#6b7280] uppercase tracking-widest mb-2">Adicionar outro</p>
              <div className="flex gap-2">
                <input
                  value={varNome} onChange={e => setVarNome(e.target.value)}
                  placeholder="Ex: Farmácia"
                  className="flex-1 border border-[#ece4db] rounded-xl px-3 py-2.5 text-[14px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6b7280]">R$</span>
                  <input
                    value={varValor} onChange={e => setVarValor(e.target.value)}
                    placeholder="0" inputMode="numeric"
                    className="w-24 border border-[#ece4db] rounded-xl pl-8 pr-3 py-2.5 text-[14px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white"
                  />
                </div>
                <button onClick={addVarCustom} className="w-11 h-11 rounded-xl bg-[#8faf8f] text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0">
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: LAZER ── */}
        {step === 'lazer' && (
          <div className="flex flex-col gap-6">
            <Mascot msg="Essa parte é importante. Quanto você gasta pra viver bem no dia a dia — bar, restaurante, rolê?" />
            <div>
              <p className="text-[11px] font-medium text-[#8faf8f] uppercase tracking-widest mb-1">Passo 5 — Dia a dia</p>
              <h2 className="font-fraunces text-[30px] text-[#3c4a3c] leading-tight mb-2">
                O que você curte<br />gastar por mês?
              </h2>
              <p className="text-[14px] text-[#6b7280] leading-relaxed">
                Não é pra cortar — é pra incluir na conta. Bar, restaurante, delivery, passeio.
              </p>
            </div>

            {/* Slider */}
            <div className="bg-white rounded-2xl border border-[#ece4db] p-5">
              <div className="text-center mb-4">
                <div className="font-fraunces text-[44px] text-[#3c4a3c] leading-none">
                  <span className="text-[20px] text-[#6b7280]">R$ </span>
                  {lazer.toLocaleString('pt-BR')}
                </div>
                <div className="text-[13px] text-[#6b7280] mt-1">por mês em lazer e dia a dia</div>
              </div>
              <input
                type="range" min={0} max={2000} step={50} value={lazer}
                onChange={e => { setLazer(Number(e.target.value)); setLifestyle('') }}
                className="w-full accent-[#8faf8f]"
              />
              <div className="flex justify-between text-[12px] text-[#6b7280] mt-1">
                <span>R$ 0</span><span>R$ 2.000</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#6b7280] uppercase tracking-widest mb-3">Ou escolha um perfil</p>
              <div className="flex flex-col gap-2">
                {LIFESTYLE_OPTIONS.map(o => (
                  <button
                    key={o.id}
                    onClick={() => selectLifestyle(o.valor, o.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl border text-left transition-all"
                    style={{
                      borderColor: lifestyle === o.id ? '#8faf8f' : '#ece4db',
                      backgroundColor: lifestyle === o.id ? '#dce6dc' : 'white',
                    }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#f2ede7] flex items-center justify-center text-[22px] shrink-0">
                      {o.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-[15px] font-medium text-[#3c4a3c]">{o.title}</div>
                      <div className="text-[13px] text-[#6b7280]">{o.desc}</div>
                    </div>
                    <div className="text-[14px] font-medium text-[#4f604f]">~{formatCurrency(o.valor)}</div>
                    <div
                      className="w-5 h-5 rounded-full border flex items-center justify-center text-[12px] shrink-0"
                      style={{
                        borderColor: lifestyle === o.id ? '#8faf8f' : '#d7cfc7',
                        backgroundColor: lifestyle === o.id ? '#8faf8f' : 'white',
                        color: lifestyle === o.id ? 'white' : 'transparent',
                      }}
                    >
                      ✓
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: RESUMO ── */}
        {step === 'resumo' && (
          <div className="flex flex-col gap-6">
            <div className="text-center py-4">
              <div className="text-[56px] mb-2">{sobra >= metaValorReais ? '🌱' : sobra >= 0 ? '🌿' : '🤔'}</div>
              <p className="text-[11px] font-medium text-[#8faf8f] uppercase tracking-widest mb-2">Seu mês em um olhar</p>
              <h2 className="font-fraunces text-[28px] text-[#3c4a3c] leading-tight">
                {sobra >= metaValorReais
                  ? <>Você está batendo sua meta de guardar {meta}%. Olha que <em className="italic text-[#8faf8f]">sobra</em> boa.</>
                  : sobra >= 0
                  ? `Ficou assim o seu mês — um pouco abaixo da meta de ${meta}%, mas dá pra ajustar.`
                  : <>Olha isso<br />aqui comigo.</>
                }
              </h2>
            </div>

            <div className="bg-white rounded-2xl border border-[#ece4db] overflow-hidden">
              {([
                { label: '💰 Renda mensal', value: formatCurrency(rendaNum), step: 'renda' as Step },
                { label: '🎯 Meta de economia', value: `${meta}% (${formatCurrency(metaValorReais)})`, step: 'meta' as Step },
                { label: '🏠 Gastos fixos', value: formatCurrency(totalFixos), step: 'fixos' as Step },
                { label: '🛒 Gastos variáveis', value: formatCurrency(totalVariaveis), step: 'variaveis' as Step },
                { label: '🎉 Dia a dia', value: formatCurrency(lazer), step: 'lazer' as Step },
              ]).map((row) => (
                <button
                  key={row.label}
                  type="button"
                  onClick={() => setStep(row.step)}
                  className="w-full flex justify-between items-center px-5 py-3.5 border-b border-[#f2ede7] text-left hover:bg-[#f9f7f4] transition-colors"
                >
                  <span className="text-[14px] text-[#6b7280]">{row.label}</span>
                  <span className="text-[14px] font-medium text-[#3c4a3c]">{row.value}</span>
                </button>
              ))}
              <div className="flex justify-between items-center px-5 py-4">
                <span className="text-[15px] font-medium text-[#3c4a3c]">Sobra estimada</span>
                <span
                  className="font-fraunces text-[22px]"
                  style={{ color: sobra >= 0 ? '#4f604f' : '#ef4444' }}
                >
                  {formatCurrency(sobra)}
                </span>
              </div>
            </div>

            <Mascot msg={
              sobra >= metaValorReais
                ? 'Seu mês está bem equilibrado. Você tem uma margem real pra respirar — e talvez até guardar algo.'
                : sobra >= 0
                ? 'Não sobra muito, mas o mês fecha. A gente pode ajustar qualquer coisa quando quiser.'
                : 'Os gastos ficaram maiores que a renda. Não é problema — é informação. A gente pode ajustar agora no painel.'
            } />
          </div>
        )}
      </div>

      {/* CTA fixo no bottom */}
      <div className="sticky bottom-0 bg-gradient-to-t from-[#f2ede7] via-[#f2ede7] to-transparent px-5 pt-4 pb-8">
        <button
          onClick={step === 'resumo' ? handleFinish : goNext}
          disabled={step === 'renda' && rendaNum <= 0 || loading}
          className="w-full py-4 rounded-2xl font-medium text-[16px] transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#8faf8f', color: 'white' }}
        >
          {loading ? 'Salvando...'
            : step === 'resumo' ? 'Ver meu painel →'
            : step === 'lazer' ? 'Ver meu resumo'
            : 'Continuar'}
        </button>
        {(step === 'fixos' || step === 'variaveis' || step === 'lazer') && (
          <button
            onClick={goNext}
            className="w-full mt-2 py-3 text-[14px] text-[#a5bfa5] hover:text-[#6b7280] transition-colors"
          >
            Pular por agora
          </button>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Mascot({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-[#dce6dc] border border-[#b4c9b4] flex items-center justify-center text-[20px] shrink-0">
        🌿
      </div>
      <div className="flex-1 bg-white border border-[#ece4db] rounded-2xl rounded-tl-sm px-4 py-3 font-fraunces italic text-[14px] text-[#3c4a3c] leading-relaxed">
        {msg}
      </div>
    </div>
  )
}

function ExpenseList({ items, onRemove, onValorChange }: { items: ExpenseItem[], onRemove: (nome: string) => void, onValorChange: (nome: string, valor: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map(item => (
        <div key={item.nome} className="flex items-center gap-3 bg-white border border-[#ece4db] rounded-2xl px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-[#f2ede7] flex items-center justify-center text-[18px] shrink-0">
            {item.icon}
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-medium text-[#3c4a3c]">{item.nome}</div>
            <EditableValor valor={item.valor} onChange={v => onValorChange(item.nome, v)} suffix="/mês" />
          </div>
          <button onClick={() => onRemove(item.nome)} className="w-7 h-7 rounded-full bg-[#f2ede7] flex items-center justify-center text-[#6b7280] hover:bg-[#fef2f2] hover:text-[#ef4444] transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

/**
 * Valor clicável que abre um input inline para edição (foco automático,
 * confirma com Enter/blur). Nenhum valor de gasto fica travado depois de
 * adicionado — o usuário pode reabrir e ajustar enquanto estiver no passo.
 */
function EditableValor({ valor, onChange, suffix }: { valor: number; onChange: (v: number) => void; suffix?: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(valor))

  function confirm() {
    const num = parseFloat(draft.replace(',', '.'))
    if (!isNaN(num) && num > 0) onChange(num)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        inputMode="decimal"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onFocus={e => e.target.select()}
        onBlur={confirm}
        onKeyDown={e => { if (e.key === 'Enter') confirm() }}
        onClick={e => e.stopPropagation()}
        className="w-24 border border-[#8faf8f] rounded-lg px-2 py-1 text-[12px] text-[#3c4a3c] outline-none bg-white"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); setDraft(String(valor)); setEditing(true) }}
      className="text-[12px] text-[#6b7280] underline decoration-dotted underline-offset-2 hover:text-[#3c4a3c] transition-colors"
    >
      {formatCurrency(valor)}{suffix}
    </button>
  )
}
