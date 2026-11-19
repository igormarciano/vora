import { redirect } from 'next/navigation'

// O onboarding agora é um fluxo único em /setup ("Monte seu mês"),
// que começa com a tela de boas-vindas. Mantido para links antigos.
export default function OnboardingPage() {
  redirect('/setup')
}
