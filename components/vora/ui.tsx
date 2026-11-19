'use client'

import Image from 'next/image'
import { forwardRef, useState } from 'react'
import { Eye, EyeOff, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Primitivos do redesign (linguagem Apple + identidade Vora).
 * Mantidos pequenos e sem dependências para servir mobile e desktop.
 */

// ── Marca ──────────────────────────────────────────────────────────────────────

export function BrandMark({ size = 28, withName = true, className }: { size?: number; withName?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image src="/images/login-logo-icon.svg" alt="" width={size} height={size} priority />
      {withName && <span className="font-fraunces text-[21px] leading-none tracking-tight text-brand-strong">Vora</span>}
    </span>
  )
}

// ── Botão ──────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'plain' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand-strong text-white hover:bg-[#2f3b2f] active:bg-[#263026] shadow-[0_1px_2px_rgb(0_0_0/0.12)]',
  secondary: 'bg-brand-soft text-brand-strong hover:bg-[#d6e2d5] active:bg-[#cbdaca]',
  ghost: 'bg-white text-ink border border-hairline hover:bg-surface-2 active:bg-fill',
  plain: 'text-brand hover:text-brand-strong',
  destructive: 'bg-[#fbe9e7] text-negative hover:bg-[#f7dcd8]',
}
const BTN_SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[14px] rounded-full gap-1.5',
  md: 'h-11 px-5 text-[15px] rounded-full gap-2',
  lg: 'h-[52px] px-6 text-[16px] rounded-full gap-2',
}

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  loading?: boolean
}>(function Button({ variant = 'primary', size = 'md', block, loading, className, children, disabled, ...rest }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium tracking-[-0.01em] transition-[background,transform,opacity] duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none',
        variant !== 'plain' && BTN_SIZE[size],
        variant === 'plain' && 'text-[15px] font-medium',
        BTN_VARIANT[variant],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
})

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('inline-block w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin', className)} aria-label="Carregando" />
}

// ── Campos ─────────────────────────────────────────────────────────────────────

const FIELD_BASE =
  'w-full h-12 rounded-[14px] bg-surface border border-hairline px-4 text-[16px] text-ink placeholder:text-ink-3 outline-none transition-[border,box-shadow] focus:border-brand focus:shadow-[0_0_0_4px_rgb(95_138_98/0.14)]'

export function Field({ label, hint, action, children, className }: {
  label?: string
  hint?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      {(label || action) && (
        <span className="flex items-center justify-between">
          {label && <span className="text-[13px] font-medium text-ink-2">{label}</span>}
          {action}
        </span>
      )}
      {children}
      {hint && <span className="text-[12px] text-ink-3">{hint}</span>}
    </label>
  )
}

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(FIELD_BASE, className)} {...rest} />
  },
)

export function PasswordField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className={cn(FIELD_BASE, 'pr-12', props.className)} />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-fill"
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

export function fieldClass(extra?: string) {
  return cn(FIELD_BASE, extra)
}

// ── Controle segmentado ────────────────────────────────────────────────────────

export function Segmented<T extends string>({ value, onChange, options, className, size = 'md' }: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: React.ReactNode }[]
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div role="tablist" className={cn('inline-flex p-[3px] rounded-[12px] bg-fill', className)}>
      {options.map(o => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'flex-1 rounded-[9px] font-medium transition-all whitespace-nowrap',
              size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-4 text-[14px]',
              active ? 'bg-white text-ink shadow-[0_1px_3px_rgb(0_0_0/0.1),0_1px_1px_rgb(0_0_0/0.04)]' : 'text-ink-2 hover:text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Chips selecionáveis ────────────────────────────────────────────────────────

export function Chip({ selected, onClick, children, icon, className }: {
  selected?: boolean
  onClick?: () => void
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-2 h-10 pl-3 pr-3.5 rounded-full border text-[14px] font-medium transition-all active:scale-[0.97]',
        selected
          ? 'bg-brand-strong border-brand-strong text-white'
          : 'bg-white border-hairline text-ink hover:border-[#c9d6c8]',
        className,
      )}
    >
      {icon}
      {children}
      {selected && <Check size={15} strokeWidth={2.5} />}
    </button>
  )
}

/** Cartão de opção grande (escolha única/múltipla no onboarding). */
export function OptionCard({ selected, onClick, title, description, icon, trailing }: {
  selected?: boolean
  onClick?: () => void
  title: string
  description?: string
  icon?: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'w-full text-left flex items-center gap-3.5 p-4 rounded-[18px] border bg-white transition-all active:scale-[0.99]',
        selected ? 'border-brand shadow-[0_0_0_3px_rgb(95_138_98/0.16)]' : 'border-hairline hover:border-[#c9d6c8]',
      )}
    >
      {icon && <span className="w-11 h-11 rounded-[13px] bg-sand flex items-center justify-center text-[22px] shrink-0">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-ink">{title}</span>
        {description && <span className="block text-[13px] text-ink-3 mt-0.5">{description}</span>}
      </span>
      {trailing ?? (
        <span className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          selected ? 'bg-brand border-brand text-white' : 'border-[#d5d9d3]',
        )}>
          {selected && <Check size={14} strokeWidth={3} />}
        </span>
      )}
    </button>
  )
}

// ── Listas agrupadas (estilo Ajustes do iOS) ───────────────────────────────────

export function Group({ title, footer, children, className, inset = true }: {
  title?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
  inset?: boolean
}) {
  return (
    <section className={cn('flex flex-col gap-2', className)}>
      {title && <h3 className="px-4 text-[13px] font-medium uppercase tracking-[0.04em] text-ink-3">{title}</h3>}
      <div className={cn('bg-surface overflow-hidden divide-y divide-[rgb(60_74_60/0.08)]', inset ? 'rounded-[18px] shadow-[var(--shadow-card)]' : 'border-y border-hairline')}>
        {children}
      </div>
      {footer && <p className="px-4 text-[12px] text-ink-3">{footer}</p>}
    </section>
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('bg-surface rounded-[22px] shadow-[var(--shadow-card)]', className)}>{children}</div>
}

/** Barra de progresso fina. */
export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1 rounded-full bg-fill overflow-hidden', className)}>
      <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}

/** Separador "ou" para login social. */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-[12px] text-ink-3">
      <span className="h-px flex-1 bg-hairline" /> ou <span className="h-px flex-1 bg-hairline" />
    </div>
  )
}
