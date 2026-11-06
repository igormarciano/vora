import { cn } from '@/lib/utils'

/**
 * Estrutura comum das páginas autenticadas. Antes cada tela tinha o próprio
 * `max-w-2xl mx-auto`, o que deixava o conteúdo espremido no centro com muita
 * sobra lateral. Agora todas usam a mesma largura (mais ampla) e o mesmo ritmo.
 */
export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('w-full max-w-6xl px-4 sm:px-6 lg:px-10 py-6 lg:py-8', className)}>
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
          {eyebrow && <p className="text-[12px] text-[#6b7280] uppercase tracking-wide mb-1">{eyebrow}</p>}
          <h1 className="font-fraunces text-[28px] lg:text-[32px] text-[#3c4a3c] leading-tight">{title}</h1>
          {description && <p className="text-[14px] text-[#6b7280] mt-1.5 max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </header>
  )
}

/** Linha de números-chave sem caixas aninhadas: um único bloco dividido. */
export function StatStrip({ items }: { items: { label: string; value: string; tone?: 'neg' | 'pos' | 'muted' }[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-flow-col lg:auto-cols-fr bg-white border border-[#ece4db] rounded-2xl divide-[#f2ede7] lg:divide-x overflow-hidden">
      {items.map((it, i) => (
        <div key={it.label} className={cn('px-5 py-4', i % 2 === 1 && 'border-l border-[#f2ede7] lg:border-l-0', i >= 2 && 'border-t border-[#f2ede7] lg:border-t-0')}>
          <p className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide">{it.label}</p>
          <p className={cn(
            'font-fraunces text-[20px] lg:text-[22px] leading-tight mt-1',
            it.tone === 'neg' ? 'text-[#dc2626]' : it.tone === 'pos' ? 'text-[#16a34a]' : it.tone === 'muted' ? 'text-[#6b7280]' : 'text-[#3c4a3c]',
          )}>
            {it.value}
          </p>
        </div>
      ))}
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
        <div className="flex items-end justify-between gap-3">
          <div>
            {title && <h2 className="font-fraunces text-[18px] text-[#3c4a3c]">{title}</h2>}
            {description && <p className="text-[13px] text-[#6b7280] mt-0.5">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('bg-white rounded-2xl border border-[#ece4db]', className)}>{children}</div>
}
