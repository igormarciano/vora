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

# Análise Mensal por IA (Fase 1)
OPENAI_API_KEY=
CRON_SECRET=
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

- `add_ocorrencias_status_per_month_paid` (Change Request 003, item 5): cria a
  tabela `ocorrencias_status` (id, user_id, origem_tipo `'gasto_fixo'|'gasto_variavel'`,
  origem_id, mes_referencia, is_paid, created_at, `unique(origem_id, mes_referencia)`)
  com RLS por `user_id`. Registra o status pago/pendente de **ocorrências
  projetadas** (recorrências de gastos fixos e parcelas futuras de gastos
  variáveis) por competência mensal, sem duplicar o registro de origem. Ver
  seção "Status pago por competência mensal" abaixo.

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

## Status pago por competência mensal (Change Request 003, itens 5 e 6)

**Item 5 — status pago pertence à instância mensal, nunca à regra recorrente.**
Um gasto fixo recorrente (ou uma compra parcelada) é armazenado uma única vez e
projetado para os meses seguintes em memória (ver seções acima). O `is_paid` do
registro de origem vale apenas para o **mês de origem**. Para os meses projetados,
o status pago/pendente é gravado na tabela `ocorrencias_status`, por competência:

- `alternarPagoGastoFixo(id, is_paid, mes_referencia)` e
  `alternarPagoGastoVariavel(id, is_paid, mes_referencia)` (em
  `app/(auth)/controle/actions.ts`) recebem o mês exibido. Se for o mês de origem,
  atualizam o próprio registro; se for um mês projetado, fazem `upsert` em
  `ocorrencias_status` (helper `alternarPagoOcorrencia`).
- `app/(auth)/gastos/page.tsx` busca `ocorrencias_status` do mês e aplica o status
  às ocorrências projetadas (default = pendente). Os registros do próprio mês de
  origem mantêm o seu `is_paid`.
- O mês exibido chega aos toggles via `MesGastosContext` em
  `components/gastos/GastosClient.tsx`. `GastoCard` sincroniza o estado interno
  com o prop `isPaid` (a mesma ocorrência pode estar paga em um mês e pendente em
  outro ao navegar entre meses).

Assim, marcar "Internet" como paga em julho **não** afeta agosto/setembro.

**Item 6 — recorrência não retroativa.** Ao criar um lançamento, o
`mes_referencia` inicial é `max(mês selecionado, mês atual)` via
`mesReferenciaInicial(mesSelecionado)` em `lib/engine`. A tela de Gastos passa o
mês em foco (`mesSelecionado`) para os formulários → `criarGastoFixo` /
`criarGastoVariavel`. Uma recorrência criada em julho começa em julho (ou no mês
futuro selecionado) e nunca em meses anteriores.

---

## Onboarding flexível (Change Request 003, item 7)

`app/onboarding/page.tsx` abre com uma tela de escolha (`EscolhaInicial`):

- **Explorar sozinho** → `marcarSetupCompleto()` e vai direto para `/dashboard`.
- **Começar com ajuda da Vora** → segue os slides de onboarding atuais → `/setup`
  (fluxo guiado / `SetupWizard`).

---

## Projeção de patrimônio (Change Request 003, itens 8 e 9)

O gráfico de evolução patrimonial (`EvolucaoPatrimonialChart`) usa a fórmula:

```
Patrimônio Futuro = Patrimônio Atual + Economias Futuras Acumuladas + Rentabilidade Projetada
```

Calculado em `app/(auth)/dashboard/page.tsx`, composto mês a mês a partir do
patrimônio atual (soma dos `investimentos.valor`):

- Mês atual = patrimônio atual.
- Cada mês seguinte = mês anterior + economia prevista + rendimento.
- **Economia prevista**: a economia real calculada do mês (`projecao[i].economia`);
  quando o mês não tem receita projetada, recorre à meta configurada
  (`receita × meta%`).
- **Rendimento**: patrimônio anterior × taxa mensal ponderada pela
  `rentabilidade_anual` dos investimentos.

As três linhas do gráfico: patrimônio total (projetado), patrimônio atual
(linha-base constante) e economias acumuladas.

---

## Ajustes de UX (Change Request 003, itens 1–4)

- **Item 1** — seletor de emoji compacto no cadastro de categorias
  (`CategorySelect` inline e `CustomCategoriesManager`): emoji em largura fixa
  reduzida, campo de nome em destaque.
- **Item 2** — novas cores de cartão Roxo `#7C3AED` e Laranja `#F97316` em
  `PALETA_CARTOES` (`components/gastos/GastosClient.tsx`), mantendo as anteriores.
- **Item 3** — cartões usam a própria cor como fundo translúcido (10–15%) via
  `corComOpacidade(hex, alpha)` em `lib/engine`: `CartaoRow`, grupos "Por cartão"
  e o cabeçalho da Central de Cartões.
- **Item 4** — CTAs primários "Adicionar Receita" e "Adicionar Gasto" com o
  gradiente principal (`linear-gradient(135deg, #57cc99, #38a3a5)`), acima da
  listagem (prop `variant="primary"` em `FormReceita` e `ModalAdicionarGasto`).

---

## Análise Mensal por IA (Fase 1 do plano de IA)

Gera uma leitura curta do mês financeiro de cada usuário via OpenAI
(`gpt-4o-mini`), sem interface de chat, de duas formas:

- **Automática**: job de cron mensal, roda para todos os usuários.
- **Sob demanda**: card "Veja dicas e um resumo da sua vida financeira" na
  Visão Geral, com o CTA "Analisar minhas finanças" — chama
  `gerarAnaliseSobDemanda` (`app/(auth)/dashboard/actions.ts`), que roda a
  mesma lógica de agregação/prompt/IA para o usuário logado (RLS, sem service
  role) e grava/atualiza a análise do mês. Depois de gerada, o card mostra o
  resultado com um link "Analisar de novo".

- **Rota:** `app/api/cron/analise-mensal/route.ts` (GET, protegida por
  `Authorization: Bearer ${CRON_SECRET}`). Disparada pelo Vercel Cron
  (`vercel.json`, dia 1 de cada mês às 06:00 UTC).
- **Agregação:** `lib/ai/aggregate.ts` monta os totais por categoria + delta
  vs. mês anterior a partir dos mesmos helpers de projeção do `lib/engine`
  (nenhuma lista crua de transações é enviada ao modelo — mantém custo baixo
  e o modelo mais preciso).
- **Prompt:** `lib/ai/prompts.ts` (system prompt fixo + template do prompt do
  usuário). Chamada em `lib/ai/openai.ts`, com `response_format: json_object`
  e validação da resposta via `lib/ai/schema.ts` (zod).
- **Armazenamento:** tabela `analises_mensais` (migrations
  `create_analises_mensais` e `analises_mensais_allow_self_upsert`) —
  `user_id`, `mes_referencia`, `status_geral`, `resumo`, `insights` (jsonb),
  `recomendacoes` (jsonb), única por `(user_id, mes_referencia)`. RLS: usuário
  autenticado pode `select`/`insert`/`update` apenas a própria linha (usada
  pelo fluxo sob demanda); o job de cron escreve via `lib/supabase/admin.ts`
  (service role, ignora RLS) para todos os usuários.
- **UI:** `components/dashboard/AnaliseMensalSection.tsx` (client component),
  renderizado em `app/(auth)/dashboard/page.tsx` quando `totalReceitas > 0`.
  Mostra o CTA de análise quando não há resultado do mês, ou
  `components/dashboard/AnaliseMensalCard.tsx` com o resultado.
- **Custo:** ~US$0,0015 por usuário/mês com `gpt-4o-mini`.

---

## O que NÃO construir neste MVP

- Integração com Open Finance / bancos
- Renda variável / autônomo (MEI)
- Contas conjuntas / família
- Gamificação / notificações push
- App mobile nativo / Stripe
