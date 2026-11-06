'use client'

import type { Receita } from '@/types'
import { deletarReceita } from '@/app/(auth)/controle/actions'
import { FormReceita } from '@/components/controle/FormReceita'
import { ModalDelete } from '@/components/controle/ModalDelete'
import { Page, PageHeader, Panel, StatStrip } from '@/components/layout/Page'
import { formatCurrency, getMesReferencia, formatarMesReferencia } from '@/lib/engine'

interface ReceitasClientProps {
  receitas: Receita[]
}

const TIPO_LABEL: Record<Receita['tipo'], string> = {
  salario: 'Salário',
  renda_extra: 'Renda extra',
  outros: 'Outros',
}

export function ReceitasClient({ receitas }: ReceitasClientProps) {
  const total = receitas.reduce((s, r) => s + r.valor, 0)
  const recorrente = receitas.filter(r => r.recorrente).reduce((s, r) => s + r.valor, 0)

  return (
    <Page>
      <PageHeader
        eyebrow={formatarMesReferencia(getMesReferencia())}
        title="Receitas"
        description="Tudo o que entra no mês. Receitas recorrentes se repetem sozinhas nos próximos meses."
        actions={<FormReceita variant="primary" onSuccess={() => {}} />}
      />

      <div className="mb-6">
        <StatStrip
          items={[
            { label: 'Total do mês', value: formatCurrency(total) },
            { label: 'Recorrente', value: formatCurrency(recorrente) },
            { label: 'Pontual', value: formatCurrency(total - recorrente), tone: 'muted' },
            { label: 'Fontes', value: String(receitas.length), tone: 'muted' },
          ]}
        />
      </div>

      <Panel className="px-5">
        {receitas.length === 0 ? (
          <p className="text-[14px] text-[#9ca3af] py-10 text-center">Nenhuma receita cadastrada ainda.</p>
        ) : (
          receitas.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-3.5 border-b border-[#f2ede7] last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-medium text-[#3c4a3c] truncate">{item.nome}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f2ede7] text-[#6b7280]">
                    {item.tipo === 'outros' ? (item.tipo_custom || 'Outros') : TIPO_LABEL[item.tipo]}
                  </span>
                </div>
                <p className="text-[12px] text-[#9ca3af] mt-0.5">
                  {item.recorrente
                    ? item.duracao_meses ? `Recorrente por ${item.duracao_meses} meses` : 'Recorrente'
                    : 'Só este mês'}
                </p>
              </div>
              <span className="text-[15px] font-medium text-[#3c4a3c] shrink-0">{formatCurrency(item.valor)}</span>
              <div className="flex items-center gap-0.5 shrink-0">
                <FormReceita item={item} onSuccess={() => {}} />
                <ModalDelete label={item.nome} onConfirm={() => deletarReceita(item.id)} />
              </div>
            </div>
          ))
        )}
      </Panel>
    </Page>
  )
}
