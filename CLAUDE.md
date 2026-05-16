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

- **Framework:** Next.js 14 (App Router)
- **Banco de dados + Auth:** Supabase (PostgreSQL)
- **Hospedagem:** Vercel
- **Estilização:** Tailwind CSS
- **Componentes:** shadcn/ui
- **Gráficos:** Recharts
- **ORM:** Prisma (conectado ao Supabase)

---

## Variáveis de ambiente necessárias (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Schema do banco de dados (Supabase / PostgreSQL)

```sql
-- Usuários (gerenciado pelo Supabase Auth)
-- A tabela auth.users já existe automaticamente

-- Perfil do usuário
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nome TEXT,
  meta_economia_percentual NUMERIC DEFAULT 30,
  layout_preferencia TEXT DEFAULT 'horizontal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receitas
CREATE TABLE receitas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL, -- 'salario' | 'renda_extra' | 'outros'
  tipo_custom TEXT, -- se tipo = 'outros'
  recorrente BOOLEAN DEFAULT FALSE,
  duracao_meses INTEGER, -- null = indefinido
  mes_referencia DATE NOT NULL, -- primeiro dia do mês
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gastos fixos
CREATE TABLE gastos_fixos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  categoria TEXT NOT NULL,
  icone TEXT,
  vencimento INTEGER, -- dia do mês
  recorrente BOOLEAN DEFAULT TRUE,
  duracao_meses INTEGER,
  vinculado_cartao_id UUID REFERENCES cartoes(id),
  mes_referencia DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gastos variáveis
CREATE TABLE gastos_variaveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  categoria TEXT NOT NULL,
  icone TEXT,
  forma_pagamento TEXT NOT NULL, -- 'dinheiro' | 'debito' | 'credito'
  cartao_id UUID REFERENCES cartoes(id),
  parcelado BOOLEAN DEFAULT FALSE,
  total_parcelas INTEGER,
  parcela_atual INTEGER,
  valor_parcela NUMERIC, -- valor / total_parcelas
  mes_referencia DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cartões
CREATE TABLE cartoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  bandeira TEXT,
  limite NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investimentos
CREATE TABLE investimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  categoria TEXT NOT NULL, -- 'renda_fixa' | 'renda_variavel' | 'cripto' | 'credito_privado' | 'internacional'
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  valor_disponivel NUMERIC NOT NULL,
  valor_restante NUMERIC NOT NULL,
  mes_referencia DATE NOT NULL,
  status TEXT DEFAULT 'pendente', -- 'pendente' | 'distribuido' | 'dispensado'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snapshots mensais (histórico)
CREATE TABLE snapshots_mensais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  total_receitas NUMERIC DEFAULT 0,
  total_gastos_fixos NUMERIC DEFAULT 0,
  total_gastos_variaveis NUMERIC DEFAULT 0,
  total_gastos NUMERIC DEFAULT 0,
  economia NUMERIC DEFAULT 0,
  meta_economia NUMERIC DEFAULT 0,
  status TEXT, -- 'bom' | 'atencao' | 'ruim'
  total_investido NUMERIC DEFAULT 0,
  saldo_livre NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mes_referencia)
);
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
- NUNCA somar: cartão + variável / fixo + cartão / parcela + total / investimento + gasto

### Projeção futura (6 meses)

Considerar para cada mês futuro:
- Receitas recorrentes
- Gastos fixos recorrentes
- Parcelas em andamento
- Investimentos e sua rentabilidade

---

## Estrutura de pastas do projeto

```
/app
  /auth          → login, cadastro
  /dashboard     → página principal
  /controle      → receitas e gastos
  /investimentos → carteira e pendências
  /historico     → snapshots mensais
  /configuracoes → meta de economia, perfil
/components
  /ui            → shadcn components
  /dashboard     → cards, gráfico, projeção
  /controle      → forms, listas
  /investimentos → carteira, distribuição
/lib
  /supabase      → client, server
  /engine        → funções de cálculo financeiro
  /utils         → helpers gerais
/types
  index.ts       → todos os tipos TypeScript
```

---

## Design system

### Identidade visual

- **Tom:** clean, minimalista, premium, humano
- **NÃO parece:** planilha, internet banking, ERP
- **PARECE:** simples, visual, leve, intuitivo

### Cores

```css
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

### Gradiente principal

```css
background: linear-gradient(135deg, #57cc99, #38a3a5);
```

### UX

- Predominância branca, bastante respiro
- Baixa densidade visual
- Evitar: excesso de inputs, tabelas, categorias, visual bancário pesado
- Priorizar: clareza, legibilidade, baixa fricção

---

## Copywriting — tom de voz

- Acolhedor, simples, educativo, humano
- EVITAR: tom bancário, tom técnico excessivo, linguagem punitiva
- USAR linguagem causal: "Este gasto reduz sua sobra em R$ X"
- NUNCA: "Você gastou demais"

### Exemplos de mensagens contextuais

- "Você economizou 28% da sua receita este mês."
- "Seu mês está no caminho certo."
- "Atenção: seus gastos estão próximos da sua receita."

---

## Funcionalidades por módulo

### Auth
- Login com email/senha
- Cadastro
- Logout
- Persistência de sessão via Supabase Auth

### Dashboard
- 4 cards: Receita total / Total de gastos / Economia realizada / Status do mês
- Mensagem contextual dinâmica
- Gráfico de projeção futura (6 meses) com Recharts
- Lista de projeção mensal com tags de status
- Navegação mensal com destaque no mês atual

### Controle Financeiro
- Sub-abas: Receitas / Gastos Fixos / Gastos Variáveis / Cartões
- Layout configurável (horizontal/vertical) persistido por usuário
- Fluxo único "+ Adicionar gasto" → selecionar tipo → formulário específico
- Edição e remoção com modal de confirmação
- Toasts de feedback (salvar, editar, excluir)

### Investimentos
- Carteira com total investido e ativos
- Fluxo "Investir agora" → cria pendência
- Distribuição entre múltiplos ativos
- Distribuição parcial com saldo restante pendente
- Opção "Manter como saldo"

### Histórico
- Lista de meses com receitas, gastos, saldo e status
- Meses sem dados: mostrar "Sem dados" (NUNCA "Abaixo da meta")

### Configurações
- Meta de economia em percentual (padrão: 30%)

---

## Onboarding (usuário novo)

Mostrar 4 passos sequenciais:
1. Adicione sua receita
2. Cadastre gastos fixos
3. Organize seus gastos variáveis
4. Veja sua projeção

---

## O que NÃO construir neste MVP

- Integração com Open Finance / bancos
- Renda variável / autônomo (MEI)
- Gestão de inadimplência ativa
- Contas conjuntas / família
- Gamificação
- Notificações push
- App mobile nativo

---

## Ordem de desenvolvimento sugerida

1. Setup Next.js + Supabase + Tailwind + shadcn
2. Auth (login, cadastro, logout, sessão)
3. Schema do banco no Supabase
4. Engine financeira (/lib/engine)
5. Dashboard (cards + gráfico)
6. Controle — Receitas
7. Controle — Gastos Fixos
8. Controle — Gastos Variáveis + Parcelamento
9. Controle — Cartões (agrupamento visual)
10. Investimentos
11. Histórico
12. Configurações
13. Onboarding
14. Responsividade (mobile/tablet)
15. Empty states e toasts
