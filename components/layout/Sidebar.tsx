'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, PiggyBank, Receipt, TrendingUp, History, CreditCard, Scissors,
  Settings, LogOut, ChevronLeft, ChevronRight, X, type LucideIcon,
} from 'lucide-react'
import { Logo } from './Logo'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Agrupado por intenção: o mês corrente (o que entra e sai) e o planejamento
// (o que cortar, investir e o que já passou). Configurações fica no rodapé.
const navGroups: { label: string; items: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    label: 'Meu mês',
    items: [
      { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
      { href: '/receitas',  label: 'Receitas',    icon: PiggyBank },
      { href: '/gastos',    label: 'Gastos',      icon: Receipt },
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

interface SidebarProps {
  collapsed?: boolean
  onCollapse?: () => void
  onMobileClose?: () => void
}

interface NavLinkProps {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  collapsed: boolean
  onClick?: () => void
}

function NavLink({ href, label, icon: Icon, active, collapsed, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={[
        'flex items-center gap-3 rounded-lg text-[14px] transition-colors',
        collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2',
        active ? 'bg-[#dce6dc] text-[#3c4a3c] font-medium' : 'text-[#6b7280] hover:text-[#3c4a3c] hover:bg-[#f6f3ee]',
      ].join(' ')}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

export function Sidebar({ collapsed = false, onCollapse, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/login')
    router.refresh()
  }

  const width = collapsed ? 'w-[68px]' : 'w-[232px]'

  return (
    <aside
      className={`${width} bg-white border-r border-[#ece4db] flex flex-col h-screen transition-all duration-200 overflow-hidden`}
    >
      {/* Header */}
      <div className={`flex items-center h-[65px] shrink-0 ${collapsed ? 'justify-center px-0' : 'px-5 justify-between'}`}>
        {!collapsed && <Logo />}

        {!collapsed && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded text-[#6b7280] hover:text-[#3c4a3c] transition-colors"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        )}

        {onCollapse && (
          <button
            onClick={onCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded text-[#9ca3af] hover:text-[#3c4a3c] hover:bg-[#f2ede7] transition-colors"
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-5 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label} className="flex flex-col gap-0.5">
            {!collapsed && (
              <span className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#9ca3af]">
                {group.label}
              </span>
            )}
            {group.items.map(item => (
              <NavLink key={item.href} {...item} active={isActive(item.href)} collapsed={collapsed} onClick={onMobileClose} />
            ))}
          </div>
        ))}
      </nav>

      {/* Rodapé */}
      <div className="px-3 py-3 border-t border-[#ece4db] shrink-0 flex flex-col gap-0.5">
        <NavLink
          href="/configuracoes" label="Configurações" icon={Settings}
          active={isActive('/configuracoes')} collapsed={collapsed} onClick={onMobileClose}
        />
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sair' : undefined}
          className={`flex items-center gap-3 rounded-lg text-[14px] text-[#6b7280] hover:text-[#3c4a3c] hover:bg-[#f6f3ee] transition-colors w-full ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'}`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
