'use client'

import Link from 'next/link'
import { ArrowLeft, CreditCard } from 'lucide-react'
import type { Cartao, CustomCategory, GastoFixo, GastoVariavel } from '@/types'
import {
  alternarPagoGastoFixo, alternarPagoGastoVariavel, deletarGastoFixo, deletarGastoVariavel,
} from '@/app/(auth)/controle/actions'
import { GastoCard } from '@/components/gastos/GastoCard'
import { FormGastoFixo } from '@/components/controle/FormGastoFixo'
import { FormGastoVariavel } from '@/components/controle/FormGastoVariavel'
import { ModalDelete } from '@/components/controle/ModalDelete'
import { Page, PageHeader, Panel, Section, StatStrip } from '@/components/layout/Page'
import { MonthNavigator } from '@/components/layout/MonthNavigator'
import { formatCurrency, corComOpacidade, getMesReferencia } from '@/lib/engine'
import { valorNoMes } from '@/lib/engine/mes'

interface CartaoDetalheClientProps {
  mes: string
  cartao: Cartao
  cartoes: Cartao[]
  customCategories: CustomCategory[]
  fixos: GastoFixo[]
  compras: GastoVariavel[]
  totalFixos: number
  totalCompras: number
  parceladoFuturo: number
}

/**
 * Fatura de um cartão no mês: contas fixas vinculadas + compras à vista + parcelas
 * ativas. Antes as contas fixas vinculadas não apareciam ao olhar o cartão pela
 * tela de Gastos (o agrupamento "por cartão" só considerava variáveis).
 */
export function CartaoDetalheClient({
  mes, cartao, cartoes, customCategories, fixos, compras, totalFixos, totalCompras, parceladoFuturo,
}: CartaoDetalheClientProps) {
  const cor = cartao.color ?? '#8faf8f'
  const total = totalFixos + totalCompras
  const disponivel = cartao.limite != null ? cartao.limite - total - parceladoFuturo : null
  const voltar = mes === getMesReferencia() ? '/cartoes' : `/cartoes?mes=${mes}`

  return (
    <Page>
      <Link href={voltar} className="inline-flex items-center gap-1.5 text-[13px] text-[#6b7280] hover:text-[#3c4a3c] transition-colors mb-4">
        <ArrowLeft size={15} /> Todos os cartões
      </Link>

      <PageHeader
        title={cartao.nome}
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cor }} /> Fatura do cartão
          </span>
        }
        actions={<MonthNavigator mes={mes} />}
      />

      <div className="mb-8">
        <StatStrip
          items={[
            { label: 'Fatura do mês', value: formatCurrency(total) },
            { label: 'Contas fixas', value: formatCurrency(totalFixos) },
            { label: 'Compras e parcelas', value: formatCurrency(totalCompras) },
            disponivel != null
              ? { label: 'Limite disponível', value: formatCurrency(disponivel), tone: disponivel < 0 ? 'neg' : undefined }
              : { label: 'Parcelas futuras', value: formatCurrency(parceladoFuturo), tone: 'muted' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Section
          title="Contas fixas no cartão"
          description="Recorrências que você vinculou a este cartão ao cadastrar o gasto fixo."
        >
          <Panel className="px-5">
            {fixos.length === 0 ? (
              <Empty text="Nenhuma conta fixa vinculada a este cartão neste mês." />
            ) : (
              fixos.map(f => (
                <GastoCard
                  key={f.id}
                  nome={f.nome}
                  valor={formatCurrency(f.valor)}
                  badge={f.categoria}
                  sub={[f.vencimento ? `Vence dia ${f.vencimento}` : null, f.recorrente ? 'Recorrente' : null].filter(Boolean).join(' · ') || undefined}
                  description={f.description}
                  isPaid={f.is_paid}
                  onTogglePaid={paid => alternarPagoGastoFixo(f.id, paid, mes)}
                  editButton={<FormGastoFixo item={f} cartoes={cartoes} customCategories={customCategories} onSuccess={() => {}} />}
                  deleteButton={<ModalDelete label={f.nome} onConfirm={() => deletarGastoFixo(f.id)} />}
                />
              ))
            )}
          </Panel>
        </Section>

        <Section title="Compras e parcelas" description="Compras à vista do mês e parcelas que caem nesta fatura.">
          <Panel className="px-5">
            {compras.length === 0 ? (
              <Empty text="Nenhuma compra neste cartão neste mês." />
            ) : (
              compras.map(c => (
                <GastoCard
                  key={c.id}
                  nome={c.nome}
                  valor={c.parcelado ? `${formatCurrency(valorNoMes(c))}/mês` : formatCurrency(c.valor)}
                  badge={c.categoria}
                  sub={c.parcelado && c.total_parcelas
                    ? `Parcela ${c.parcela_atual}/${c.total_parcelas} · total ${formatCurrency(c.valor)}`
                    : 'À vista'}
                  description={c.description}
                  isPaid={c.is_paid}
                  onTogglePaid={paid => alternarPagoGastoVariavel(c.id, paid, mes)}
                  editButton={<FormGastoVariavel item={c} cartoes={cartoes} customCategories={customCategories} onSuccess={() => {}} />}
                  deleteButton={<ModalDelete label={c.nome} onConfirm={() => deletarGastoVariavel(c.id)} />}
                />
              ))
            )}
          </Panel>
        </Section>
      </div>

      {total === 0 && (
        <div
          className="mt-6 rounded-2xl border px-5 py-4 flex items-center gap-3 text-[13px] text-[#4f604f]"
          style={{ backgroundColor: corComOpacidade(cor, 0.08), borderColor: corComOpacidade(cor, 0.25) }}
        >
          <CreditCard size={16} className="shrink-0" />
          Para uma conta fixa aparecer aqui, edite o gasto fixo em Gastos e escolha este cartão em &quot;Vinculado a cartão&quot;.
        </div>
      )}
    </Page>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-[14px] text-[#9ca3af] py-8 text-center">{text}</p>
}
