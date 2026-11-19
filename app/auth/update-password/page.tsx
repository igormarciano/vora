'use client'

import { useState } from 'react'
import { AuthShell, AuthHeading } from '@/components/auth/AuthShell'
import { Button, Field, PasswordField } from '@/components/vora/ui'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      toast.error('Não foi possível atualizar a senha. O link pode ter expirado.')
      return
    }
    toast.success('Senha atualizada com sucesso!')
    router.refresh()
    router.push('/dashboard')
  }

  return (
    <AuthShell>
      <AuthHeading title="Crie uma nova senha" subtitle="Escolha uma senha com pelo menos 6 caracteres." />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nova senha">
          <PasswordField autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nova senha" minLength={6} required />
        </Field>
        <Field label="Confirmar senha">
          <PasswordField autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repita a senha" minLength={6} required />
        </Field>
        <Button type="submit" size="lg" block loading={loading} className="mt-2">Salvar nova senha</Button>
      </form>
    </AuthShell>
  )
}
