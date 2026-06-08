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

---

## O que NÃO construir neste MVP

- Integração com Open Finance / bancos
- Renda variável / autônomo (MEI)
- Contas conjuntas / família
- Gamificação / notificações push
- App mobile nativo / Stripe
