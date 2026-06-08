'use client'

import type { Receita } from '@/types'
import { deletarReceita } from '@/app/(auth)/controle/actions'
import { FormReceita } from '@/components/controle/FormReceita'
import { ModalDelete } from '@/components/controle/ModalDelete'
import { formatCurrency } from '@/lib/engine'

interface ReceitasClientProps {
  receitas: Receita[]
}

export function ReceitasClient({ receitas }: ReceitasClientProps) {
  const total = receitas.reduce((s, r) => s + r.valor, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-fraunces text-[32px] text-[#3c4a3c]">Receitas</h1>
        <FormReceita onSuccess={() => {}} />
      </div>

      {/* Total */}
      <div className="bg-[#dce6dc] rounded-2xl px-5 py-4 mb-5 flex items-center justify-between">
        <span className="text-[14px] text-[#4f604f] font-medium">Total de receitas</span>
        <span className="font-fraunces text-[20px] text-[#3c4a3c]">{formatCurrency(total)}</span>
      </div>

      <div className="bg-white rounded-2xl border border-[#ece4db] px-4">
        {receitas.length === 0 ? (
          <p className="text-[14px] text-[#9ca3af] py-6 text-center">Nenhuma receita cadastrada ainda.</p>
        ) : (
          receitas.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-3.5 border-b border-[#f2ede7] last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-medium text-[#3c4a3c] truncate">{item.nome}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f2ede7] text-[#6b7280]">
                    {item.tipo === 'salario' ? 'Salário' : item.tipo === 'renda_extra' ? 'Renda extra' : (item.tipo_custom || 'Outros')}
                  </span>
                </div>
                <p className="text-[12px] text-[#9ca3af] mt-0.5">{item.recorrente ? 'Recorrente' : 'Não recorrente'}</p>
              </div>
              <span className="text-[15px] font-medium text-[#3c4a3c] shrink-0">{formatCurrency(item.valor)}</span>
              <div className="flex items-center gap-0.5 shrink-0">
                <FormReceita item={item} onSuccess={() => {}} />
                <ModalDelete label={item.nome} onConfirm={() => deletarReceita(item.id)} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
