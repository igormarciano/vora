import { Sidebar, TabBar } from './Sidebar'

/**
 * Desktop (lg+): sidebar translúcida fixa à esquerda.
 * Mobile: sem barra superior (cada página tem título grande) e tab bar inferior.
 */
export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas lg:flex">
      <div className="hidden lg:block sticky top-0 h-dvh shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 pb-[calc(58px+env(safe-area-inset-bottom)+16px)] lg:pb-0">
        {children}
      </main>
      <TabBar />
    </div>
  )
}
