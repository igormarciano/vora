import { cn } from '@/lib/utils'

/**
 * Estrutura comum das páginas autenticadas (redesign Apple-like).
 * Mobile: margens de 20px, título grande. Desktop: conteúdo até 1200px com respiro.
 */
export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('w-full max-w-[1200px] mx-auto px-5 sm:px-8 xl:px-12 pt-[max(env(safe-area-inset-top),20px)] lg:pt-10 pb-8 animate-rise', className)}>
      {children}
    </div>
  )
}

export function PageHeader({
  title, eyebrow, description, actions, children,
}: {
  title: string
  eyebrow?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <header className="mb-6 lg:mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="text-[13px] font-medium text-ink-3 mb-1 capitalize">{eyebrow}</p>}
          <h1 className="text-[32px] lg:text-[36px] font-bold tracking-[-0.025em] leading-[1.08] text-ink">{title}</h1>
          {description && <p className="text-[15px] text-ink-2 mt-2 max-w-2xl leading-relaxed hidden sm:block">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
      </div>
      {children}
    </header>
  )
}

/**
 * Números-chave. Mobile: o primeiro item vira destaque grande e os demais
 * ficam em rolagem horizontal. Desktop: cartões lado a lado.
 */
export function StatStrip({ items }: { items: { label: string; value: string; tone?: 'neg' | 'pos' | 'muted' }[] }) {
  const tone = (t?: string) =>
    t === 'neg' ? 'text-negative' : t === 'pos' ? 'text-positive' : t === 'muted' ? 'text-ink-2' : 'text-ink'
  const [destaque, ...resto] = items
  return (
    <div className="flex flex-col lg:flex-row gap-3">
      <div className="lg:flex-1 bg-brand-strong rounded-[20px] px-5 py-4 shadow-[var(--shadow-card)]">
        <p className="text-[12px] font-medium text-white/70">{destaque.label}</p>
        <p className="tabular font-semibold tracking-[-0.02em] leading-tight mt-1 text-[28px] lg:text-[26px] text-white">{destaque.value}</p>
      </div>
      <div className="flex gap-3 overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 [scrollbar-width:none] lg:contents">
        {resto.map(it => (
          <div key={it.label} className="flex-1 min-w-[136px] lg:min-w-0 bg-surface rounded-[18px] lg:rounded-[20px] px-3.5 py-3 lg:px-5 lg:py-4 shadow-[var(--shadow-card)]">
            <p className="text-[11.5px] lg:text-[12px] font-medium text-ink-3 truncate">{it.label}</p>
            <p className={cn('tabular font-semibold tracking-[-0.02em] leading-tight mt-1 text-[15px] lg:text-[22px] truncate', tone(it.tone))}>{it.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Section({ title, description, actions, children, className }: {
  title?: string
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      {(title || actions) && (
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            {title && <h2 className="text-[20px] font-semibold tracking-[-0.015em] text-ink">{title}</h2>}
            {description && <p className="text-[13px] text-ink-3 mt-0.5">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('bg-surface rounded-[20px] shadow-[var(--shadow-card)]', className)}>{children}</div>
}
