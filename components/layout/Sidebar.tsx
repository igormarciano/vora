'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, PiggyBank, Receipt, TrendingUp, History,
  Settings, LogOut, ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { Logo } from './Logo'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard',      label: 'Visão geral',   icon: LayoutDashboard },
  { href: '/receitas',       label: 'Receitas',       icon: PiggyBank },
  { href: '/gastos',         label: 'Gastos',         icon: Receipt },
  { href: '/investimentos',  label: 'Investimentos',  icon: TrendingUp },
  { href: '/historico',      label: 'Histórico',      icon: History },
  { href: '/configuracoes',  label: 'Configurações',  icon: Settings },
]

interface SidebarProps {
  collapsed?: boolean
  onCollapse?: () => void
  onMobileClose?: () => void
}

export function Sidebar({ collapsed = false, onCollapse, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/login')
    router.refresh()
  }

  const width = collapsed ? 'w-[68px]' : 'w-[220px]'

  return (
    <aside
      className={`${width} bg-white border-r border-[#ece4db] flex flex-col h-screen transition-all duration-200 overflow-hidden`}
    >
      {/* Header */}
      <div className={`flex items-center h-[65px] border-b border-[#ece4db] shrink-0 ${collapsed ? 'justify-center px-0' : 'px-5 justify-between'}`}>
        {!collapsed && <Logo />}

        {/* Botão fechar mobile */}
        {!collapsed && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded text-[#6b7280] hover:text-[#3c4a3c] transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {/* Botão colapsar desktop */}
        {onCollapse && (
          <button
            onClick={onCollapse}
            className={`hidden lg:flex items-center justify-center w-7 h-7 rounded text-[#6b7280] hover:text-[#3c4a3c] hover:bg-[#f2ede7] transition-colors ${collapsed ? '' : ''}`}
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}

        {/* Logo quando collapsed */}
        {collapsed && (
          <span className="text-[20px]">🌿</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-lg text-[14px] transition-colors ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'}`}
              style={{
                backgroundColor: active ? '#dce6dc' : 'transparent',
                color: active ? '#3c4a3c' : '#6b7280',
                fontWeight: active ? 500 : 400,
              }}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-[#ece4db] shrink-0">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sair' : undefined}
          className={`flex items-center gap-3 rounded-lg text-[14px] text-[#6b7280] hover:text-[#3c4a3c] hover:bg-[#f2ede7] transition-colors w-full ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'}`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
