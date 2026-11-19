import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, CONTATO_EMAIL } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Termos de Serviço · Vora',
  description: 'Regras de uso da Vora.',
}

export default function TermosPage() {
  const email = <a href={`mailto:${CONTATO_EMAIL}`}>{CONTATO_EMAIL}</a>
  return (
    <LegalPage
      title="Termos de Serviço"
      intro="Estes termos explicam as regras para usar a Vora. Ao criar uma conta, você concorda com eles e com a nossa Política de Privacidade."
    >
      <section>
        <h2>1. O que é a Vora</h2>
        <p>A Vora é uma ferramenta de organização financeira pessoal. Você registra receitas, gastos, cartões e investimentos, e a Vora mostra totais, projeções e sugestões para te ajudar a decidir.</p>
      </section>

      <section>
        <h2>2. A Vora não é consultoria financeira</h2>
        <p>As informações, projeções, análises e sugestões da Vora, inclusive as geradas por inteligência artificial, são educativas e baseadas apenas nos dados que você cadastra. Elas não são recomendação de investimento nem consultoria financeira, contábil ou jurídica. Decisões financeiras são suas; para casos específicos, procure um profissional habilitado.</p>
      </section>

      <section>
        <h2>3. Sua conta</h2>
        <ul>
          <li>Você precisa ter 18 anos ou mais.</li>
          <li>Os dados de cadastro devem ser verdadeiros, e o e-mail precisa ser seu.</li>
          <li>Você é responsável por manter sua senha em segurança e pelo que for feito na sua conta. Se suspeitar de acesso indevido, troque a senha e nos avise.</li>
        </ul>
      </section>

      <section>
        <h2>4. Seus dados são seus</h2>
        <p>Tudo o que você cadastra continua sendo seu. Você é responsável pela exatidão das informações que lança, e os cálculos da Vora dependem delas. Como tratamos esses dados está descrito na <Link href="/privacidade">Política de Privacidade</Link>.</p>
      </section>

      <section>
        <h2>5. Uso permitido</h2>
        <p>Não é permitido:</p>
        <ul>
          <li>Usar a Vora para atividades ilegais ou para fraude.</li>
          <li>Tentar acessar dados de outras pessoas ou burlar a segurança do serviço.</li>
          <li>Fazer engenharia reversa, sobrecarregar ou automatizar acessos em massa.</li>
          <li>Revender ou redistribuir o serviço sem autorização.</li>
        </ul>
        <p>Podemos suspender ou encerrar contas que violem estes termos.</p>
      </section>

      <section>
        <h2>6. Disponibilidade e mudanças</h2>
        <p>Trabalhamos para manter a Vora no ar e correta, mas o serviço é oferecido no estado em que se encontra e pode ter interrupções, erros ou mudanças de funcionalidades. Podemos alterar, pausar ou encerrar partes do serviço; mudanças relevantes serão avisadas com antecedência razoável.</p>
      </section>

      <section>
        <h2>7. Preço</h2>
        <p>Atualmente o uso da Vora é gratuito. Se no futuro houver planos pagos, isso será comunicado antes e nada será cobrado sem a sua concordância expressa.</p>
      </section>

      <section>
        <h2>8. Limitação de responsabilidade</h2>
        <p>Na máxima extensão permitida pela lei, a Vora não se responsabiliza por perdas decorrentes de decisões tomadas com base nas informações do app, de dados cadastrados incorretamente ou de indisponibilidade temporária. Nada nestes termos afasta direitos garantidos pelo Código de Defesa do Consumidor.</p>
      </section>

      <section>
        <h2>9. Encerramento</h2>
        <p>Você pode parar de usar e pedir a exclusão da sua conta a qualquer momento, escrevendo para {email}. Os dados são apagados conforme a Política de Privacidade.</p>
      </section>

      <section>
        <h2>10. Lei aplicável</h2>
        <p>Estes termos seguem as leis do Brasil. Fica eleito o foro do domicílio do usuário para resolver qualquer questão.</p>
      </section>

      <section>
        <h2>11. Contato</h2>
        <p>{email}</p>
      </section>
    </LegalPage>
  )
}
