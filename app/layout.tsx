import type { Metadata } from 'next'
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
  title: 'Vora — Veja seu mês antes dele acontecer',
  description: 'Clareza financeira real. Sem planilha, sem surpresa, sem culpa.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
