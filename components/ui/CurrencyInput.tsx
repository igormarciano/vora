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

const inputCls = 'h-12 bg-white border border-hairline rounded-[14px] px-4 text-[16px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_4px_rgb(95_138_98/0.14)] transition w-full'
