# Fase 1 — Fundação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a running Next.js + TypeScript app with the Hub Amplificado design tokens, a simple email/password login backed by a mock carteira (portfolio) of executives, and a protected shell page reachable at `localhost` — the foundation the later phases (motor de regras, Minhas RPs, geração de proposta) build on.

**Architecture:** Next.js App Router project with a route group (`app/(app)`) for authenticated pages, protected by `middleware.ts` checking a session cookie. Login is email + any non-empty password against a hardcoded in-memory carteira (mirrors the prototype's demo login). No BigQuery, no SSO, no RP listing yet — those are later phases.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Vitest 2 for unit tests.

**Spec:** [docs/superpowers/specs/2026-08-25-hub-amplificado-design.md](../specs/2026-08-25-hub-amplificado-design.md)

## Global Constraints

- MVP scope per spec is Fundação + Motor de regras + Minhas RPs + Geração de proposta; this plan covers **only Fundação**. Do not build Fila, Funil, or Gerência here.
- Login: e-mail + **qualquer senha não vazia** (as in the prototype) validated against a fixed in-memory carteira — no SSO yet (SSO is post-MVP per spec decision 8).
- E-mail pattern for the carteira: `nome.sobrenome@empresa.com.br`.
- Design tokens (colors, radii, shadows, spacing) must come from the README's "Design tokens" table — copy exact values, don't invent new ones.
- Language: all UI copy and code identifiers in Portuguese (pt-BR), consistent with the README and prototype.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a runnable Next.js dev server (`npm run dev`) serving `/`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "hub-amplificado",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@types/node": "22.10.2",
    "@types/react": "19.0.2",
    "@types/react-dom": "19.0.2",
    "typescript": "5.7.2",
    "vitest": "2.1.8"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Create `app/layout.tsx`**

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Create `app/page.tsx`**

```tsx
export default function Home() {
  return <p>Hub Amplificado</p>;
}
```

- [ ] **Step 6: Install dependencies and verify the dev server**

Run: `npm install`

Then run: `npm run dev` (in background) and, in another shell:

```bash
curl -s http://localhost:3000/ | grep -q "Hub Amplificado" && echo OK
```

Expected: `OK` printed. Stop the dev server after verifying.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs app/layout.tsx app/page.tsx next-env.d.ts .gitignore
git commit -m "chore: scaffold Next.js + TypeScript project"
```

---

### Task 2: Design tokens and fonts

**Files:**
- Create: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `app/layout.tsx` from Task 1.
- Produces: CSS custom properties (`--cor-*`, `--raio-*`, `--sombra-*`, `--fonte-ui`, `--fonte-mono`) usable by every later component/page.

- [ ] **Step 1: Create `app/globals.css`**

```css
:root {
  --cor-fundo: #f4f3ef;
  --cor-superficie: #fffefb;
  --cor-superficie-alt: #fff;
  --cor-cabecalho-tabela: #efece6;
  --cor-linha-marcada: #fbfaf7;
  --cor-tinta-principal: #16151a;
  --cor-tinta-secundaria: #6f6c66;
  --cor-tinta-terciaria: #8a867e;
  --cor-tinta-fraca: #a09b92;
  --cor-borda: #e3e0d9;
  --cor-borda-sutil: #eae7e0;
  --cor-borda-input: #d9d5cd;
  --cor-desabilitado-fundo: #ddd9d1;
  --cor-desabilitado-texto: #918c83;
  --cor-acento: oklch(0.52 0.13 250);
  --cor-acento-hover: oklch(0.42 0.13 250);
  --cor-sucesso-texto: oklch(0.42 0.12 150);
  --cor-sucesso-fundo: oklch(0.97 0.03 150);
  --cor-sucesso-borda: oklch(0.85 0.07 150);
  --cor-alerta-texto: oklch(0.45 0.1 60);
  --cor-alerta-fundo: oklch(0.97 0.03 85);
  --cor-alerta-borda: oklch(0.86 0.07 75);
  --cor-erro-texto: oklch(0.45 0.14 30);
  --cor-erro-fundo: oklch(0.97 0.02 30);
  --cor-erro-borda: oklch(0.86 0.06 30);
  --overlay-modal: rgba(20, 19, 24, 0.42);

  --raio-chip: 5px;
  --raio-input: 6px;
  --raio-botao: 7px;
  --raio-cartao: 8px;
  --raio-card: 10px;
  --raio-modal: 12px;
  --raio-badge: 20px;

  --sombra-card: 0 1px 3px rgba(0, 0, 0, 0.05);
  --sombra-toast: 0 8px 26px rgba(0, 0, 0, 0.25);
  --sombra-modal: 0 18px 50px rgba(0, 0, 0, 0.22);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: var(--cor-fundo);
  color: var(--cor-tinta-principal);
  font-family: var(--fonte-ui), sans-serif;
}

button,
input,
select,
textarea {
  font-family: inherit;
}

:focus-visible {
  outline: 2px solid var(--cor-acento);
  outline-offset: -1px;
}
```

- [ ] **Step 2: Update `app/layout.tsx` to load fonts and apply the stylesheet**

```tsx
import type { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fonte-ui',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--fonte-mono',
});

export const metadata: Metadata = {
  title: 'Hub Amplificado',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/` and confirm:
- Page background is the warm off-white `#f4f3ef` (not pure white).
- Text renders in Archivo (not the browser's default serif/sans fallback).

Stop the dev server after verifying.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: add design tokens and Archivo/IBM Plex Mono fonts"
```

---

### Task 3: Mock carteira and authentication logic

**Files:**
- Create: `lib/data/carteira.ts`
- Test: `lib/data/carteira.test.ts`
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type Papel = 'executivo' | 'gerente'`, `interface ExecutivoCarteira { nome: string; email: string; papel: Papel }`, `buscarExecutivoPorEmail(email: string): ExecutivoCarteira | undefined`, `autenticar(email: string, senha: string): ExecutivoCarteira | null` — used by Task 4's login action.

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 2: Write the failing test — `lib/data/carteira.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { autenticar, buscarExecutivoPorEmail } from './carteira';

describe('buscarExecutivoPorEmail', () => {
  it('encontra executivo por e-mail, ignorando maiusculas/minusculas', () => {
    const executivo = buscarExecutivoPorEmail('MILENA.DABUL@empresa.com.br');
    expect(executivo?.nome).toBe('Milena Dabul Stork');
  });

  it('retorna undefined para e-mail fora da carteira', () => {
    expect(buscarExecutivoPorEmail('ninguem@empresa.com.br')).toBeUndefined();
  });
});

describe('autenticar', () => {
  it('autentica quando o e-mail esta na carteira e a senha nao e vazia', () => {
    const executivo = autenticar('fabio.couto@empresa.com.br', 'qualquer-coisa');
    expect(executivo?.email).toBe('fabio.couto@empresa.com.br');
  });

  it('rejeita quando a senha esta vazia', () => {
    expect(autenticar('fabio.couto@empresa.com.br', '')).toBeNull();
  });

  it('rejeita e-mail que nao esta na carteira', () => {
    expect(autenticar('ninguem@empresa.com.br', 'x')).toBeNull();
  });

  it('distingue o papel de gerente', () => {
    expect(autenticar('gerente@empresa.com.br', 'x')?.papel).toBe('gerente');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run lib/data/carteira.test.ts`
Expected: FAIL with a module-not-found error for `./carteira`.

- [ ] **Step 4: Write the minimal implementation — `lib/data/carteira.ts`**

```ts
export type Papel = 'executivo' | 'gerente';

export interface ExecutivoCarteira {
  nome: string;
  email: string;
  papel: Papel;
}

const CARTEIRA: ExecutivoCarteira[] = [
  { nome: 'Milena Dabul Stork', email: 'milena.dabul@empresa.com.br', papel: 'executivo' },
  { nome: 'Fabio Couto', email: 'fabio.couto@empresa.com.br', papel: 'executivo' },
  { nome: 'Karina Martinelli', email: 'karina.martinelli@empresa.com.br', papel: 'executivo' },
  { nome: 'Gerencia Comercial', email: 'gerente@empresa.com.br', papel: 'gerente' },
];

export function buscarExecutivoPorEmail(email: string): ExecutivoCarteira | undefined {
  const alvo = email.toLowerCase();
  return CARTEIRA.find((e) => e.email.toLowerCase() === alvo);
}

export function autenticar(email: string, senha: string): ExecutivoCarteira | null {
  if (!senha) return null;
  return buscarExecutivoPorEmail(email) ?? null;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run lib/data/carteira.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts lib/data/carteira.ts lib/data/carteira.test.ts package.json
git commit -m "feat: add mock carteira and authentication logic"
```

---

### Task 4: Session cookie and login page

**Files:**
- Create: `lib/auth/constants.ts`
- Create: `lib/auth/session.ts`
- Create: `app/login/actions.ts`
- Create: `app/login/page.tsx`
- Create: `app/rps/page.tsx`

**Interfaces:**
- Consumes: `autenticar`, `ExecutivoCarteira` from Task 3 (`lib/data/carteira.ts`).
- Produces: `NOME_COOKIE_SESSAO` constant, `interface Sessao { nome: string; email: string; papel: Papel }`, `criarSessao(executivo: ExecutivoCarteira): Promise<void>`, `lerSessao(): Promise<Sessao | null>`, `encerrarSessao(): Promise<void>` — used by Task 5's middleware and authenticated layout.

- [ ] **Step 1: Create `lib/auth/constants.ts`**

```ts
export const NOME_COOKIE_SESSAO = 'hub_amplificado_sessao';
```

- [ ] **Step 2: Create `lib/auth/session.ts`**

```ts
import { cookies } from 'next/headers';
import type { ExecutivoCarteira, Papel } from '@/lib/data/carteira';
import { NOME_COOKIE_SESSAO } from './constants';

export interface Sessao {
  nome: string;
  email: string;
  papel: Papel;
}

export async function criarSessao(executivo: ExecutivoCarteira): Promise<void> {
  const sessao: Sessao = { nome: executivo.nome, email: executivo.email, papel: executivo.papel };
  (await cookies()).set(NOME_COOKIE_SESSAO, JSON.stringify(sessao), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

export async function lerSessao(): Promise<Sessao | null> {
  const valor = (await cookies()).get(NOME_COOKIE_SESSAO)?.value;
  if (!valor) return null;
  try {
    return JSON.parse(valor) as Sessao;
  } catch {
    return null;
  }
}

export async function encerrarSessao(): Promise<void> {
  (await cookies()).delete(NOME_COOKIE_SESSAO);
}
```

- [ ] **Step 3: Create `app/login/actions.ts`**

```ts
'use server';

import { redirect } from 'next/navigation';
import { autenticar } from '@/lib/data/carteira';
import { criarSessao } from '@/lib/auth/session';

export interface EstadoLogin {
  erro?: string;
}

export async function entrar(_estado: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = String(formData.get('email') ?? '').trim();
  const senha = String(formData.get('senha') ?? '');

  const executivo = autenticar(email, senha);
  if (!executivo) {
    return { erro: 'E-mail ou senha invalidos.' };
  }

  await criarSessao(executivo);
  redirect('/rps');
}
```

- [ ] **Step 4: Create `app/login/page.tsx`**

```tsx
'use client';

import { useActionState } from 'react';
import { entrar, type EstadoLogin } from './actions';

const estadoInicial: EstadoLogin = {};

const ATALHOS = [
  { email: 'milena.dabul@empresa.com.br', nome: 'Milena Dabul Stork' },
  { email: 'fabio.couto@empresa.com.br', nome: 'Fabio Couto' },
  { email: 'karina.martinelli@empresa.com.br', nome: 'Karina Martinelli' },
  { email: 'gerente@empresa.com.br', nome: 'visao de gerencia' },
];

export default function LoginPage() {
  const [estado, acao, pendente] = useActionState(entrar, estadoInicial);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div
        style={{
          width: 400,
          background: '#fff',
          border: '1px solid var(--cor-borda)',
          borderRadius: 12,
          padding: 32,
          boxShadow: 'var(--sombra-card)',
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '.12em',
            color: 'var(--cor-tinta-terciaria)',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          COMERCIAL AMPLIFICADO
        </p>
        <h1 style={{ fontSize: 22, lineHeight: 1.2, fontWeight: 700, margin: '4px 0 8px' }}>
          Propostas
        </h1>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--cor-tinta-secundaria)',
            margin: '0 0 20px',
          }}
        >
          Acesse para ver suas RPs, gerar propostas e atualizar o status comercial.
        </p>

        <form action={acao}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="nome.sobrenome@empresa.com.br"
            style={{
              width: '100%',
              padding: '10px 11px',
              border: '1px solid var(--cor-borda-input)',
              borderRadius: 7,
              fontSize: 13,
              marginBottom: 14,
            }}
          />

          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }} htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            style={{
              width: '100%',
              padding: '10px 11px',
              border: '1px solid var(--cor-borda-input)',
              borderRadius: 7,
              fontSize: 13,
              marginBottom: 14,
            }}
          />

          {estado.erro && (
            <p style={{ fontSize: 12, color: 'oklch(0.52 0.15 30)', margin: '0 0 14px' }}>
              {estado.erro}
            </p>
          )}

          <button
            type="submit"
            disabled={pendente}
            style={{
              width: '100%',
              padding: '11px',
              background: 'var(--cor-tinta-principal)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              border: 'none',
              borderRadius: 7,
              cursor: pendente ? 'default' : 'pointer',
            }}
          >
            {pendente ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <hr style={{ margin: '20px 0', borderTop: '1px dashed var(--cor-borda)' }} />
        <p
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            color: 'var(--cor-tinta-terciaria)',
            margin: '0 0 8px',
          }}
        >
          Ambiente de demonstracao — qualquer senha
        </p>
        {ATALHOS.map((a) => (
          <p
            key={a.email}
            style={{ fontSize: 11.5, fontFamily: 'var(--fonte-mono)', margin: '4px 0' }}
          >
            {a.email} · {a.nome}
          </p>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Create a temporary placeholder `app/rps/page.tsx`**

This will be replaced in Task 5 by the protected, layout-wrapped version — it exists now only so the login redirect has a real destination to verify against.

```tsx
import { redirect } from 'next/navigation';
import { lerSessao } from '@/lib/auth/session';

export default async function MinhasRPsPage() {
  const sessao = await lerSessao();
  if (!sessao) {
    redirect('/login');
  }

  return (
    <main style={{ padding: 24 }}>
      <p>
        Bem-vindo, {sessao?.nome} ({sessao?.papel}).
      </p>
    </main>
  );
}
```

- [ ] **Step 6: Verify the login flow in the browser**

Run: `npm run dev`, open `http://localhost:3000/login` and confirm:
- Submitting with an email not in the carteira (e.g. `x@empresa.com.br`) and any password shows "E-mail ou senha invalidos."
- Submitting with `milena.dabul@empresa.com.br` and any non-empty password redirects to `/rps` and shows "Bem-vindo, Milena Dabul Stork (executivo)."
- Submitting with `gerente@empresa.com.br` shows "(gerente)".

Stop the dev server after verifying.

- [ ] **Step 7: Commit**

```bash
git add lib/auth/constants.ts lib/auth/session.ts app/login/actions.ts app/login/page.tsx app/rps/page.tsx
git commit -m "feat: add session cookie and login page"
```

---

### Task 5: Protected shell and logout

**Files:**
- Create: `middleware.ts`
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/actions.ts`
- Move: `app/rps/page.tsx` → `app/(app)/rps/page.tsx` (simplified)
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `NOME_COOKIE_SESSAO` from `lib/auth/constants.ts` (Task 4), `lerSessao`/`encerrarSessao` from `lib/auth/session.ts` (Task 4).
- Produces: the authenticated shell (header with executive name/role and "Sair") that Phase 3's "Minhas RPs" screen will render inside of.

- [ ] **Step 1: Create `middleware.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { NOME_COOKIE_SESSAO } from '@/lib/auth/constants';

const ROTAS_PROTEGIDAS = ['/rps'];

export function middleware(request: NextRequest) {
  const temSessao = request.cookies.has(NOME_COOKIE_SESSAO);
  const protegida = ROTAS_PROTEGIDAS.some((rota) => request.nextUrl.pathname.startsWith(rota));

  if (protegida && !temSessao) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/rps/:path*'],
};
```

- [ ] **Step 2: Create `app/(app)/actions.ts`**

```ts
'use server';

import { redirect } from 'next/navigation';
import { encerrarSessao } from '@/lib/auth/session';

export async function sair() {
  await encerrarSessao();
  redirect('/login');
}
```

- [ ] **Step 3: Create `app/(app)/layout.tsx`**

```tsx
import { lerSessao } from '@/lib/auth/session';
import { sair } from './actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao();

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: 'var(--cor-superficie)',
          borderBottom: '1px solid var(--cor-borda)',
          padding: '11px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <strong style={{ fontSize: 13 }}>PROPOSTAS · Comercial Amplificado</strong>
          <span
            style={{
              background: 'var(--cor-tinta-principal)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            Minhas RPs
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{sessao?.nome}</div>
            <div style={{ fontSize: 11, color: 'var(--cor-tinta-secundaria)' }}>
              {sessao?.papel === 'gerente' ? 'Gerente · visao de equipe' : 'Executivo comercial'}
            </div>
          </div>
          <form action={sair}>
            <button
              type="submit"
              style={{
                border: '1px solid var(--cor-borda)',
                background: 'transparent',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
```

- [ ] **Step 4: Move and simplify `app/rps/page.tsx` into `app/(app)/rps/page.tsx`**

```bash
mkdir -p "app/(app)/rps"
git mv app/rps/page.tsx "app/(app)/rps/page.tsx"
```

Replace its contents with:

```tsx
import { lerSessao } from '@/lib/auth/session';

export default async function MinhasRPsPage() {
  const sessao = await lerSessao();

  return (
    <main style={{ padding: 24 }}>
      <p>
        Bem-vindo, {sessao?.nome} ({sessao?.papel}). A listagem de RPs entra na Fase 3.
      </p>
    </main>
  );
}
```

- [ ] **Step 5: Update `app/page.tsx` to redirect based on session**

```tsx
import { redirect } from 'next/navigation';
import { lerSessao } from '@/lib/auth/session';

export default async function RootPage() {
  const sessao = await lerSessao();
  redirect(sessao ? '/rps' : '/login');
}
```

- [ ] **Step 6: Verify end-to-end in the browser**

Run: `npm run dev` and confirm:
- Visiting `http://localhost:3000/rps` directly while logged out redirects to `/login` (middleware working).
- Visiting `http://localhost:3000/` while logged out redirects to `/login`; while logged in, redirects to `/rps`.
- After logging in, `/rps` shows the sticky header with your name, role, and a "Sair" button.
- Clicking "Sair" clears the session and redirects to `/login`; visiting `/rps` afterward redirects to `/login` again.

Stop the dev server after verifying.

- [ ] **Step 7: Commit**

```bash
git add middleware.ts "app/(app)" app/page.tsx
git commit -m "feat: add protected shell, middleware, and logout"
```

---

## Self-Review Notes

- **Spec coverage**: this plan implements only the "Fundação" phase from the spec (stack setup, tema/tokens, login simples with carteira). Motor de regras, Minhas RPs listing, cadastros, and geração de proposta are explicitly out of scope here and will get their own plans once this one is reviewed and running.
- **Type consistency**: `Papel`, `ExecutivoCarteira`, `Sessao`, `NOME_COOKIE_SESSAO`, `criarSessao`/`lerSessao`/`encerrarSessao`, and `autenticar`/`buscarExecutivoPorEmail` are defined once (Tasks 3–4) and reused with identical names/signatures in Tasks 4–5.
- **No placeholders**: every step has literal file contents or literal shell commands; no "add tests for the above" or "TBD" left in the plan.
