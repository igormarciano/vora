import Image from 'next/image'
import Link from 'next/link'

export const CONTATO_EMAIL = 'contato@vora.app.br'
export const ATUALIZADO_EM = '19 de novembro de 2026'

/** Layout das páginas legais públicas (Privacidade e Termos). */
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      <header className="border-b border-[#ece4db] bg-white">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="Vora">
            <Image src="/images/login-logo-icon.svg" alt="" width={24} height={24} />
            <span className="font-fraunces text-[20px] text-[#3c4a3c]">Vora</span>
          </Link>
          <nav className="flex gap-5 text-[13px] text-[#6b7280]">
            <Link href="/privacidade" className="hover:text-[#3c4a3c]">Privacidade</Link>
            <Link href="/termos" className="hover:text-[#3c4a3c]">Termos</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 py-10 lg:py-14">
        <p className="text-[12px] uppercase tracking-wide text-[#9ca3af] mb-2">Atualizado em {ATUALIZADO_EM}</p>
        <h1 className="font-fraunces text-[32px] lg:text-[40px] text-[#3c4a3c] leading-tight mb-4">{title}</h1>
        <p className="text-[16px] text-[#4f604f] leading-relaxed mb-10">{intro}</p>
        <div className="legal flex flex-col gap-8 text-[15px] text-[#4b5563] leading-relaxed">
          {children}
        </div>
      </main>
      <footer className="border-t border-[#ece4db] py-6 text-center text-[13px] text-[#9ca3af]">
        Vora · <a href={`mailto:${CONTATO_EMAIL}`} className="underline">{CONTATO_EMAIL}</a>
      </footer>
      <style>{`
        .legal h2 { font-family: var(--font-fraunces), serif; font-size: 21px; color: #3c4a3c; margin-bottom: 8px; }
        .legal ul { list-style: disc; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }
        .legal p + p, .legal ul + p, .legal p + ul { margin-top: 8px; }
        .legal strong { color: #3c4a3c; font-weight: 600; }
        .legal a { color: #4f604f; text-decoration: underline; }
      `}</style>
    </div>
  )
}
