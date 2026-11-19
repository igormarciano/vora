'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutGrid, Wallet, ReceiptText, CreditCard, Scissors, TrendingUp, History,
  Settings, LogOut, MoreHorizontal, X, type LucideIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { BrandMark } from '@/components/vora/ui'
import { cn } from '@/lib/utils'

type NavItem = { href: string; label: string; icon: LucideIcon }

// Agrupado por intenção: o mês corrente e o planejamento.
export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Meu mês',
    items: [
      { href: '/dashboard', label: 'Visão geral', icon: LayoutGrid },
      { href: '/receitas',  label: 'Receitas',    icon: Wallet },
      { href: '/gastos',    label: 'Gastos',      icon: ReceiptText },
      { href: '/cartoes',   label: 'Cartões',     icon: CreditCard },
    ],
  },
  {
    label: 'Planejar',
    items: [
      { href: '/analise',       label: 'Onde cortar',   icon: Scissors },
      { href: '/investimentos', label: 'Investimentos', icon: TrendingUp },
      { href: '/historico',     label: 'Histórico',     icon: History },
    ],
  },
]

function useIsActive() {
  const pathname = usePathname()
  return (href: string) => pathname === href || pathname.startsWith(href + '/')
}

function useLogout() {
  const router = useRouter()
  return async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/login')
    router.refresh()
  }
}

// ── Desktop ────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const isActive = useIsActive()
  const logout = useLogout()

  return (
    <aside className="glass h-dvh w-[248px] flex flex-col border-r border-hairline">
      <div className="h-[72px] px-6 flex items-center">
        <Link href="/dashboard"><BrandMark size={26} /></Link>
      </div>

      <nav className="flex-1 px-3 pt-2 flex flex-col gap-6 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <span className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{group.label}</span>
            {group.items.map(item => <SideLink key={item.href} item={item} active={isActive(item.href)} />)}
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 flex flex-col gap-0.5 border-t border-hairline">
        <SideLink item={{ href: '/configuracoes', label: 'Configurações', icon: Settings }} active={isActive('/configuracoes')} />
        <button onClick={logout} className="flex items-center gap-3 h-10 px-3 rounded-[10px] text-[14px] text-ink-2 hover:bg-fill hover:text-ink transition-colors">
          <LogOut size={18} strokeWidth={1.9} /> Sair
        </button>
      </div>
    </aside>
  )
}

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 h-10 px-3 rounded-[10px] text-[14px] transition-colors',
        active ? 'bg-white text-ink font-semibold shadow-[0_1px_2px_rgb(0_0_0/0.06)]' : 'text-ink-2 hover:bg-fill hover:text-ink',
      )}
    >
      <Icon size={18} strokeWidth={active ? 2.2 : 1.9} className={active ? 'text-brand' : ''} />
      {item.label}
    </Link>
  )
}

// ── Mobile: tab bar inferior + folha "Mais" ────────────────────────────────────

const TABS: NavItem[] = [
  { href: '/dashboard', label: 'Início', icon: LayoutGrid },
  { href: '/gastos', label: 'Gastos', icon: ReceiptText },
  { href: '/cartoes', label: 'Cartões', icon: CreditCard },
  { href: '/analise', label: 'Cortar', icon: Scissors },
]

const MAIS: NavItem[] = [
  { href: '/receitas', label: 'Receitas', icon: Wallet },
  { href: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function TabBar() {
  const isActive = useIsActive()
  const logout = useLogout()
  const [maisAberto, setMaisAberto] = useState(false)
  const maisAtivo = MAIS.some(i => isActive(i.href))

  return (
    <>
      <nav className="glass fixed bottom-0 inset-x-0 z-40 border-t border-hairline pb-safe lg:hidden">
        <div className="grid grid-cols-5 h-[58px]">
          {TABS.map(item => <TabLink key={item.href} item={item} active={isActive(item.href)} />)}
          <button onClick={() => setMaisAberto(true)} className={cn('flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium', maisAtivo ? 'text-brand-strong' : 'text-ink-3')}>
            <MoreHorizontal size={23} strokeWidth={maisAtivo ? 2.3 : 1.9} />
            Mais
          </button>
        </div>
      </nav>

      {maisAberto && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/25 animate-in fade-in" onClick={() => setMaisAberto(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-canvas rounded-t-[28px] p-4 pb-[max(env(safe-area-inset-bottom),16px)] animate-in slide-in-from-bottom duration-300">
            <div className="mx-auto mb-3 w-9 h-1.5 rounded-full bg-[#d5d9d3]" />
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-[17px] font-semibold text-ink">Mais</span>
              <button onClick={() => setMaisAberto(false)} className="w-8 h-8 rounded-full bg-fill flex items-center justify-center text-ink-2" aria-label="Fechar"><X size={16} /></button>
            </div>
            <div className="bg-surface rounded-[18px] divide-y divide-[rgb(60_74_60/0.08)] overflow-hidden">
              {MAIS.map(item => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMaisAberto(false)} className="flex items-center gap-3.5 h-[52px] px-4 text-[16px] text-ink active:bg-fill">
                    <span className="w-8 h-8 rounded-[9px] bg-brand-soft text-brand-strong flex items-center justify-center"><Icon size={17} /></span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
            <button onClick={logout} className="mt-3 w-full h-[52px] rounded-[18px] bg-surface text-[16px] text-negative font-medium active:bg-fill">Sair</button>
          </div>
        </div>
      )}
    </>
  )
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link href={item.href} className={cn('flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium', active ? 'text-brand-strong' : 'text-ink-3')}>
      <Icon size={23} strokeWidth={active ? 2.3 : 1.9} />
      {item.label}
    </Link>
  )
}
