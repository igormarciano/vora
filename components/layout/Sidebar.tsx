'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Wallet, TrendingUp, History, Settings, LogOut } from 'lucide-react'
import { Logo } from './Logo'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/controle', label: 'Controle', icon: Wallet },
  { href: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-[220px] shrink-0 bg-white border-r border-[#ece4db] flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-[#ece4db]">
        <Logo />
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-colors"
              style={{
                backgroundColor: active ? '#dce6dc' : 'transparent',
                color: active ? '#3c4a3c' : '#6b7280',
                fontWeight: active ? 500 : 400,
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#ece4db]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-[#6b7280] hover:text-[#3c4a3c] hover:bg-[#f2ede7] transition-colors w-full"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}
