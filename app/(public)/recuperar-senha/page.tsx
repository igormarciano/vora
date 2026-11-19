import { redirect } from 'next/navigation'

// A recuperação de senha agora fica dentro de /login (modo "Esqueci a senha").
export default function RecuperarSenhaPage() {
  redirect('/login')
}
