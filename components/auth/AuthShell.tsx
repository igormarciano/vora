import Image from 'next/image'
import Link from 'next/link'
import { BrandMark } from '@/components/vora/ui'

/**
 * Casca das telas de autenticação.
 * - Desktop (lg+): tela dividida. À esquerda um painel de marca com a proposta de
 *   valor e uma prévia do produto; à direita o formulário, centralizado e estreito.
 * - Mobile: ilustração compacta no topo e o formulário numa "sheet" que sobe do rodapé.
 */
export function AuthShell({ children, illustration = '/images/login-hero.svg' }: {
  children: React.ReactNode
  illustration?: string
}) {
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(480px,1fr)]">
      {/* ── Painel de marca (desktop) ── */}
      <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 xl:p-16 bg-[linear-gradient(160deg,#e6eee4_0%,#d5e2d3_55%,#c3d5c1_100%)]">
        <BrandMark />

        <div className="relative z-10 max-w-[520px] py-10">
          <h2 className="font-fraunces text-[52px] xl:text-[60px] leading-[1.02] tracking-[-0.02em] text-brand-strong">
            Veja seu mês<br />antes dele acontecer.
          </h2>
          <p className="mt-5 text-[18px] leading-relaxed text-ink-2 max-w-[440px]">
            Receitas, contas, cartões e parcelas num só lugar, com a projeção dos próximos meses e onde dá pra cortar.
          </p>

          <PreviewCard />
        </div>

        <div className="relative z-10 flex items-center gap-5 text-[13px] text-ink-2">
          <span>Sem conexão com seu banco</span>
          <span className="w-1 h-1 rounded-full bg-ink-3" />
          <span>Seus dados são só seus</span>
        </div>

      </aside>

      {/* ── Formulário ── */}
      <main className="min-h-dvh flex flex-col">
        {/* Topo mobile */}
        <div className="lg:hidden relative flex-1 min-h-[38dvh] flex flex-col items-center justify-center pt-[calc(env(safe-area-inset-top)+64px)] pb-6 bg-[linear-gradient(180deg,#e6eee4_0%,#f5f4f0_100%)]">
          <div className="absolute top-[max(env(safe-area-inset-top),20px)] left-0 right-0 flex justify-center pt-4">
            <BrandMark size={26} />
          </div>
          <Image src={illustration} alt="" width={220} height={220} className="w-[58vw] max-w-[260px] h-auto" priority />
        </div>

        <div className="relative lg:flex-1 flex lg:items-center justify-center">
          <div className="w-full max-w-[400px] px-6 pt-7 pb-[max(env(safe-area-inset-bottom),28px)] lg:py-12 lg:px-0 bg-canvas rounded-t-[28px] -mt-5 lg:mt-0 lg:rounded-none animate-rise">
            {children}
          </div>
        </div>

        <footer className="hidden lg:flex justify-center gap-5 pb-8 text-[12px] text-ink-3">
          <Link href="/termos" className="hover:text-ink">Termos</Link>
          <Link href="/privacidade" className="hover:text-ink">Privacidade</Link>
        </footer>
      </main>
    </div>
  )
}

/** Mini prévia do produto no painel de marca. Ilustrativa, com valores fictícios. */
function PreviewCard() {
  const meses = [
    { m: 'dez', v: 62 }, { m: 'jan', v: 48 }, { m: 'fev', v: 55 },
    { m: 'mar', v: 70 }, { m: 'abr', v: 78 }, { m: 'mai', v: 84 },
  ]
  return (
    <div className="mt-10 w-full max-w-[420px] rounded-[24px] bg-white/75 backdrop-blur-xl p-5 shadow-[0_20px_60px_-20px_rgb(29_38_29/0.35)] border border-white/60">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-3">Sobra prevista</p>
          <p className="font-fraunces text-[34px] leading-tight text-brand-strong tabular">R$ 1.840</p>
        </div>
        <span className="mt-1 text-[12px] font-semibold px-2.5 py-1 rounded-full bg-brand-soft text-brand-strong">Meta batida</span>
      </div>
      <div className="mt-5 flex items-end gap-2.5">
        {meses.map((x, i) => (
          <div key={x.m} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full rounded-[7px]" style={{ height: `${Math.round(x.v * 0.72)}px`, background: i === 0 ? '#3c4a3c' : '#a9c2a7' }} />
            <span className="text-[11px] text-ink-3">{x.m}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-[14px] bg-sand/70 px-3.5 py-2.5 text-[13px]">
        <span className="text-ink-2">Parcela do celular termina em março</span>
        <span className="font-semibold text-positive tabular">−R$ 320</span>
      </div>
    </div>
  )
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h1 className="font-fraunces text-[30px] lg:text-[34px] leading-[1.08] tracking-[-0.015em] text-ink">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{subtitle}</p>}
    </div>
  )
}
