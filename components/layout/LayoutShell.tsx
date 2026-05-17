'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Logo } from './Logo'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#f8fafb]">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — mobile: drawer fixo, desktop: sticky */}
      <div
        className={[
          'fixed top-0 left-0 h-screen z-50 transition-transform duration-300',
          'lg:sticky lg:translate-x-0 lg:z-auto lg:shrink-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <Sidebar
          collapsed={collapsed}
          onCollapse={() => setCollapsed(v => !v)}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-white border-b border-[#ece4db]">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-[#6b7280] hover:bg-[#f2ede7] transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <Logo />
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
