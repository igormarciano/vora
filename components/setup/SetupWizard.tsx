'use client'

import { useState } from 'react'
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
}

type Step = 'renda' | 'fixos' | 'variaveis' | 'lazer' | 'resumo'

const STEPS: Step[] = ['renda', 'fixos', 'variaveis', 'lazer', 'resumo']

// ── Suggestions ───────────────────────────────────────────────────────────────

const FIXOS_SUGESTOES = [
  { icon: '🏠', nome: 'Aluguel / Moradia', valor: 1200 },
  { icon: '⚡', nome: 'Energia elétrica', valor: 120 },
  { icon: '💧', nome: 'Água', valor: 60 },
  { icon: '📶', nome: 'Internet', valor: 100 },
  { icon: '📱', nome: 'Celular', valor: 70 },
  { icon: '🎬', nome: 'Streamings', valor: 80 },
]

const VARIAVEIS_SUGESTOES = [
  { icon: '🛒', nome: 'Mercado', valor: 500 },
  { icon: '🚌', nome: 'Transporte', valor: 200 },
  { icon: '💊', nome: 'Farmácia / Saúde', valor: 80 },
  { icon: '🧴', nome: 'Higiene / Beleza', valor: 100 },
  { icon: '👕', nome: 'Roupas', valor: 150 },
  { icon: '🐾', nome: 'Pet', valor: 120 },
]

const LIFESTYLE_OPTIONS = [
  { id: 'tranquilo', icon: '🏠', title: 'Tranquilo', desc: 'Evito sair muito, prefiro ficar em casa', valor: 200 },
  { id: 'moderado',  icon: '🍕', title: 'Moderado',  desc: 'Saio algumas vezes, mas não todo dia',   valor: 500 },
  { id: 'ativo',     icon: '🎉', title: 'Ativo',      desc: 'Gosto de sair bastante, barzinho, etc', valor: 900 },
]

const RENDA_CHIPS = [2000, 3000, 4000, 5000, 7000, 10000]

// ── Main component ─────────────────────────────────────────────────────────────

export function SetupWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('renda')
  const [loading, setLoading] = useState(false)

  // State per step
  const [renda, setRenda] = useState('')
  const [fixos, setFixos] = useState<ExpenseItem[]>([])
  const [fixoNome, setFixoNome] = useState('')
  const [fixoValor, setFixoValor] = useState('')
  const [addedFixoIds, setAddedFixoIds] = useState<Set<string>>(new Set())

  const [variaveis, setVariaveis] = useState<ExpenseItem[]>([])
  const [varNome, setVarNome] = useState('')
  const [varValor, setVarValor] = useState('')
  const [addedVarIds, setAddedVarIds] = useState<Set<string>>(new Set())

  const [lazer, setLazer] = useState(500)
  const [lifestyle, setLifestyle] = useState('moderado')

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex) / (STEPS.length - 1)) * 100

  const rendaNum = parseFloat(renda.replace(',', '.')) || 0
  const totalFixos = fixos.reduce((s, i) => s + i.valor, 0)
  const totalVariaveis = variaveis.reduce((s, i) => s + i.valor, 0)
  const totalGastos = totalFixos + totalVariaveis + lazer
  const sobra = rendaNum - totalGastos

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
    if (addedFixoIds.has(s.nome)) return
    setFixos(prev => [...prev, s])
    setAddedFixoIds(prev => new Set([...prev, s.nome]))
  }
  function addFixoCustom() {
    const nome = fixoNome.trim()
    const valor = parseFloat(fixoValor.replace(',', '.'))
    if (!nome || !valor || valor <= 0) { toast.error('Preenche nome e valor 😉'); return }
    setFixos(prev => [...prev, { icon: '📌', nome, valor }])
    setFixoNome(''); setFixoValor('')
  }
  function removeFixo(idx: number) {
    const removed = fixos[idx]
    setFixos(prev => prev.filter((_, i) => i !== idx))
    setAddedFixoIds(prev => { const s = new Set(prev); s.delete(removed.nome); return s })
  }

  function addVarSugestao(s: typeof VARIAVEIS_SUGESTOES[0]) {
    if (addedVarIds.has(s.nome)) return
    setVariaveis(prev => [...prev, s])
    setAddedVarIds(prev => new Set([...prev, s.nome]))
  }
  function addVarCustom() {
    const nome = varNome.trim()
    const valor = parseFloat(varValor.replace(',', '.'))
    if (!nome || !valor || valor <= 0) { toast.error('Preenche nome e valor 😉'); return }
    setVariaveis(prev => [...prev, { icon: '📌', nome, valor }])
    setVarNome(''); setVarValor('')
  }
  function removeVar(idx: number) {
    const removed = variaveis[idx]
    setVariaveis(prev => prev.filter((_, i) => i !== idx))
    setAddedVarIds(prev => { const s = new Set(prev); s.delete(removed.nome); return s })
  }

  function selectLifestyle(val: number, id: string) {
    setLazer(val); setLifestyle(id)
  }

  async function handleFinish() {
    setLoading(true)
    const result = await salvarSetupInicial({ renda: rendaNum, fixos, variaveis, lazer })
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
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
          {step === 'renda' && (
            <button onClick={() => router.push('/dashboard')} className="ml-auto text-[13px] text-[#a5bfa5] hover:text-[#6b7280] transition-colors">
              Pular tudo
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

        {/* ── STEP: FIXOS ── */}
        {step === 'fixos' && (
          <div className="flex flex-col gap-5">
            <Mascot msg="Esses são os gastos que chegam todo mês, certinhos. Não precisa lembrar de todos agora." />
            <div>
              <p className="text-[11px] font-medium text-[#8faf8f] uppercase tracking-widest mb-1">Passo 2 — Gastos fixos</p>
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
                {FIXOS_SUGESTOES.map(s => (
                  <button
                    key={s.nome}
                    onClick={() => addFixoSugestao(s)}
                    disabled={addedFixoIds.has(s.nome)}
                    className="flex items-center gap-3 p-3 rounded-2xl border text-left transition-all"
                    style={{
                      borderColor: addedFixoIds.has(s.nome) ? '#8faf8f' : '#ece4db',
                      backgroundColor: addedFixoIds.has(s.nome) ? '#dce6dc' : 'white',
                      opacity: addedFixoIds.has(s.nome) ? 0.6 : 1,
                    }}
                  >
                    <span className="text-[20px]">{s.icon}</span>
                    <div>
                      <div className="text-[13px] font-medium text-[#3c4a3c]">{s.nome}</div>
                      <div className="text-[11px] text-[#6b7280]">{addedFixoIds.has(s.nome) ? 'Adicionado ✓' : 'Toque para add'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {fixos.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-[#6b7280] uppercase tracking-widest mb-2">Adicionados</p>
                <ExpenseList items={fixos} onRemove={removeFixo} />
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
              <p className="text-[11px] font-medium text-[#8faf8f] uppercase tracking-widest mb-1">Passo 3 — Gastos variáveis</p>
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
                {VARIAVEIS_SUGESTOES.map(s => (
                  <button
                    key={s.nome}
                    onClick={() => addVarSugestao(s)}
                    disabled={addedVarIds.has(s.nome)}
                    className="flex items-center gap-3 p-3 rounded-2xl border text-left transition-all"
                    style={{
                      borderColor: addedVarIds.has(s.nome) ? '#8faf8f' : '#ece4db',
                      backgroundColor: addedVarIds.has(s.nome) ? '#dce6dc' : 'white',
                      opacity: addedVarIds.has(s.nome) ? 0.6 : 1,
                    }}
                  >
                    <span className="text-[20px]">{s.icon}</span>
                    <div>
                      <div className="text-[13px] font-medium text-[#3c4a3c]">{s.nome}</div>
                      <div className="text-[11px] text-[#6b7280]">{addedVarIds.has(s.nome) ? 'Adicionado ✓' : 'Toque para add'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {variaveis.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-[#6b7280] uppercase tracking-widest mb-2">Adicionados</p>
                <ExpenseList items={variaveis} onRemove={removeVar} />
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
              <p className="text-[11px] font-medium text-[#8faf8f] uppercase tracking-widest mb-1">Passo 4 — Dia a dia</p>
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
              <div className="text-[56px] mb-2">{sobra >= 500 ? '🌱' : sobra >= 0 ? '🌿' : '🤔'}</div>
              <p className="text-[11px] font-medium text-[#8faf8f] uppercase tracking-widest mb-2">Seu mês em um olhar</p>
              <h2 className="font-fraunces text-[28px] text-[#3c4a3c] leading-tight">
                {sobra >= 500
                  ? <>Olha que <em className="italic text-[#8faf8f]">sobra</em> boa.</>
                  : sobra >= 0
                  ? 'Ficou assim o seu mês.'
                  : <>Olha isso<br />aqui comigo.</>
                }
              </h2>
            </div>

            <div className="bg-white rounded-2xl border border-[#ece4db] overflow-hidden">
              {[
                { label: '💰 Renda mensal', value: formatCurrency(rendaNum), highlight: false },
                { label: '🏠 Gastos fixos', value: formatCurrency(totalFixos), highlight: false },
                { label: '🛒 Gastos variáveis', value: formatCurrency(totalVariaveis), highlight: false },
                { label: '🎉 Dia a dia', value: formatCurrency(lazer), highlight: false },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center px-5 py-3.5 border-b border-[#f2ede7]">
                  <span className="text-[14px] text-[#6b7280]">{row.label}</span>
                  <span className="text-[14px] font-medium text-[#3c4a3c]">{row.value}</span>
                </div>
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
              sobra >= 500
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

function ExpenseList({ items, onRemove }: { items: ExpenseItem[], onRemove: (i: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 bg-white border border-[#ece4db] rounded-2xl px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-[#f2ede7] flex items-center justify-center text-[18px] shrink-0">
            {item.icon}
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-medium text-[#3c4a3c]">{item.nome}</div>
            <div className="text-[12px] text-[#6b7280]">{formatCurrency(item.valor)}/mês</div>
          </div>
          <button onClick={() => onRemove(i)} className="w-7 h-7 rounded-full bg-[#f2ede7] flex items-center justify-center text-[#6b7280] hover:bg-[#fef2f2] hover:text-[#ef4444] transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
