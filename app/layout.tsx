import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK'],
})

export const metadata: Metadata = {
  title: 'Vora | Veja seu mês antes dele acontecer',
  description: 'Clareza financeira real. Sem planilha, sem surpresa, sem culpa.',
  icons: { icon: [{ url: '/images/login-logo-icon.svg', type: 'image/svg+xml' }] },
  appleWebApp: { capable: true, title: 'Vora', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f4f0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full antialiased bg-canvas text-ink">
        {children}
        <Toaster position="top-center" toastOptions={{ className: '!rounded-2xl' }} />
      </body>
    </html>
  )
}
