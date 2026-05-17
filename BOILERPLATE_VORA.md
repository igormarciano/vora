# BOILERPLATE MANUAL — Vora (Plataforma de Controle Financeiro Inteligente)

> **Objetivo:** Guia completo para construir o MVP da Vora do zero.
> Stack: Next.js + Supabase + Vercel + GitHub. Zero custo. Zero dev necessário.

---

## PRÉ-REQUISITOS

### Ferramentas para instalar na máquina

| Ferramenta | Versão mínima | Como instalar |
|---|---|---|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org) |
| **npm** | v9+ | Vem com o Node.js |
| **Git** | v2+ | [git-scm.com](https://git-scm.com) |

Para verificar se está tudo instalado:
```bash
node --version    # deve mostrar v18+
npm --version     # deve mostrar v9+
git --version     # deve mostrar v2+
```

### Contas necessárias (já criadas ✅)

| Serviço | Função | Status |
|---|---|---|
| [GitHub](https://github.com/igormarciano/vora) | Repositório | ✅ Criado |
| [Vercel](https://vercel.com) | Hosting + deploy automático | ✅ Vinculado ao GitHub |
| [Supabase](https://supabase.com) | Banco PostgreSQL + Auth + Storage | ✅ Criado |

---

## ETAPAS DE BUILD (ordem obrigatória)

### ETAPA 0 — INFRAESTRUTURA ✅ (JÁ FEITA)
- ✅ Repositório criado: `https://github.com/igormarciano/vora.git`
- ✅ Vercel conectado ao repositório
- ✅ Supabase criado

> Próximo passo: configurar variáveis de ambiente na Vercel antes de começar a codar.

---

### ETAPA 1 — SETUP DO PROJETO

Inicializar Next.js com as dependências corretas:

```bash
npx create-next-app@latest vora \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd vora

# Instalar dependências principais
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query
npm install zod
npm install recharts
npm install sonner
npm install lucide-react
npm install date-fns
npm install clsx tailwind-merge

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input label select tabs dialog alert badge separator skeleton toast
```

Configurar `CLAUDE.md` na raiz do projeto (arquivo já gerado separadamente).

---

### ETAPA 2 — SCHEMA DO BANCO (Supabase)

Rodar no **SQL Editor do Supabase** (painel > SQL Editor > New query):

```sql
-- Perfil do usuário (complementa auth.users do Supabase)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT,
  meta_economia_percentual NUMERIC DEFAULT 30,
  layout_preferencia TEXT DEFAULT 'horizontal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para criar perfil automaticamente após cadastro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Receitas
CREATE TABLE receitas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('salario', 'renda_extra', 'outros')),
  tipo_custom TEXT,
  recorrente BOOLEAN DEFAULT FALSE,
  duracao_meses INTEGER,
  mes_referencia DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cartões (precisa existir antes de gastos_fixos e gastos_variaveis)
CREATE TABLE cartoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  bandeira TEXT,
  limite NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gastos fixos
CREATE TABLE gastos_fixos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  categoria TEXT NOT NULL,
  icone TEXT,
  vencimento INTEGER,
  recorrente BOOLEAN DEFAULT TRUE,
  duracao_meses INTEGER,
  vinculado_cartao_id UUID REFERENCES cartoes(id) ON DELETE SET NULL,
  mes_referencia DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gastos variáveis
CREATE TABLE gastos_variaveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  categoria TEXT NOT NULL,
  icone TEXT,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'debito', 'credito')),
  cartao_id UUID REFERENCES cartoes(id) ON DELETE SET NULL,
  parcelado BOOLEAN DEFAULT FALSE,
  total_parcelas INTEGER,
  parcela_atual INTEGER DEFAULT 1,
  valor_parcela NUMERIC,
  mes_referencia DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investimentos
CREATE TABLE investimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('renda_fixa', 'renda_variavel', 'cripto', 'credito_privado', 'internacional')),
  rentabilidade_anual NUMERIC,
  vencimento DATE,
  liquidez TEXT,
  observacao TEXT,
  data_aporte DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pendências de investimento
CREATE TABLE pendencias_investimento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  valor_disponivel NUMERIC NOT NULL,
  valor_restante NUMERIC NOT NULL,
  mes_referencia DATE NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'distribuido', 'dispensado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snapshots mensais (histórico)
CREATE TABLE snapshots_mensais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mes_referencia DATE NOT NULL,
  total_receitas NUMERIC DEFAULT 0,
  total_gastos_fixos NUMERIC DEFAULT 0,
  total_gastos_variaveis NUMERIC DEFAULT 0,
  total_gastos NUMERIC DEFAULT 0,
  economia NUMERIC DEFAULT 0,
  meta_economia NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('bom', 'atencao', 'ruim')),
  total_investido NUMERIC DEFAULT 0,
  saldo_livre NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mes_referencia)
);

-- Row Level Security (RLS) — cada usuário vê apenas seus dados
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_fixos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_variaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendencias_investimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots_mensais ENABLE ROW LEVEL SECURITY;

-- Policies de acesso
CREATE POLICY "Users can manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own receitas" ON receitas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own cartoes" ON cartoes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own gastos_fixos" ON gastos_fixos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own gastos_variaveis" ON gastos_variaveis FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own investimentos" ON investimentos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own pendencias" ON pendencias_investimento FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own snapshots" ON snapshots_mensais FOR ALL USING (auth.uid() = user_id);
```

---

### ETAPA 3 — AUTENTICAÇÃO (Supabase Auth)

- Email/senha nativo do Supabase
- Middleware protegendo rotas `/dashboard/*`, `/controle/*`, `/investimentos/*`, `/historico/*`, `/configuracoes/*`
- Página customizada `/login` e `/cadastro`
- Redirect após login → `/dashboard`
- Persistência de sessão via `@supabase/ssr`

Criar cliente Supabase em `lib/supabase/`:
- `client.ts` — client-side (browser)
- `server.ts` — server-side (Server Components, API Routes)
- `middleware.ts` — refresh de sessão

---

### ETAPA 4 — ENGINE FINANCEIRA

Criar `lib/engine/` com funções puras e testáveis:

```typescript
// Ordem obrigatória de cálculo
calcularReceitas(receitas[], mesReferencia) → number
calcularGastosFixos(gastosFixos[]) → number
calcularGastosVariaveis(gastosVariaveis[]) → number  // apenas valor_parcela para parcelados
calcularTotalGastos(fixos, variaveis) → number        // NUNCA incluir cartão separado
calcularEconomia(receitas, gastos) → number
calcularMeta(receitas, percentual) → number
calcularStatus(economia, meta) → 'bom' | 'atencao' | 'ruim'
calcularSaldoLivre(economia, investido) → number
calcularProjecao(dados, meses=6) → ProjecaoMensal[]   // considerar parcelamentos futuros
```

**Regras críticas (NUNCA violar):**
- Cartão = agrupamento visual apenas, NUNCA soma separada
- Parcelamento = apenas valor_parcela por mês (600 em 6x = 100/mês)
- Investimento ≠ gasto (reduz saldo livre, aumenta patrimônio)
- Gasto fixo vinculado ao cartão: aparece no cartão mas NÃO duplica no total

---

### ETAPA 5 — DASHBOARD

Componentes a construir:

```
/app/dashboard/
  page.tsx                    → página principal
  
/components/dashboard/
  CardReceita.tsx             → total de receitas do mês
  CardGastos.tsx              → total fixos + variáveis
  CardEconomia.tsx            → economia realizada + meta + CTAs
  CardStatus.tsx              → semáforo Bom/Atenção/Ruim
  MensagemContextual.tsx      → mensagem dinâmica baseada no status
  GraficoProjecao.tsx         → Recharts, 6 meses
  ListaProjecao.tsx           → tabela com tags de status
  NavegacaoMensal.tsx         → seletor de mês com destaque no atual
```

---

### ETAPA 6 — CONTROLE FINANCEIRO

```
/app/controle/
  page.tsx

/components/controle/
  LayoutToggle.tsx            → horizontal/vertical, persistir no profile
  SecaoReceitas.tsx
  SecaoGastosFixos.tsx
  SecaoGastosVariaveis.tsx
  SecaoCartoes.tsx            → agrupamento visual apenas
  FormAdicionarGasto.tsx      → fluxo único: tipo → campos específicos
  FormAdicionarReceita.tsx
  ModalConfirmacaoDelete.tsx
```

---

### ETAPA 7 — INVESTIMENTOS

```
/app/investimentos/
  page.tsx

/components/investimentos/
  CarteiraResumo.tsx          → total investido + ativos
  ListaAtivos.tsx
  PendenciaInvestimento.tsx   → card com "Distribuir agora" e "Dispensar"
  ModalDistribuicao.tsx       → dividir valor entre múltiplos ativos
  FormNovoAtivo.tsx
```

---

### ETAPA 8 — HISTÓRICO

```
/app/historico/
  page.tsx

/components/historico/
  ListaMeses.tsx              → meses sem dados: "Sem dados" (NUNCA "Abaixo da meta")
  CardMesHistorico.tsx
```

---

### ETAPA 9 — CONFIGURAÇÕES

```
/app/configuracoes/
  page.tsx                    → meta de economia (%) + preferências
```

---

### ETAPA 10 — ONBOARDING

Mostrar apenas para usuário novo (sem receitas cadastradas):

```
Passo 1: Adicione sua receita
Passo 2: Cadastre gastos fixos
Passo 3: Organize seus gastos variáveis
Passo 4: Veja sua projeção
```

---

### ETAPA 11 — POLISH FINAL

- Toasts com Sonner: salvar, editar, excluir, distribuir
- Modais de confirmação antes de deletar
- Empty states com mensagens amigáveis
- Responsividade: desktop → tablet → mobile
- Loading skeletons nos cards do dashboard

---

## STACK TÉCNICA

| Tecnologia | Função |
|---|---|
| Next.js 14+ (App Router) | Framework full-stack |
| TypeScript strict | Tipagem |
| Tailwind CSS | Estilização |
| TanStack Query | Data fetching + cache client |
| Zod | Validação de formulários |
| Supabase JS | Banco + Auth + Storage |
| shadcn/ui | Componentes UI |
| Recharts | Gráficos de projeção |
| Sonner | Toasts de feedback |
| date-fns | Manipulação de datas |
| lucide-react | Ícones |

## HOSPEDAGEM

| Serviço | Função | Tier |
|---|---|---|
| Vercel | App hosting + deploy automático | Free |
| Supabase | PostgreSQL + Auth + Storage | Free (500MB) |
| GitHub | Repositório + CI trigger | Free |

---

## ESTRUTURA DE PASTAS

```
vora/
├── app/
│   ├── (public)/
│   │   ├── login/
│   │   └── cadastro/
│   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── controle/
│   │   ├── investimentos/
│   │   ├── historico/
│   │   └── configuracoes/
│   ├── api/
│   │   └── financeiro/        # endpoints de CRUD
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                    # shadcn/ui
│   ├── dashboard/
│   ├── controle/
│   ├── investimentos/
│   ├── historico/
│   └── layout/                # sidebar, header, nav
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── engine/                # funções de cálculo financeiro
│   │   ├── receitas.ts
│   │   ├── gastos.ts
│   │   ├── projecao.ts
│   │   └── status.ts
│   └── utils.ts
├── hooks/
│   ├── useDashboard.ts
│   ├── useReceitas.ts
│   ├── useGastos.ts
│   └── useInvestimentos.ts
├── types/
│   └── index.ts               # todos os tipos TypeScript
├── middleware.ts
├── CLAUDE.md
├── .env.example
├── .env.local                 # NUNCA commitar
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## VARIÁVEIS DE AMBIENTE

```env
# Supabase (https://supabase.com → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Configurar também na Vercel:
- Vercel Dashboard → seu projeto → Settings → Environment Variables
- Adicionar as mesmas 3 variáveis do Supabase com os valores de produção

---

## DESIGN SYSTEM

```css
/* Gradiente principal */
background: linear-gradient(135deg, #57cc99, #38a3a5);

/* Cores */
--color-primary-start: #57cc99;
--color-primary-end: #38a3a5;
--color-background: #ffffff;
--color-surface: #f8fafb;
--color-text-primary: #1a1a2e;
--color-text-secondary: #6b7280;
--color-status-bom: #57cc99;
--color-status-atencao: #f59e0b;
--color-status-ruim: #ef4444;
```

**Tom visual:** clean, minimalista, premium, humano. Predominância branca, bastante respiro, baixa densidade visual.

**NÃO parece:** planilha, internet banking, ERP.

**Tom de voz:** acolhedor, causal, nunca punitivo.
- ✅ "Este gasto reduz sua sobra em R$ X"
- ❌ "Você gastou demais"

---

## DECISÕES E AJUSTES

1. **Supabase substitui Neon + Auth.js + Clerk** — banco + auth + storage em uma plataforma só. Menos ferramentas, menos configuração, free tier suficiente para o MVP.
2. **Sem Stripe no MVP** — monetização fora do escopo inicial. Foco total em validar a hipótese de produto.
3. **Sem Open Finance no MVP** — registro manual reduz complexidade técnica e valida engajamento real do usuário.
4. **Toast → Sonner** — `toast` do shadcn/ui depreciado. Usar `sonner` no lugar.
5. **React Compiler: No** — não ativar experimental.
6. **Supabase RLS obrigatório** — Row Level Security ativado em todas as tabelas. Cada usuário acessa apenas seus próprios dados. Nunca desativar.
7. **Middleware leve** — middleware checa cookie de sessão do Supabase diretamente, sem importar libs pesadas. Limite de 1MB do Vercel free.
8. **Engine financeira isolada** — todas as funções de cálculo ficam em `lib/engine/` como funções puras. Facilita testes e evita bugs de cálculo espalhados nos componentes.
9. **Cartão = agrupamento visual** — NUNCA criar endpoint separado de "gastos por cartão" que some valores. Cartão apenas filtra e agrupa gastos variáveis existentes.
10. **Parcelamento = valor_parcela** — ao salvar um gasto parcelado, sempre calcular e salvar `valor_parcela = valor / total_parcelas`. A engine usa `valor_parcela`, nunca `valor` para parcelados.
11. **Mês vazio = "Sem dados"** — nunca mostrar "Abaixo da meta" para meses sem registros.
12. **CLAUDE.md na raiz** — arquivo de contexto para o Claude Code ler no início de cada sessão. Contém stack, schema, regras de negócio e ordem de desenvolvimento.

---

## PRODUTO — VORA

```
Nome: Vora
Headline: "Veja seu mês antes dele acontecer."
Subtítulo: "Clareza financeira real. Sem planilha, sem surpresa, sem culpa."

Features principais:
1. Projeção do mês — veja receitas, gastos e sobra antes do mês acabar
2. Simulação de decisão — simule o impacto de uma compra antes de fazer
3. Cartão sem susto — parcelamentos distribuídos automaticamente nos meses futuros
4. Destino da sobra — economia realizada vira investimento de forma natural
5. Status do mês — semáforo simples: Bom, Atenção ou Ruim

Entidades do banco:
- profiles (meta_economia_percentual, layout_preferencia)
- receitas (nome, valor, tipo, recorrente, duracao_meses, mes_referencia)
- cartoes (nome, bandeira, limite)
- gastos_fixos (nome, valor, categoria, icone, vencimento, recorrente, vinculado_cartao_id)
- gastos_variaveis (nome, valor, categoria, forma_pagamento, cartao_id, parcelado, total_parcelas, valor_parcela)
- investimentos (nome, valor, categoria, rentabilidade_anual, vencimento, liquidez)
- pendencias_investimento (valor_disponivel, valor_restante, status)
- snapshots_mensais (totais, economia, meta, status)

O que NÃO construir no MVP:
- Integração com Open Finance / bancos
- Renda variável / autônomo
- Contas conjuntas / família
- Gamificação
- Notificações push
- App mobile nativo
- Stripe / monetização

Cores:
- Gradiente: #57cc99 → #38a3a5
- Fundo: #ffffff
- Superfície: #f8fafb
- Texto: #1a1a2e
```
