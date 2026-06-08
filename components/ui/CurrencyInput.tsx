'use client'

import { NumericFormat } from 'react-number-format'

interface CurrencyInputProps {
  value: number | null
  onValueChange: (value: number | null) => void
  placeholder?: string
  required?: boolean
  className?: string
  id?: string
}

/**
 * Input com máscara monetária brasileira (R$ 1.125,00).
 * Mantém o valor numérico (float) — a formatação é apenas de exibição.
 */
export function CurrencyInput({
  value,
  onValueChange,
  placeholder = 'R$ 0,00',
  required,
  className,
  id,
}: CurrencyInputProps) {
  return (
    <NumericFormat
      id={id}
      value={value ?? ''}
      onValueChange={(values) => {
        onValueChange(values.floatValue ?? null)
      }}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      prefix="R$ "
      allowNegative={false}
      placeholder={placeholder}
      required={required}
      inputMode="decimal"
      className={className ?? inputCls}
    />
  )
}

const inputCls = 'border border-[#ece4db] rounded-lg px-3 py-2.5 text-[15px] text-[#3c4a3c] outline-none focus:border-[#8faf8f] bg-white transition-colors w-full'
