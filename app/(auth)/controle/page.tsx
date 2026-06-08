import { redirect } from 'next/navigation'

// Rota antiga "/controle" foi dividida em "/receitas" e "/gastos" (Grupo 2 — refatoração estrutural).
// Mantemos este redirect para não quebrar links/favoritos antigos.
export default function ControlePage() {
  redirect('/receitas')
}
