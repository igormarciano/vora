import Image from 'next/image'
import Link from 'next/link'

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <Image
        src="/images/login-logo-icon.png"
        alt="Vora icon"
        width={24}
        height={24}
        className="object-contain flex-shrink-0"
      />
      {!collapsed && (
        <Image
          src="/images/vora-wordmark.png"
          alt="VORA"
          width={68}
          height={18}
          className="object-contain"
        />
      )}
    </Link>
  )
}
