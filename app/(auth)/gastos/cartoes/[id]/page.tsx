import { redirect } from 'next/navigation'

// A fatura do cartão foi movida para a aba própria "/cartoes/[id]".
// Mantido para não quebrar links antigos.
export default async function CartaoLegacyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/cartoes/${id}`)
}
