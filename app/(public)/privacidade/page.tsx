import type { Metadata } from 'next'
import { LegalPage, CONTATO_EMAIL } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Política de Privacidade · Vora',
  description: 'Como a Vora coleta, usa e protege seus dados.',
}

export default function PrivacidadePage() {
  const email = <a href={`mailto:${CONTATO_EMAIL}`}>{CONTATO_EMAIL}</a>
  return (
    <LegalPage
      title="Política de Privacidade"
      intro="A Vora existe para te dar clareza sobre o seu dinheiro. Para isso, guardamos as informações financeiras que você cadastra. Aqui explicamos o que coletamos, por que, com quem compartilhamos e como você controla seus dados, de acordo com a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018)."
    >
      <section>
        <h2>1. Quais dados coletamos</h2>
        <ul>
          <li><strong>Dados de conta:</strong> nome, e-mail e senha (guardada de forma criptografada). Se você entrar com o Google, recebemos nome, e-mail e foto de perfil da sua conta Google.</li>
          <li><strong>Dados financeiros que você informa:</strong> receitas, gastos fixos e variáveis, cartões (nome, cor e limite), parcelamentos, investimentos, categorias e descrições. A Vora não se conecta ao seu banco e não pede senhas bancárias nem número de cartão.</li>
          <li><strong>Preferências:</strong> meta de economia e configurações do app.</li>
          <li><strong>Dados técnicos:</strong> registros de acesso (data, hora e endereço IP), necessários para segurança e para cumprir o Marco Civil da Internet.</li>
        </ul>
      </section>

      <section>
        <h2>2. Para que usamos</h2>
        <ul>
          <li>Criar e manter sua conta e permitir o login.</li>
          <li>Calcular e mostrar seu mês: totais, projeções, faturas de cartão, onde cortar e evolução do patrimônio.</li>
          <li>Gerar a análise mensal automática, quando disponível na sua conta.</li>
          <li>Enviar e-mails essenciais, como confirmação de cadastro e recuperação de senha. Não enviamos propaganda sem o seu consentimento.</li>
          <li>Proteger o serviço contra fraude e uso indevido.</li>
        </ul>
        <p>As bases legais são a execução do contrato com você (art. 7º, V da LGPD), o legítimo interesse para segurança e melhoria do serviço (art. 7º, IX) e o cumprimento de obrigação legal (art. 7º, II).</p>
      </section>

      <section>
        <h2>3. Com quem compartilhamos</h2>
        <p>Não vendemos seus dados. Compartilhamos apenas com fornecedores necessários para o serviço funcionar, que tratam os dados em nosso nome:</p>
        <ul>
          <li><strong>Supabase:</strong> banco de dados e autenticação.</li>
          <li><strong>Vercel:</strong> hospedagem do site.</li>
          <li><strong>Resend:</strong> envio de e-mails transacionais.</li>
          <li><strong>OpenAI:</strong> geração da análise mensal. Enviamos totais por categoria e nomes dos lançamentos do mês, sem seu nome, e-mail ou outros dados de identificação.</li>
          <li><strong>Google:</strong> apenas se você escolher entrar com a sua conta Google.</li>
        </ul>
        <p>Alguns desses fornecedores processam dados fora do Brasil. Nesses casos, a transferência segue o art. 33 da LGPD, com fornecedores que adotam padrões de proteção compatíveis. Também podemos compartilhar dados quando exigido por lei ou ordem judicial.</p>
      </section>

      <section>
        <h2>4. Por quanto tempo guardamos</h2>
        <p>Mantemos seus dados enquanto sua conta estiver ativa. Se você excluir a conta, apagamos seus dados financeiros e de perfil em até 30 dias. Registros de acesso são guardados por 6 meses, como exige o Marco Civil da Internet.</p>
      </section>

      <section>
        <h2>5. Como protegemos</h2>
        <p>Usamos conexão criptografada (HTTPS), senhas com hash e regras de acesso no banco de dados que garantem que cada pessoa veja apenas os próprios dados. Nenhum sistema é 100% seguro; se houver um incidente que possa te afetar, vamos te avisar e comunicar a ANPD conforme a lei.</p>
      </section>

      <section>
        <h2>6. Seus direitos</h2>
        <p>Pela LGPD você pode, a qualquer momento:</p>
        <ul>
          <li>Confirmar se tratamos seus dados e acessar uma cópia deles.</li>
          <li>Corrigir dados incompletos ou desatualizados (a maioria você edita direto no app).</li>
          <li>Pedir a exclusão da conta e dos dados.</li>
          <li>Pedir a portabilidade dos dados.</li>
          <li>Saber com quem compartilhamos e revogar consentimentos, como o login pelo Google.</li>
        </ul>
        <p>Para exercer qualquer direito, escreva para {email}. Respondemos em até 15 dias.</p>
      </section>

      <section>
        <h2>7. Cookies</h2>
        <p>Usamos apenas cookies essenciais para manter você conectado. Não usamos cookies de publicidade.</p>
      </section>

      <section>
        <h2>8. Menores de idade</h2>
        <p>A Vora é destinada a maiores de 18 anos. Não coletamos intencionalmente dados de menores.</p>
      </section>

      <section>
        <h2>9. Mudanças nesta política</h2>
        <p>Se mudarmos algo relevante, avisaremos no app ou por e-mail antes de a mudança valer. A data no topo indica a última atualização.</p>
      </section>

      <section>
        <h2>10. Contato</h2>
        <p>Dúvidas sobre privacidade: {email}.</p>
      </section>
    </LegalPage>
  )
}
