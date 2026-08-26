# Fase 3 — Minhas RPs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Minhas RPs" screen — the app's main working surface — with search/filters, a sticky table, multi-selection with the "Disponível + elegível only" rule, and a detail panel, wired to real data from Fase 2's rules engine and scoped to the logged-in executive's own bookings.

**Architecture:** A server component (`app/(app)/rps/page.tsx`) fetches the mock repository, runs it through Fase 2's `listarRpsComElegibilidade`, attaches a default commercial status (no status persistence exists yet — that's Fase 4), and scopes the list to the session's executive before handing it to a client component tree that owns all interactive state (filters, selection, which RP is open in the detail panel). Filtering/selection logic is pure and unit-tested in `lib/rps/`; only rendering lives in `components/rps/`.

**Tech Stack:** Next.js (Server + Client Components), TypeScript, Vitest.

**Spec:** [docs/superpowers/specs/2026-08-25-hub-amplificado-design.md](../specs/2026-08-25-hub-amplificado-design.md)

## Global Constraints

- Scope for this plan is listing + filters + selection + detail panel only. Status changes (modal, histórico events), proposal generation, and the agência/cliente/contato registrations are explicitly **out of scope** — deferred to Fase 4, where they belong together (the registrations only matter once you're generating a proposal). The "Status" and "Gerar proposta" buttons in the detail panel and selection bar render but are **disabled** in this phase — Fase 4 wires them up.
- No RP has a persisted status yet, so every RP defaults to commercial status `'Disponível'` for display purposes in this phase. Build the status type/view-model so Fase 4 can swap in a real persisted status without changing the filter/selection functions' shapes.
- The `executivo` field on `Rp` (from `dados.js`) is "dirty" — e.g. `"Milena Dabul Stork(N)"`, `"Fabio Couto (MV)"` — confirmed by direct inspection of the fixture. Do not attempt fuzzy/prefix matching against the clean carteira name. Each demo executive gets an explicit `executivoRaw` field in the carteira mapping to the exact raw string; a `gerente` has `executivoRaw: null` and sees every RP, unfiltered by executivo.
- Confirmed exact raw values from `dados.js` (verified via direct parse, do not re-derive): `Milena Dabul Stork` → `"Milena Dabul Stork(N)"`; `Fábio Couto` → `"Fabio Couto (MV)"` (note: unaccented "Fabio" in the raw source, matching `dados.js` exactly, even though the carteira's display `nome` stays accented "Fábio Couto"); `Karina Martinelli` → `"Karina Martinelli"` (already clean, no suffix).
- Margem de dias úteis for the prazo rule defaults to 2 (per Fase 2's `Global Constraints`), passed as a literal constant in the page for now — no settings UI exists to change it yet.
- Visual language: reuse the design tokens already in `app/globals.css` (the Globo Slots retheme) — do not introduce new hex/oklch values. Status-to-token mapping (already decided): `Disponível` and `Fechada Ganha` → `--cor-sucesso-*`; `Em negociação` → `--cor-neutro-*`; `Negócio Perdido` → `--cor-erro-*`; `Não elegível` (i.e. `elegivel === false`, which overrides whatever status is set) → `--cor-esgotado-*`.
- Structural layout values (grid columns, sticky offsets, panel width) come from the README's "Tela B" section — reuse them verbatim; only colors are retargeted to the new tokens.
- Language: pt-BR for all identifiers, copy, and test descriptions, with correct diacritics.

---

### Task 1: Identidade — carteira com `executivoRaw` e sessão estendida

**Files:**
- Modify: `lib/data/carteira.ts`
- Modify: `lib/data/carteira.test.ts`
- Modify: `lib/auth/session.ts`
- Modify: `lib/auth/session.test.ts`

**Interfaces:**
- Consumes: existing `ExecutivoCarteira`, `Sessao` shapes from Fase 1.
- Produces: `ExecutivoCarteira.executivoRaw: string | null`, `Sessao.executivoRaw: string | null` — consumed by Task 2 (filtering) and Task 4 (page).

- [ ] **Step 1: Update `lib/data/carteira.ts`**

Replace the file's contents with:

```ts
export type Papel = 'executivo' | 'gerente';

export interface ExecutivoCarteira {
  nome: string;
  email: string;
  papel: Papel;
  executivoRaw: string | null;
}

const CARTEIRA: ExecutivoCarteira[] = [
  {
    nome: 'Milena Dabul Stork',
    email: 'milena.dabul@empresa.com.br',
    papel: 'executivo',
    executivoRaw: 'Milena Dabul Stork(N)',
  },
  {
    nome: 'Fábio Couto',
    email: 'fabio.couto@empresa.com.br',
    papel: 'executivo',
    executivoRaw: 'Fabio Couto (MV)',
  },
  {
    nome: 'Karina Martinelli',
    email: 'karina.martinelli@empresa.com.br',
    papel: 'executivo',
    executivoRaw: 'Karina Martinelli',
  },
  {
    nome: 'Gerência Comercial',
    email: 'gerente@empresa.com.br',
    papel: 'gerente',
    executivoRaw: null,
  },
];

export function buscarExecutivoPorEmail(email: string): ExecutivoCarteira | undefined {
  const alvo = email.toLowerCase();
  return CARTEIRA.find((e) => e.email.toLowerCase() === alvo);
}

export function listarCarteira(): ExecutivoCarteira[] {
  return [...CARTEIRA];
}

export function autenticar(email: string, senha: string): ExecutivoCarteira | null {
  const senhaLimpa = senha.trim();
  if (!senhaLimpa) return null;
  return buscarExecutivoPorEmail(email) ?? null;
}
```

- [ ] **Step 2: Add a test for `executivoRaw` to `lib/data/carteira.test.ts`**

Add this `it` inside the existing `describe('buscarExecutivoPorEmail', ...)` block (after the existing two tests, before the closing `});`):

```ts
  it('inclui o executivoRaw usado para filtrar RPs, e null para o papel gerente', () => {
    expect(buscarExecutivoPorEmail('milena.dabul@empresa.com.br')?.executivoRaw).toBe(
      'Milena Dabul Stork(N)',
    );
    expect(buscarExecutivoPorEmail('gerente@empresa.com.br')?.executivoRaw).toBeNull();
  });
```

- [ ] **Step 3: Run the carteira tests to confirm they still pass**

Run: `npx vitest run lib/data/carteira.test.ts`
Expected: PASS, 6 tests (5 existing + 1 new).

- [ ] **Step 4: Update `lib/auth/session.ts`**

Replace the file's contents with:

```ts
import { cookies } from 'next/headers';
import type { ExecutivoCarteira, Papel } from '@/lib/data/carteira';
import { NOME_COOKIE_SESSAO } from './constants';

export interface Sessao {
  nome: string;
  email: string;
  papel: Papel;
  executivoRaw: string | null;
}

export function ehSessao(valor: unknown): valor is Sessao {
  if (typeof valor !== 'object' || valor === null) return false;
  const candidato = valor as Record<string, unknown>;
  return (
    typeof candidato.nome === 'string' &&
    typeof candidato.email === 'string' &&
    (candidato.papel === 'executivo' || candidato.papel === 'gerente') &&
    (candidato.executivoRaw === null || typeof candidato.executivoRaw === 'string')
  );
}

export async function criarSessao(executivo: ExecutivoCarteira): Promise<void> {
  const sessao: Sessao = {
    nome: executivo.nome,
    email: executivo.email,
    papel: executivo.papel,
    executivoRaw: executivo.executivoRaw,
  };
  (await cookies()).set(NOME_COOKIE_SESSAO, JSON.stringify(sessao), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function lerSessao(): Promise<Sessao | null> {
  const valor = (await cookies()).get(NOME_COOKIE_SESSAO)?.value;
  if (!valor) return null;
  try {
    const dados: unknown = JSON.parse(valor);
    return ehSessao(dados) ? dados : null;
  } catch {
    return null;
  }
}

export async function encerrarSessao(): Promise<void> {
  (await cookies()).delete(NOME_COOKIE_SESSAO);
}
```

- [ ] **Step 5: Update `lib/auth/session.test.ts`**

Replace the file's contents with:

```ts
import { describe, expect, it } from 'vitest';
import { ehSessao } from './session';

describe('ehSessao', () => {
  it('aceita um objeto com o formato correto de sessão (executivo com executivoRaw)', () => {
    expect(
      ehSessao({
        nome: 'Fábio Couto',
        email: 'fabio.couto@empresa.com.br',
        papel: 'executivo',
        executivoRaw: 'Fabio Couto (MV)',
      }),
    ).toBe(true);
  });

  it('aceita um objeto de gerente com executivoRaw nulo', () => {
    expect(
      ehSessao({
        nome: 'Gerência Comercial',
        email: 'gerente@empresa.com.br',
        papel: 'gerente',
        executivoRaw: null,
      }),
    ).toBe(true);
  });

  it('rejeita objeto com campo obrigatório ausente', () => {
    expect(
      ehSessao({ email: 'fabio.couto@empresa.com.br', papel: 'executivo', executivoRaw: null }),
    ).toBe(false);
  });

  it('rejeita objeto com valor de papel inválido', () => {
    expect(
      ehSessao({
        nome: 'Fábio Couto',
        email: 'fabio.couto@empresa.com.br',
        papel: 'admin',
        executivoRaw: null,
      }),
    ).toBe(false);
  });

  it('rejeita executivoRaw que não é string nem null', () => {
    expect(
      ehSessao({
        nome: 'Fábio Couto',
        email: 'fabio.couto@empresa.com.br',
        papel: 'executivo',
        executivoRaw: 42,
      }),
    ).toBe(false);
  });

  it('rejeita valores que não são objetos', () => {
    expect(ehSessao(null)).toBe(false);
    expect(ehSessao('sessao')).toBe(false);
    expect(ehSessao(42)).toBe(false);
  });
});
```

- [ ] **Step 6: Run the session tests to confirm they pass**

Run: `npx vitest run lib/auth/session.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 7: Run the full suite and typecheck to confirm nothing else broke**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass (32 pre-existing + 1 new in carteira.test.ts + 2 new in session.test.ts = 35), zero type errors. `app/login/actions.ts` calls `criarSessao(executivo)` with an `ExecutivoCarteira` that now includes `executivoRaw` — no change needed there since it passes the whole object through.

- [ ] **Step 8: Commit**

```bash
git add lib/data/carteira.ts lib/data/carteira.test.ts lib/auth/session.ts lib/auth/session.test.ts
git commit -m "feat: add executivoRaw to carteira and session for RP scoping"
```

---

### Task 2: `RpComStatus` — modelo de view com status comercial

**Files:**
- Create: `lib/rps/rpComStatus.ts`
- Test: `lib/rps/rpComStatus.test.ts`

**Interfaces:**
- Consumes: `Rp` from `lib/data/rp.ts` (Fase 2).
- Produces: `type StatusComercial`, `interface RpComStatus extends Rp { status: StatusComercial }`, `paraRpComStatus(rp: Rp): RpComStatus` — consumed by Task 3, Task 4, Task 5.

- [ ] **Step 1: Write the failing test — `lib/rps/rpComStatus.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import type { Rp } from '@/lib/data/rp';
import { paraRpComStatus } from './rpComStatus';

function criarRpDeTeste(overrides: Partial<Rp> = {}): Rp {
  return {
    rp: '999999',
    anunciante: 'Anunciante Teste',
    cnpj: '00.000.000/0000-00',
    executivo: 'Executivo Teste',
    setor: 'Setor Teste',
    exib: 'RJ',
    portfolio: 'PORTFOLIO TESTE',
    cm: '000000',
    linhas: [],
    nDatas: 0,
    elegivel: true,
    motivos: [],
    valorTabela: 0,
    ...overrides,
  };
}

describe('paraRpComStatus', () => {
  it('atribui status "Disponível" por padrão, já que não há persistência de status ainda', () => {
    const rp = criarRpDeTeste();
    expect(paraRpComStatus(rp).status).toBe('Disponível');
  });

  it('preserva todos os campos originais da RP', () => {
    const rp = criarRpDeTeste({ rp: '702290', anunciante: 'SAERJ', valorTabela: 753984 });
    const resultado = paraRpComStatus(rp);
    expect(resultado.rp).toBe('702290');
    expect(resultado.anunciante).toBe('SAERJ');
    expect(resultado.valorTabela).toBe(753984);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/rps/rpComStatus.test.ts`
Expected: FAIL with a module-not-found error for `./rpComStatus`.

- [ ] **Step 3: Write the minimal implementation — `lib/rps/rpComStatus.ts`**

```ts
import type { Rp } from '@/lib/data/rp';

export type StatusComercial = 'Disponível' | 'Em negociação' | 'Fechada Ganha' | 'Negócio Perdido';

export interface RpComStatus extends Rp {
  status: StatusComercial;
}

export function paraRpComStatus(rp: Rp): RpComStatus {
  return { ...rp, status: 'Disponível' };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/rps/rpComStatus.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/rps/rpComStatus.ts lib/rps/rpComStatus.test.ts
git commit -m "feat: add RpComStatus view model with default commercial status"
```

---

### Task 3: Filtros, escopo por carteira e regras de seleção

**Files:**
- Create: `lib/rps/regrasLista.ts`
- Test: `lib/rps/regrasLista.test.ts`

**Interfaces:**
- Consumes: `RpComStatus`, `StatusComercial` from `lib/rps/rpComStatus.ts` (Task 2); `Papel` from `lib/data/carteira.ts` (Task 1).
- Produces: `interface FiltrosRps`, `filtrarRps(rps: RpComStatus[], filtros: FiltrosRps): RpComStatus[]`, `minhasRps(rps: RpComStatus[], papel: Papel, executivoRaw: string | null): RpComStatus[]`, `ehSelecionavel(rp: RpComStatus): boolean`, `type EstadoSelecaoTodas = 'nenhuma' | 'parcial' | 'todas'`, `estadoSelecaoTodas(rps: RpComStatus[], selecionadas: string[]): EstadoSelecaoTodas`, `interface ResumoSelecao { quantidade: number; totalTabela: number; anunciantesDistintos: number }`, `resumoSelecao(rps: RpComStatus[], selecionadas: string[]): ResumoSelecao` — all consumed by Task 4.

- [ ] **Step 1: Write the failing test — `lib/rps/regrasLista.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import type { RpComStatus } from './rpComStatus';
import {
  estadoSelecaoTodas,
  ehSelecionavel,
  filtrarRps,
  minhasRps,
  resumoSelecao,
} from './regrasLista';

function criarRpDeTeste(overrides: Partial<RpComStatus> = {}): RpComStatus {
  return {
    rp: '999999',
    anunciante: 'Anunciante Teste',
    cnpj: '00.000.000/0000-00',
    executivo: 'Executivo Teste',
    setor: 'Setor Teste',
    exib: 'RJ',
    portfolio: 'PORTFOLIO TESTE',
    cm: '000000',
    linhas: [],
    nDatas: 0,
    elegivel: true,
    motivos: [],
    valorTabela: 100,
    status: 'Disponível',
    ...overrides,
  };
}

describe('filtrarRps', () => {
  const rps = [
    criarRpDeTeste({ rp: '1', anunciante: 'SAERJ', cnpj: '10.554.856/0001-62', exib: 'RJ', status: 'Disponível', elegivel: true }),
    criarRpDeTeste({ rp: '2', anunciante: 'ELETROBRAS', cnpj: '00.001.180/0001-26', exib: 'NET', status: 'Em negociação', elegivel: true }),
    criarRpDeTeste({ rp: '3', anunciante: 'SAERJ', cnpj: '10.554.856/0001-62', exib: 'SP1', status: 'Disponível', elegivel: false, motivos: ['Sem preço'] }),
  ];

  it('filtra por texto de busca (RP, anunciante ou CNPJ)', () => {
    expect(filtrarRps(rps, { busca: 'SAERJ', praca: '', status: '', elegibilidade: 'todas', executivo: '' })).toHaveLength(2);
    expect(filtrarRps(rps, { busca: '10.554.856', praca: '', status: '', elegibilidade: 'todas', executivo: '' })).toHaveLength(2);
    expect(filtrarRps(rps, { busca: 'rp 2', praca: '', status: '', elegibilidade: 'todas', executivo: '' })).toHaveLength(0);
  });

  it('filtra por praça', () => {
    expect(filtrarRps(rps, { busca: '', praca: 'NET', status: '', elegibilidade: 'todas', executivo: '' })).toHaveLength(1);
  });

  it('filtra por status comercial', () => {
    expect(filtrarRps(rps, { busca: '', praca: '', status: 'Em negociação', elegibilidade: 'todas', executivo: '' })).toHaveLength(1);
  });

  it('filtra por elegibilidade', () => {
    expect(filtrarRps(rps, { busca: '', praca: '', status: '', elegibilidade: 'sim', executivo: '' })).toHaveLength(2);
    expect(filtrarRps(rps, { busca: '', praca: '', status: '', elegibilidade: 'nao', executivo: '' })).toHaveLength(1);
  });

  it('sem filtros ativos, retorna todas as RPs', () => {
    expect(filtrarRps(rps, { busca: '', praca: '', status: '', elegibilidade: 'todas', executivo: '' })).toHaveLength(3);
  });
});

describe('minhasRps', () => {
  const rps = [
    criarRpDeTeste({ rp: '1', executivo: 'Milena Dabul Stork(N)' }),
    criarRpDeTeste({ rp: '2', executivo: 'Fabio Couto (MV)' }),
  ];

  it('para papel executivo, retorna só as RPs cujo executivo bate com o executivoRaw', () => {
    expect(minhasRps(rps, 'executivo', 'Milena Dabul Stork(N)')).toEqual([rps[0]]);
  });

  it('para papel gerente, retorna todas as RPs independente do executivoRaw', () => {
    expect(minhasRps(rps, 'gerente', null)).toHaveLength(2);
  });
});

describe('ehSelecionavel', () => {
  it('é selecionável quando elegível e status Disponível', () => {
    expect(ehSelecionavel(criarRpDeTeste({ elegivel: true, status: 'Disponível' }))).toBe(true);
  });

  it('não é selecionável quando não elegível', () => {
    expect(ehSelecionavel(criarRpDeTeste({ elegivel: false, status: 'Disponível' }))).toBe(false);
  });

  it('não é selecionável quando o status não é Disponível', () => {
    expect(ehSelecionavel(criarRpDeTeste({ elegivel: true, status: 'Em negociação' }))).toBe(false);
  });
});

describe('estadoSelecaoTodas', () => {
  const rps = [
    criarRpDeTeste({ rp: '1', elegivel: true, status: 'Disponível' }),
    criarRpDeTeste({ rp: '2', elegivel: true, status: 'Disponível' }),
    criarRpDeTeste({ rp: '3', elegivel: false, status: 'Disponível' }),
  ];

  it('retorna "nenhuma" quando nada está marcado', () => {
    expect(estadoSelecaoTodas(rps, [])).toBe('nenhuma');
  });

  it('retorna "parcial" quando algumas selecionáveis estão marcadas', () => {
    expect(estadoSelecaoTodas(rps, ['1'])).toBe('parcial');
  });

  it('retorna "todas" quando todas as selecionáveis estão marcadas (RP não selecionável não conta)', () => {
    expect(estadoSelecaoTodas(rps, ['1', '2'])).toBe('todas');
  });
});

describe('resumoSelecao', () => {
  const rps = [
    criarRpDeTeste({ rp: '1', anunciante: 'SAERJ', valorTabela: 100 }),
    criarRpDeTeste({ rp: '2', anunciante: 'ELETROBRAS', valorTabela: 250 }),
  ];

  it('soma o valor de tabela e conta anunciantes distintos das RPs selecionadas', () => {
    const resumo = resumoSelecao(rps, ['1', '2']);
    expect(resumo.quantidade).toBe(2);
    expect(resumo.totalTabela).toBe(350);
    expect(resumo.anunciantesDistintos).toBe(2);
  });

  it('conta um único anunciante quando as RPs selecionadas são do mesmo cliente', () => {
    const mesmoAnunciante = [
      criarRpDeTeste({ rp: '1', anunciante: 'SAERJ', valorTabela: 100 }),
      criarRpDeTeste({ rp: '2', anunciante: 'SAERJ', valorTabela: 250 }),
    ];
    expect(resumoSelecao(mesmoAnunciante, ['1', '2']).anunciantesDistintos).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/rps/regrasLista.test.ts`
Expected: FAIL with a module-not-found error for `./regrasLista`.

- [ ] **Step 3: Write the minimal implementation — `lib/rps/regrasLista.ts`**

```ts
import type { Papel } from '@/lib/data/carteira';
import type { RpComStatus, StatusComercial } from './rpComStatus';

export interface FiltrosRps {
  busca: string;
  praca: string;
  status: StatusComercial | '';
  elegibilidade: 'todas' | 'sim' | 'nao';
  executivo: string;
}

export function filtrarRps(rps: RpComStatus[], filtros: FiltrosRps): RpComStatus[] {
  const busca = filtros.busca.trim().toLowerCase();

  return rps.filter((rp) => {
    if (busca && !`${rp.rp} ${rp.anunciante} ${rp.cnpj}`.toLowerCase().includes(busca)) {
      return false;
    }
    if (filtros.praca && rp.exib !== filtros.praca) {
      return false;
    }
    if (filtros.status && rp.status !== filtros.status) {
      return false;
    }
    if (filtros.elegibilidade === 'sim' && !rp.elegivel) {
      return false;
    }
    if (filtros.elegibilidade === 'nao' && rp.elegivel) {
      return false;
    }
    if (filtros.executivo && rp.executivo !== filtros.executivo) {
      return false;
    }
    return true;
  });
}

export function minhasRps(
  rps: RpComStatus[],
  papel: Papel,
  executivoRaw: string | null
): RpComStatus[] {
  if (papel === 'gerente') {
    return rps;
  }
  return rps.filter((rp) => rp.executivo === executivoRaw);
}

export function ehSelecionavel(rp: RpComStatus): boolean {
  return rp.elegivel && rp.status === 'Disponível';
}

export type EstadoSelecaoTodas = 'nenhuma' | 'parcial' | 'todas';

export function estadoSelecaoTodas(rps: RpComStatus[], selecionadas: string[]): EstadoSelecaoTodas {
  const selecionaveis = rps.filter(ehSelecionavel);
  if (selecionaveis.length === 0) {
    return 'nenhuma';
  }
  const marcadas = selecionaveis.filter((rp) => selecionadas.includes(rp.rp)).length;
  if (marcadas === 0) {
    return 'nenhuma';
  }
  if (marcadas === selecionaveis.length) {
    return 'todas';
  }
  return 'parcial';
}

export interface ResumoSelecao {
  quantidade: number;
  totalTabela: number;
  anunciantesDistintos: number;
}

export function resumoSelecao(rps: RpComStatus[], selecionadas: string[]): ResumoSelecao {
  const selecionadasRps = rps.filter((rp) => selecionadas.includes(rp.rp));
  return {
    quantidade: selecionadasRps.length,
    totalTabela: selecionadasRps.reduce((soma, rp) => soma + rp.valorTabela, 0),
    anunciantesDistintos: new Set(selecionadasRps.map((rp) => rp.anunciante)).size,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/rps/regrasLista.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/rps/regrasLista.ts lib/rps/regrasLista.test.ts
git commit -m "feat: add RP list filtering, carteira scoping, and selection rules"
```

---

### Task 4: Componente de badge de status/elegibilidade

**Files:**
- Create: `components/rps/BadgeStatus.tsx`

**Interfaces:**
- Consumes: `StatusComercial` from `lib/rps/rpComStatus.ts` (Task 2).
- Produces: `<BadgeStatus status={StatusComercial} elegivel={boolean} />` — a presentational component consumed by Task 5 and Task 6.

- [ ] **Step 1: Create `components/rps/BadgeStatus.tsx`**

```tsx
import type { StatusComercial } from '@/lib/rps/rpComStatus';

interface BadgeStatusProps {
  status: StatusComercial;
  elegivel: boolean;
}

const CORES: Record<string, { texto: string; fundo: string; borda: string }> = {
  Disponível: {
    texto: 'var(--cor-sucesso-texto)',
    fundo: 'var(--cor-sucesso-fundo)',
    borda: 'var(--cor-sucesso-borda)',
  },
  'Em negociação': {
    texto: 'var(--cor-neutro-texto)',
    fundo: 'var(--cor-neutro-fundo)',
    borda: 'var(--cor-neutro-borda)',
  },
  'Fechada Ganha': {
    texto: 'var(--cor-sucesso-texto)',
    fundo: 'var(--cor-sucesso-fundo)',
    borda: 'var(--cor-sucesso-borda)',
  },
  'Negócio Perdido': {
    texto: 'var(--cor-erro-texto)',
    fundo: 'var(--cor-erro-fundo)',
    borda: 'var(--cor-erro-borda)',
  },
  'Não elegível': {
    texto: 'var(--cor-esgotado-texto)',
    fundo: 'var(--cor-esgotado-fundo)',
    borda: 'var(--cor-esgotado-borda)',
  },
};

export function BadgeStatus({ status, elegivel }: BadgeStatusProps) {
  const rotulo = elegivel ? status : 'Não elegível';
  const cor = CORES[rotulo];

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 'var(--raio-badge)',
        color: cor.texto,
        background: cor.fundo,
        border: `1px solid ${cor.borda}`,
        whiteSpace: 'nowrap',
      }}
    >
      {rotulo}
    </span>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors (this component isn't used anywhere yet, but must typecheck standalone).

- [ ] **Step 3: Commit**

```bash
git add components/rps/BadgeStatus.tsx
git commit -m "feat: add BadgeStatus component for RP status/eligibility"
```

---

### Task 5: Página "Minhas RPs" — filtros, tabela e barra de seleção

**Files:**
- Modify: `app/(app)/rps/page.tsx`
- Create: `components/rps/ListaRps.tsx`

**Interfaces:**
- Consumes: `lerSessao` from `lib/auth/session.ts` (Fase 1/Task 1); `criarRepositorioMock` from `lib/data/repositorioRps.ts` (Fase 2); `listarRpsComElegibilidade` from `lib/regras/motor.ts` (Fase 2); `paraRpComStatus`, `RpComStatus` from `lib/rps/rpComStatus.ts` (Task 2); `filtrarRps`, `minhasRps`, `ehSelecionavel`, `estadoSelecaoTodas`, `resumoSelecao`, `FiltrosRps` from `lib/rps/regrasLista.ts` (Task 3); `BadgeStatus` from `components/rps/BadgeStatus.tsx` (Task 4); `Sessao` from `lib/auth/session.ts`.
- Produces: the rendered "Minhas RPs" screen; `<ListaRps>`'s internal `detalheId` state is consumed by Task 6, which this task's `ListaRps.tsx` will import and render in the right-hand panel slot (Task 6 adds the import and render call — this task ships `ListaRps.tsx` with an empty-state placeholder in that slot so the screen is complete and testable on its own first).

- [ ] **Step 1: Replace `app/(app)/rps/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { lerSessao } from '@/lib/auth/session';
import { criarRepositorioMock } from '@/lib/data/repositorioRps';
import { listarRpsComElegibilidade } from '@/lib/regras/motor';
import { paraRpComStatus } from '@/lib/rps/rpComStatus';
import { minhasRps } from '@/lib/rps/regrasLista';
import { ListaRps } from '@/components/rps/ListaRps';

const MARGEM_DIAS_UTEIS = 2;

export default async function MinhasRPsPage() {
  const sessao = await lerSessao();
  if (!sessao) {
    redirect('/login');
  }

  const repositorio = criarRepositorioMock();
  const rpsComElegibilidade = listarRpsComElegibilidade(repositorio, new Date(), MARGEM_DIAS_UTEIS);
  const rpsComStatus = rpsComElegibilidade.map(paraRpComStatus);
  const rps = minhasRps(rpsComStatus, sessao.papel, sessao.executivoRaw);

  return <ListaRps rps={rps} sessao={sessao} />;
}
```

- [ ] **Step 2: Create `components/rps/ListaRps.tsx`**

```tsx
'use client';

import { useMemo, useState } from 'react';
import type { Sessao } from '@/lib/auth/session';
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import {
  ehSelecionavel,
  estadoSelecaoTodas,
  filtrarRps,
  resumoSelecao,
  type FiltrosRps,
} from '@/lib/rps/regrasLista';
import { BadgeStatus } from './BadgeStatus';

interface ListaRpsProps {
  rps: RpComStatus[];
  sessao: Sessao;
}

const FILTROS_INICIAIS: FiltrosRps = {
  busca: '',
  praca: '',
  status: '',
  elegibilidade: 'todas',
  executivo: '',
};

function money(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
}

export function ListaRps({ rps, sessao }: ListaRpsProps) {
  const [filtros, setFiltros] = useState<FiltrosRps>(FILTROS_INICIAIS);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const pracas = useMemo(() => [...new Set(rps.map((rp) => rp.exib))].sort(), [rps]);
  const executivos = useMemo(() => [...new Set(rps.map((rp) => rp.executivo))].sort(), [rps]);
  const filtradas = useMemo(() => filtrarRps(rps, filtros), [rps, filtros]);
  const estadoTodas = estadoSelecaoTodas(filtradas, selecionadas);
  const resumo = resumoSelecao(rps, selecionadas);

  function alternarSelecao(rp: string) {
    setSelecionadas((atual) => (atual.includes(rp) ? atual.filter((id) => id !== rp) : [...atual, rp]));
  }

  function alternarTodas() {
    const selecionaveisFiltradas = filtradas.filter(ehSelecionavel).map((rp) => rp.rp);
    if (estadoTodas === 'todas') {
      setSelecionadas((atual) => atual.filter((id) => !selecionaveisFiltradas.includes(id)));
    } else {
      setSelecionadas((atual) => [...new Set([...atual, ...selecionaveisFiltradas])]);
    }
  }

  return (
    <div>
      <div
        style={{
          padding: '12px 22px',
          background: 'var(--cor-superficie)',
          borderBottom: '1px solid var(--cor-borda)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <input
          value={filtros.busca}
          onChange={(evento) => setFiltros({ ...filtros, busca: evento.target.value })}
          placeholder="Buscar RP, anunciante ou CNPJ"
          style={{
            width: 250,
            padding: '8px 10px',
            border: '1px solid var(--cor-borda-input)',
            borderRadius: 'var(--raio-input)',
            fontSize: 13,
          }}
        />
        <select
          value={filtros.praca}
          onChange={(evento) => setFiltros({ ...filtros, praca: evento.target.value })}
          style={{ padding: '8px 10px', border: '1px solid var(--cor-borda-input)', borderRadius: 'var(--raio-input)', fontSize: 13 }}
        >
          <option value="">Praça: todas</option>
          {pracas.map((praca) => (
            <option key={praca} value={praca}>
              {praca}
            </option>
          ))}
        </select>
        <select
          value={filtros.status}
          onChange={(evento) => setFiltros({ ...filtros, status: evento.target.value as FiltrosRps['status'] })}
          style={{ padding: '8px 10px', border: '1px solid var(--cor-borda-input)', borderRadius: 'var(--raio-input)', fontSize: 13 }}
        >
          <option value="">Status: todos</option>
          <option value="Disponível">Disponível</option>
          <option value="Em negociação">Em negociação</option>
          <option value="Fechada Ganha">Fechada Ganha</option>
          <option value="Negócio Perdido">Negócio Perdido</option>
        </select>
        <select
          value={filtros.elegibilidade}
          onChange={(evento) =>
            setFiltros({ ...filtros, elegibilidade: evento.target.value as FiltrosRps['elegibilidade'] })
          }
          style={{ padding: '8px 10px', border: '1px solid var(--cor-borda-input)', borderRadius: 'var(--raio-input)', fontSize: 13 }}
        >
          <option value="todas">Elegibilidade: toda</option>
          <option value="sim">Só elegíveis</option>
          <option value="nao">Só não elegíveis</option>
        </select>
        {sessao.papel === 'gerente' && (
          <select
            value={filtros.executivo}
            onChange={(evento) => setFiltros({ ...filtros, executivo: evento.target.value })}
            style={{ padding: '8px 10px', border: '1px solid var(--cor-borda-input)', borderRadius: 'var(--raio-input)', fontSize: 13 }}
          >
            <option value="">Executivo: todos</option>
            {executivos.map((executivo) => (
              <option key={executivo} value={executivo}>
                {executivo}
              </option>
            ))}
          </select>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--cor-tinta-secundaria)' }}>
          {filtradas.length} de {rps.length} RPs
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 336px' }}>
        <div>
          <div
            style={{
              position: 'sticky',
              top: 53,
              display: 'grid',
              gridTemplateColumns: '28px 72px minmax(110px,1fr) 44px 96px 104px',
              gap: 8,
              padding: '11px 16px',
              background: 'var(--cor-cabecalho-tabela)',
              fontSize: 9.5,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: 'var(--cor-tinta-terciaria)',
            }}
          >
            <input
              type="checkbox"
              ref={(elemento) => {
                if (elemento) elemento.indeterminate = estadoTodas === 'parcial';
              }}
              checked={estadoTodas === 'todas'}
              onChange={alternarTodas}
            />
            <span>RP</span>
            <span>Anunciante</span>
            <span>Praça</span>
            <span style={{ textAlign: 'right' }}>Tabela</span>
            <span>Status</span>
          </div>

          {filtradas.map((rp) => {
            const selecionavel = ehSelecionavel(rp);
            const aberta = detalheId === rp.rp;
            const marcada = selecionadas.includes(rp.rp);

            return (
              <div
                key={rp.rp}
                onClick={() => setDetalheId(rp.rp)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 72px minmax(110px,1fr) 44px 96px 104px',
                  gap: 8,
                  padding: '11px 16px',
                  borderBottom: '1px solid var(--cor-borda-sutil)',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: aberta ? 'var(--cor-linha-marcada)' : 'transparent',
                  color: rp.elegivel ? 'var(--cor-tinta-principal)' : 'var(--cor-tinta-terciaria)',
                }}
              >
                <input
                  type="checkbox"
                  disabled={!selecionavel}
                  checked={marcada}
                  onClick={(evento) => evento.stopPropagation()}
                  onChange={() => alternarSelecao(rp.rp)}
                />
                <span style={{ fontWeight: 600, fontSize: 12 }}>{rp.rp}</span>
                <span style={{ fontSize: 12.5 }}>
                  {rp.anunciante} <span style={{ color: 'var(--cor-tinta-terciaria)' }}>· {rp.linhas.length} linhas</span>
                </span>
                <span style={{ fontSize: 12 }}>{rp.exib}</span>
                <span style={{ fontSize: 12, textAlign: 'right' }}>{rp.elegivel ? money(rp.valorTabela) : '—'}</span>
                <BadgeStatus status={rp.status} elegivel={rp.elegivel} />
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: 'sticky',
            top: 53,
            height: 'calc(100vh - 53px)',
            overflowY: 'auto',
            borderLeft: '1px solid var(--cor-borda)',
            padding: 16,
          }}
        >
          {!detalheId && (
            <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--cor-tinta-terciaria)' }}>
              Selecione uma RP na lista para ver o detalhamento por programa, o valor unitário calculado
              e gerar uma proposta.
            </p>
          )}
        </div>
      </div>

      {selecionadas.length > 0 && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: 'var(--cor-marca)',
            color: '#fff',
            padding: '10px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12.5,
          }}
        >
          <span>
            {resumo.quantidade} RPs Disponíveis · {money(resumo.totalTabela)}
            {resumo.anunciantesDistintos > 1 ? ` · proposta única com ${resumo.anunciantesDistintos} anunciantes` : ''}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              disabled
              style={{
                border: '1px solid #fff',
                background: 'transparent',
                color: '#fff',
                borderRadius: 'var(--raio-botao)',
                padding: '7px 14px',
                fontSize: 12,
                opacity: 0.5,
                cursor: 'not-allowed',
              }}
            >
              Alterar status
            </button>
            <button
              type="button"
              disabled
              style={{
                border: 'none',
                background: '#fff',
                color: 'var(--cor-tinta-principal)',
                borderRadius: 'var(--raio-botao)',
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 600,
                opacity: 0.5,
                cursor: 'not-allowed',
              }}
            >
              Gerar proposta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify manually in the browser**

Run: `npm run dev`, log in as `milena.dabul@empresa.com.br` (any password), land on `/rps`, and confirm:
- Only RPs whose `executivo` matches `"Milena Dabul Stork(N)"` are listed (not all 408).
- Typing in the search box filters by RP number, anunciante, or CNPJ.
- The Praça/Status/Elegibilidade selects filter the list.
- Clicking a row highlights it (background changes).
- Checking a row's checkbox is only possible when the RP is eligible and shows badge "Disponível" — ineligible rows show a disabled checkbox.
- Checking one or more boxes shows the sticky selection bar at the bottom with the correct count and sum.
- The header checkbox shows the indeterminate state (dash) when some but not all selectable rows in the filtered view are checked.
- Log out and log back in as `gerente@empresa.com.br` — confirm ALL RPs are visible (not scoped to one executive) and an "Executivo: todos" filter select appears.

Stop the dev server after verifying.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/rps/page.tsx" components/rps/ListaRps.tsx
git commit -m "feat: add Minhas RPs listing with filters and selection"
```

---

### Task 6: Painel de detalhe

**Files:**
- Create: `components/rps/PainelDetalhe.tsx`
- Modify: `components/rps/ListaRps.tsx`

**Interfaces:**
- Consumes: `RpComStatus` from `lib/rps/rpComStatus.ts` (Task 2); `BadgeStatus` from `components/rps/BadgeStatus.tsx` (Task 4).
- Produces: `<PainelDetalhe rp={RpComStatus} />`, rendered by `ListaRps.tsx` in place of the empty-state placeholder from Task 5 when `detalheId` is set.

- [ ] **Step 1: Create `components/rps/PainelDetalhe.tsx`**

```tsx
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import { BadgeStatus } from './BadgeStatus';

interface PainelDetalheProps {
  rp: RpComStatus;
}

function money(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
}

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--cor-superficie-suave)',
  border: '1px solid var(--cor-borda)',
  borderRadius: 'var(--raio-cartao)',
  padding: 10,
};

const RODAPE_LABEL: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  color: 'var(--cor-tinta-terciaria)',
  margin: '0 0 4px',
};

export function PainelDetalhe({ rp }: PainelDetalheProps) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>RP {rp.rp}</h2>
        <BadgeStatus status={rp.status} elegivel={rp.elegivel} />
      </div>
      <p style={{ fontSize: 13, margin: '0 0 2px' }}>{rp.anunciante}</p>
      <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--cor-tinta-secundaria)', margin: '0 0 14px' }}>
        {rp.cnpj}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div style={CARD_STYLE}>
          <p style={RODAPE_LABEL}>Praça</p>
          <p style={{ fontSize: 12.5, margin: 0 }}>{rp.exib}</p>
        </div>
        <div style={CARD_STYLE}>
          <p style={RODAPE_LABEL}>Portfólio</p>
          <p style={{ fontSize: 12.5, margin: 0 }}>{rp.portfolio}</p>
        </div>
        <div style={CARD_STYLE}>
          <p style={RODAPE_LABEL}>Executivo</p>
          <p style={{ fontSize: 12.5, margin: 0 }}>{rp.executivo}</p>
        </div>
        <div style={CARD_STYLE}>
          <p style={RODAPE_LABEL}>Setor</p>
          <p style={{ fontSize: 12.5, margin: 0 }}>{rp.setor}</p>
        </div>
      </div>

      {!rp.elegivel && (
        <div
          style={{
            border: '1px solid var(--cor-erro-borda)',
            background: 'var(--cor-erro-fundo)',
            borderRadius: 'var(--raio-cartao)',
            padding: 10,
            marginBottom: 14,
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--cor-erro-texto)', margin: '0 0 6px' }}>
            Não elegível
          </p>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: 'var(--cor-erro-texto)' }}>
            {rp.motivos.map((motivo) => (
              <li key={motivo}>{motivo}</li>
            ))}
          </ul>
        </div>
      )}

      <p style={RODAPE_LABEL}>Linhas · unitário × datas</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, marginBottom: 10 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--cor-tinta-terciaria)', fontSize: 9.5, textTransform: 'uppercase' }}>
            <th style={{ fontWeight: 600, paddingBottom: 4 }}>Programa</th>
            <th style={{ fontWeight: 600, paddingBottom: 4 }}>Seg</th>
            <th style={{ fontWeight: 600, paddingBottom: 4 }}>Dt</th>
            <th style={{ fontWeight: 600, paddingBottom: 4, textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rp.linhas.map((linha) => (
            <tr key={linha.chave} style={{ borderTop: '1px solid var(--cor-borda-sutil)' }}>
              <td style={{ padding: '6px 0' }}>
                {linha.programa}{' '}
                <span style={{ fontSize: 10, color: 'var(--cor-tinta-terciaria)' }}>{linha.chave}</span>
              </td>
              <td style={{ padding: '6px 0' }}>{linha.secund}″</td>
              <td style={{ padding: '6px 0' }}>{linha.nDatas}</td>
              <td style={{ padding: '6px 0', textAlign: 'right' }}>
                {linha.total !== null ? money(linha.total) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
        <span>Total de tabela</span>
        <span>{rp.elegivel ? money(rp.valorTabela) : '—'}</span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--cor-tinta-terciaria)', marginBottom: 16 }}>
        {rp.nDatas} datas de exibição · {rp.linhas.length} combinações programa/segundagem
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          disabled
          style={{
            flex: 1,
            padding: 9,
            border: '1px solid var(--cor-borda-forte)',
            background: 'transparent',
            borderRadius: 'var(--raio-botao)',
            fontSize: 12,
            fontWeight: 600,
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        >
          Status
        </button>
        <button
          type="button"
          disabled
          style={{
            flex: 1.4,
            padding: 9,
            border: 'none',
            background: rp.elegivel ? 'var(--gradiente-marca)' : 'var(--cor-desabilitado-fundo)',
            color: rp.elegivel ? '#fff' : 'var(--cor-desabilitado-texto)',
            borderRadius: 'var(--raio-botao)',
            fontSize: 12,
            fontWeight: 600,
            opacity: 0.6,
            cursor: 'not-allowed',
          }}
        >
          Gerar proposta
        </button>
      </div>

      <p style={RODAPE_LABEL}>Histórico</p>
      <p style={{ fontSize: 11.5, color: 'var(--cor-tinta-terciaria)' }}>
        Nenhum evento registrado ainda — a atualização de status entra na Fase 4.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `components/rps/ListaRps.tsx`**

Add the import at the top of the file (with the other local imports):

```ts
import { PainelDetalhe } from './PainelDetalhe';
```

Replace the detail-panel `<div>` block (the one with `position: 'sticky', top: 53, ...`) so it renders `PainelDetalhe` when a RP is open, keeping the existing empty-state paragraph for when nothing is selected:

```tsx
        <div
          style={{
            position: 'sticky',
            top: 53,
            height: 'calc(100vh - 53px)',
            overflowY: 'auto',
            borderLeft: '1px solid var(--cor-borda)',
            padding: 16,
          }}
        >
          {detalheId ? (
            (() => {
              const rpAberta = rps.find((rp) => rp.rp === detalheId);
              return rpAberta ? (
                <PainelDetalhe rp={rpAberta} />
              ) : (
                <p style={{ fontSize: 12.5, color: 'var(--cor-tinta-terciaria)' }}>RP não encontrada.</p>
              );
            })()
          ) : (
            <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--cor-tinta-terciaria)' }}>
              Selecione uma RP na lista para ver o detalhamento por programa, o valor unitário calculado
              e gerar uma proposta.
            </p>
          )}
        </div>
```

Note: the panel looks up `rpAberta` from the full `rps` prop (not `filtradas`), so the detail panel stays open and correct even if the user changes a filter after opening a RP.

- [ ] **Step 3: Verify manually in the browser**

Run: `npm run dev`, log in, and confirm:
- Clicking a row shows the detail panel: RP number + badge, anunciante, CNPJ, the 4 metadata cards (Praça, Portfólio, Executivo, Setor), the linhas table with per-row totals, the total de tabela line, and the disabled "Status"/"Gerar proposta" buttons.
- Clicking a non-eligible RP shows the red "Não elegível" box listing its `motivos`, and its "Gerar proposta" button renders in the disabled/greyed style (not the gradient).
- The "Gerar proposta" button on an eligible RP shows the brand gradient background (even though it's disabled).

Stop the dev server after verifying.

- [ ] **Step 4: Run the full suite and typecheck one more time**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all 50 tests pass (35 from Task 1/pre-existing + 2 from Task 2 + 13 from Task 3), zero type errors.

- [ ] **Step 5: Commit**

```bash
git add components/rps/PainelDetalhe.tsx components/rps/ListaRps.tsx
git commit -m "feat: add RP detail panel"
```

---

## Self-Review Notes

- **Spec coverage**: implements the README's Tela B (Minhas RPs) structure — header filter bar, sticky table with the exact grid columns, badges, selection bar, and detail panel — scoped to the logged-in executive via the carteira mapping. Explicitly deferred: status-change modal, proposal generation modal, histórico events, and agência/cliente/contato registrations (all Fase 4, where the registrations are actually consumed).
- **Type consistency**: `RpComStatus`/`StatusComercial` (Task 2) flow unchanged into Task 3's functions, Task 4's `BadgeStatus`, and Tasks 5-6's components. `FiltrosRps`, `ehSelecionavel`, `estadoSelecaoTodas`, `resumoSelecao` (Task 3) are consumed with identical signatures in Task 5. `executivoRaw` (Task 1) flows from `ExecutivoCarteira` → `Sessao` → `minhasRps`'s second/third arguments in Task 5's page.
- **No placeholders**: every step has literal file contents; test fixtures either reuse the established `criarRpDeTeste` pattern from Fase 2 or are grounded in real carteira/executivo values already verified against `dados.js`.
