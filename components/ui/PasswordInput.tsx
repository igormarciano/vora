'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string
}

/**
 * Input de senha reutilizável com toggle de mostrar/ocultar (ícone de olho).
 * Mantém a mesma aparência dos inputs padrão da Vora, apenas adicionando
 * o botão de alternância à direita.
 */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className={
          className ??
          'w-full border border-[#ece4db] bg-white text-[#3c4a3c] px-4 py-3 pr-11 text-[16px] outline-none focus:border-[#8faf8f] transition-colors'
        }
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#3c4a3c] transition-colors"
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  )
}
