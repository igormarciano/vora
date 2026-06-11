# CLAUDE.md — Vora (Plataforma de Controle Financeiro Inteligente)

## Visão geral do projeto

Vora é uma plataforma de controle financeiro pessoal focada em **clareza, projeção futura e apoio à decisão**. Não é um gerenciador tradicional — é uma ferramenta de visibilidade financeira que responde:

1. Quanto vou receber?
2. Quanto vou gastar?
3. Quanto consigo guardar?
4. Quanto consigo investir?
5. Como meu futuro financeiro fica?

**Repositório:** https://github.com/igormarciano/vora.git

---

## Stack técnico

- **Framework:** Next.js 15 (App Router)
- **Banco de dados + Auth:** Supabase (PostgreSQL)
- **Hospedagem:** Vercel
- **Estilização:** Tailwind CSS v4
- **Componentes:** shadcn/ui
- **Gráficos:** Recharts
- **Toasts:** Sonner

---

## Variáveis de ambiente necessárias (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Design system — Cores Vora

```css
/* Background */
--color-vora-beige: #f2ede7;        /* bg das telas public */
--color-vora-green-100: #dce6dc;    /* blocos de destaque, onboarding 2 */
--color-vora-green-300: #b4c9b4;    /* dot ativo no onboarding */
--color-vora-green-500: #8faf8f;    /* botão primário, texto destaque */
--color-vora-green-900: #3c4a3c;    /* texto principal */
--color-vora-grey-50: #fdfcfb;      /* badge bg */
--color-vora-grey-500: #ece4db;     /* border, inputs */
--color-vora-grey-600: #d7cfc7;     /* dot inativo */
```

## Tipografia

- **Heading:** `font-fraunces` (Fraunces, variable font, SOFT=0, WONK=1)
- **Body:** `font-inter` (Inter, system)

## Gradiente principal

```css
background: linear-gradient(135deg, #57cc99, #38a3a5);
```

---

## Engine financeira — regras de cálculo (NUNCA violar)

```
1. receita_total = soma de todas as receitas válidas do mês
2. gastos_fixos = soma dos gastos fixos do mês
3. gastos_variaveis = soma das parcelas mensais + gastos à vista do mês
4. total_gastos = gastos_fixos + gastos_variaveis
5. economia = receita_total - total_gastos
6. meta_valor = receita_total × (meta_percentual / 100)
7. status:
   - 'bom' → economia >= meta_valor
   - 'atencao' → economia > 0 e economia < meta_valor
   - 'ruim' → economia <= 0
8. saldo_livre = economia - total_investido_no_mes
```

### Regras críticas de anti-duplicação

- Cartão é APENAS agrupamento visual — NUNCA soma separada
- Gasto fixo vinculado ao cartão: aparece no cartão mas NÃO duplica no total
- Parcelamento: considerar APENAS a parcela mensal (ex: 600 em 6x = 100/mês)
- Investimento NÃO é gasto — reduz saldo livre, aumenta patrimônio

---

## Estrutura de pastas

```
/app
  /(public)/login     → tela de login (fiel ao Figma)
  /(public)/cadastro  → tela de cadastro
  /onboarding         → 3 slides de onboarding (fiel ao Figma)
  /(auth)/dashboard   → visão geral + 4 cards
  /(auth)/controle    → receitas e gastos
  /(auth)/investimentos
  /(auth)/historico
  /(auth)/configuracoes
/components
  /ui            → shadcn components
  /dashboard     → CardReceita, CardGastos, CardEconomia, CardStatus
  /layout        → Logo, Sidebar
/lib
  /supabase      → client.ts, server.ts
  /engine        → funções de cálculo financeiro
/types
  index.ts       → todos os tipos TypeScript
middleware.ts    → proteção de rotas + refresh de sessão
```

---

## Copywriting — tom de voz

- Acolhedor, simples, educativo, humano
- NUNCA: tom bancário, punitivo, técnico excessivo
- USAR: "Este gasto reduz sua sobra em R$ X"
- NUNCA: "Você gastou demais"

---

## Migrations aplicadas no Supabase

- `add_setup_completo_to_profiles`: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS setup_completo boolean NOT NULL DEFAULT false;`
- `fix_handle_new_user_copy_nome`: corrige a trigger `handle_new_user` para copiar `raw_user_meta_data->>'nome'` (definido no signup) para `profiles.nome`. Antes, a trigger só inserida o `id`, deixando `profiles.nome` sempre `NULL` e quebrando a exibição do nome em Configurações.
- `add_grupo3_columns_and_custom_categories`: adiciona colunas usadas pelo Grupo 3 de melhorias —
  - `gastos_fixos.person_type` (text, `'PF'` ou `'PJ'`, default `'PF'`) — segmentação Pessoa Física/Jurídica (item 3.2)
  - `gastos_fixos.description` e `gastos_variaveis.description` (text, máx. 500 caracteres) — descrição opcional do gasto (item 3.6)
  - `gastos_fixos.is_paid` e `gastos_variaveis.is_paid` (boolean, default `false`) — status Pago/Pendente (item 3.7)
  - `cartoes.color` (text, hex) — cor do cartão escolhida na paleta predefinida (item 3.9)
  - tabela `custom_categories` (id, user_id, emoji, nome, contexto `'fixo'|'variavel'|'ambos'`, created_at) com RLS por `user_id` — categorias personalizadas (item 3.4)

> Nenhuma migration nova foi necessária para o item 3.12 (transferência de sobra para
> investimentos): a tabela `pendencias_investimento` (id, user_id, valor_disponivel,
> valor_restante, mes_referencia, status `'pendente'|'distribuido'|'dispensado'`,
> created_at) já existia no banco, com RLS habilitada, porém não era usada em nenhum
> lugar do código. Passou a ser usada para controlar quanto da sobra do mês já foi
> distribuído entre investimentos (ver `app/(auth)/investimentos/actions.ts` —
> `investirSobra` e `dispensarSobraInvestimento`).

- `add_expense_nature_to_gastos_variaveis` (Change Request 001, item 3): adiciona
  `gastos_variaveis.expense_nature` (text, `'PF'` ou `'PJ'`, default `'PF'`, com
  `CHECK`) — segmentação Pessoa Física/Jurídica para gastos variáveis, espelhando
  `gastos_fixos.person_type`. Apenas segmentação analítica: **não altera nenhum
  cálculo** (receitas, gastos, economia, status, saldo livre).

---

## Recorrência de gastos fixos (Change Request 001, item 4)

Gastos fixos com `recorrente = true` são cadastrados **uma única vez**, no mês em
que foram criados (`mes_referencia`). Para que apareçam automaticamente nos meses
seguintes — sem duplicar registros no banco — foi criada a função
`projetarGastosFixosRecorrentes(fixos, mesAlvo)` em `lib/engine/index.ts`, que
projeta esses gastos para qualquer mês posterior ao de origem, respeitando
`duracao_meses` (quando definido) ou propagando indefinidamente (quando `null`).

Essa projeção é aplicada em todos os pontos que calculam o mês de referência,
para manter os indicadores consistentes entre telas:

- `app/(auth)/gastos/page.tsx` (lista de Gastos com navegação mensal)
- `app/(auth)/dashboard/page.tsx` (Visão geral / cards do mês atual)
- `app/(auth)/investimentos/page.tsx` e `actions.ts` (`investirSobra`, cálculo de sobra)

Editar uma ocorrência projetada edita o gasto fixo de origem (afeta todas as
ocorrências futuras, como em uma assinatura recorrente real). Excluir uma
ocorrência projetada exclui o gasto fixo de origem por completo, encerrando a
recorrência — mesmo comportamento já adotado para compras parceladas (item 3.11).

---

## Central de Cartões (Change Request 001, item 2)

Nova página dedicada por cartão em `/gastos/cartoes/[id]`
(`app/(auth)/gastos/cartoes/[id]/page.tsx` + `components/cartoes/CartaoDetalheClient.tsx`),
acessível a partir de "Gerenciar cartões" (dentro de Gastos → Variáveis), clicando
no nome do cartão. Mostra:

- Cabeçalho: nome, limite, disponível e valor utilizado do cartão.
- Indicadores: total da fatura atual, total parcelado futuro e quantidade de compras.
- Lista completa de compras (`gastos_variaveis` com `cartao_id` igual ao cartão),
  com descrição, categoria, data, valor total e parcela atual/total — reutilizando
  a mesma lógica de projeção de `projetarGastosParcelados` para calcular a parcela
  "atual" de cada compra parcelada sem duplicar registros.
- Checkboxes por compra (e "selecionar todas") para seleção múltipla — preparação
  para ações em lote, exportação e filtros futuros (ainda não implementados).
- Gastos fixos vinculados ao cartão no mês atual (incluindo recorrências projetadas)
  são listados à parte e somados à fatura atual.

Nenhuma migration nova foi necessária — a página usa apenas colunas já existentes
(`cartoes.limite`, `cartoes.color`, `gastos_variaveis.cartao_id`,
`gastos_fixos.vinculado_cartao_id`).

---

## Gráficos da Visão Geral (Change Request 001, item 1)

A Visão Geral (`app/(auth)/dashboard/page.tsx`) continua mostrando os 4 cards
existentes (CardReceita, CardGastos, CardEconomia, CardStatus) com os
indicadores do mês atual, e ganhou 4 gráficos (componente
`components/dashboard/DashboardCharts.tsx`), nesta ordem de prioridade — o
princípio "ver o futuro financeiro antes dele acontecer" continua dominante,
por isso o gráfico de projeção futura é o primeiro e o maior:

1. **Projeção futura** (`components/dashboard/charts/ProjecaoFuturaChart.tsx`,
   prioridade 1, gráfico principal): linha com receitas, gastos e economia dos
   próximos 6 meses (mês atual + 5), gerada por `gerarProjecaoMensal` em
   `lib/engine/index.ts`.
2. **Evolução patrimonial**
   (`components/dashboard/charts/EvolucaoPatrimonialChart.tsx`, prioridade 2):
   linha com saldo acumulado projetado (soma cumulativa da economia mês a mês,
   a partir de agora), patrimônio investido (constante = soma de todos os
   `investimentos.valor` até hoje) e patrimônio total (saldo acumulado +
   patrimônio investido).
3. **Capacidade de economia**
   (`components/dashboard/charts/CapacidadeEconomiaChart.tsx`, prioridade 3):
   barras com receita, gastos e economia por mês, usando a mesma `projecao` do
   gráfico principal.
4. **Composição financeira**
   (`components/dashboard/charts/ComposicaoFinanceiraChart.tsx`, prioridade 4):
   donut com a composição do mês atual — gastos fixos, gastos variáveis,
   investido e saldo livre.

`gerarProjecaoMensal` reaproveita `projetarGastosFixosRecorrentes`,
`projetarReceitasRecorrentes` e `projetarGastosParcelados` (mesmas funções já
usadas em `/gastos` e `/investimentos`), calculando tudo em memória a partir
dos dados existentes — nenhum registro novo é criado no banco e nenhuma
migration foi necessária. Os 4 cards e o cálculo do mês atual usam o primeiro
elemento da projeção (`projecao[0]`), garantindo que os indicadores continuem
idênticos aos calculados antes desta mudança.

Os gráficos só aparecem quando `totalReceitas > 0` (mesma condição que hoje
esconde o card de configuração inicial), evitando gráficos vazios para quem
ainda não cadastrou nada.

---

## O que NÃO construir neste MVP

- Integração com Open Finance / bancos
- Renda variável / autônomo (MEI)
- Contas conjuntas / família
- Gamificação / notificações push
- App mobile nativo / Stripe
