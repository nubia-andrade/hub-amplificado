# Mapa de Inserção — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Mapa de Inserção" screen — a per-client, month-by-month calendar showing which program siglas air on which exact days, colored by whether that RP is eligible for a Comercial Amplificado proposal.

**Architecture:** A new server-only repository (`lib/data/datasExibicao.ts`) reads the raw source spreadsheet (`fontes/Base Comercial Amplificado.xlsx`, one row per exhibition date — `dados.js` only has aggregated `de`/`ate` ranges, not individual dates) via the `xlsx` package. Pure calendar-construction functions (`lib/mapa/calendario.ts`) combine that raw per-date data with the already-existing, carteira-scoped `RpComStatus[]` (same pipeline `/rps` already uses) to build a day-by-day grid for one selected client and month. A new client component renders the client selector, month navigation, and grid. The app header gains a second nav tab, which requires making the previously-static nav route-aware.

**Tech Stack:** Next.js (Server + Client Components), TypeScript, Vitest, `xlsx` (SheetJS, new dependency, server-only).

**Spec:** [docs/superpowers/specs/2026-08-25-hub-amplificado-design.md](../specs/2026-08-25-hub-amplificado-design.md) — this feature is not in the original spec; it was requested directly and scoped via the brainstorming skill in-conversation (no separate spec doc was written; the Global Constraints below capture every decision made).

## Global Constraints

- **Data source**: `fontes/Base Comercial Amplificado.xlsx`, sheet `Export`, 4339 data rows, one row per exhibition date. Confirmed columns (verbatim): `Data Exib, Programa, Sigla, RP, Anunciante, CNPJ, CM, Título, Secund., Prod. Portfolio, Modalidade, Executivo, Data compra, Data Comp/Inclus, Linha, Setor, Exib, Status`. Only `Data Exib`, `Sigla`, `RP`, `Exib` are needed for this feature. Confirmed ground truth (independently verified, do not re-derive): 4339 total rows, 408 distinct RPs, RP `702290` has 110 rows (5 siglas × 22 dates each, dates `2026-09-01` through `2026-09-30`).
- **Date parsing**: read cells with SheetJS's `raw: false` option so `Data Exib` comes back as Excel's own formatted display string (e.g. `"26/08/26"`, `DD/MM/YY`) rather than a JS `Date` object — the `Date`-object path has a confirmed timezone/serial-conversion artifact (a spurious `T03:00:28` time component) that the formatted string avoids entirely. Parse `DD/MM/YY` to ISO `YYYY-MM-DD` assuming the 2-digit year means `20YY` (safe for this dataset's 2026 dates).
- **Eligibility rule for the calendar**: gray = `rp.elegivel === false` (the Fase 2 rule engine's result), full stop. Commercial status (`Disponível`/`Em negociação`/etc.) does **not** affect the calendar's color — confirmed decision. A RP's eligibility already applies uniformly to all its lines (per the README: a RP is ineligible as a whole if any line fails), so no per-line eligibility recomputation is needed here — reuse `RpComStatus.elegivel` as-is.
- **Client (anunciante) selection is mandatory** before the calendar renders anything — show an empty-state prompt until one is chosen, to avoid a cluttered view.
- **Carteira scoping**: the client selector only lists anunciantes from the logged executive's own RPs (`minhasRps`, same as `/rps` — an `executivo` sees only their own, a `gerente` sees all).
- **Month navigation**: one month at a time, ←/→ arrows, defaulting to the month of the selected client's earliest exhibition date.
- **Multiple programs per day**: stack sigla chips inside the day cell (cap at 4 visible, `+N` overflow text beyond that).
- **No click interaction** on calendar entries in this version — read-only.
- Visual language: reuse existing `app/globals.css` tokens only. Eligible = `--cor-sucesso-*` (same green as the "Disponível" badge). Ineligible = `--cor-esgotado-*` (same dark gray as the "Não elegível" badge).
- Language: pt-BR for all identifiers, copy, and test descriptions, with correct diacritics.
- The `xlsx` package must only ever be imported by server-only modules (the repository/loader file) — never from a `'use client'` component, same constraint already documented for `lib/data/dadosMock.ts`.

---

### Task 1: Dependência `xlsx` e repositório de datas de exibição

**Files:**
- Modify: `package.json` (via `npm install xlsx`)
- Create: `lib/data/datasExibicao.ts`
- Test: `lib/data/datasExibicao.test.ts`

**Interfaces:**
- Consumes: nothing (independent of the RP rules engine).
- Produces: `interface DataExibicao { rp: string; sigla: string; chave: string; data: string }`, `interface RepositorioDatasExibicao { listarDatasExibicao(): DataExibicao[] }`, `criarRepositorioDatasExibicaoMock(): RepositorioDatasExibicao` — consumed by Task 4's page.

- [ ] **Step 1: Install the `xlsx` package**

Run: `npm install xlsx`

Verify: `package.json`'s `dependencies` now includes an `"xlsx"` entry (whatever version npm resolves — do not hand-edit the version).

- [ ] **Step 2: Write the failing test — `lib/data/datasExibicao.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { criarRepositorioDatasExibicaoMock } from './datasExibicao';

describe('criarRepositorioDatasExibicaoMock', () => {
  const repositorio = criarRepositorioDatasExibicaoMock();

  it('carrega as 4339 linhas de exibição da planilha bruta', () => {
    expect(repositorio.listarDatasExibicao()).toHaveLength(4339);
  });

  it('tem 110 linhas para a RP 702290 (5 siglas × 22 datas cada)', () => {
    const linhas = repositorio.listarDatasExibicao().filter((linha) => linha.rp === '702290');
    expect(linhas).toHaveLength(110);
  });

  it('inclui uma linha com sigla N20H, chave N20H_RJ e data 2026-09-01 para a RP 702290', () => {
    const linhas = repositorio.listarDatasExibicao().filter((linha) => linha.rp === '702290');
    expect(
      linhas.some((linha) => linha.sigla === 'N20H' && linha.chave === 'N20H_RJ' && linha.data === '2026-09-01')
    ).toBe(true);
  });

  it('todas as datas estão no formato ISO YYYY-MM-DD', () => {
    const linhas = repositorio.listarDatasExibicao();
    expect(linhas.every((linha) => /^\d{4}-\d{2}-\d{2}$/.test(linha.data))).toBe(true);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run lib/data/datasExibicao.test.ts`
Expected: FAIL with a module-not-found error for `./datasExibicao`.

- [ ] **Step 4: Write the minimal implementation — `lib/data/datasExibicao.ts`**

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';

interface LinhaBruta {
  'Data Exib': string;
  Sigla: string;
  RP: string;
  Exib: string;
}

export interface DataExibicao {
  rp: string;
  sigla: string;
  chave: string;
  data: string;
}

let cache: DataExibicao[] | null = null;

function paraIso(dataBr: string): string {
  const [dia, mes, anoCurto] = dataBr.split('/');
  const ano = `20${anoCurto}`;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

export function carregarDatasExibicao(): DataExibicao[] {
  if (cache) {
    return cache;
  }

  const caminho = join(process.cwd(), 'fontes', 'Base Comercial Amplificado.xlsx');
  const buffer = readFileSync(caminho);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const planilha = workbook.Sheets[workbook.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<LinhaBruta>(planilha, { raw: false });

  cache = linhas.map((linha) => ({
    rp: String(linha.RP),
    sigla: linha.Sigla,
    chave: `${linha.Sigla}_${linha.Exib}`,
    data: paraIso(linha['Data Exib']),
  }));

  return cache;
}

export interface RepositorioDatasExibicao {
  listarDatasExibicao(): DataExibicao[];
}

export function criarRepositorioDatasExibicaoMock(): RepositorioDatasExibicao {
  return {
    listarDatasExibicao() {
      return carregarDatasExibicao();
    },
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run lib/data/datasExibicao.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/data/datasExibicao.ts lib/data/datasExibicao.test.ts
git commit -m "feat: add xlsx dependency and raw exhibition-date repository"
```

---

### Task 2: Funções puras de calendário

**Files:**
- Create: `lib/mapa/calendario.ts`
- Test: `lib/mapa/calendario.test.ts`

**Interfaces:**
- Consumes: `DataExibicao` from `lib/data/datasExibicao.ts` (Task 1); `RpComStatus` from `lib/rps/rpComStatus.ts` (Fase 3).
- Produces: `interface EntradaDia { sigla: string; elegivel: boolean }`, `type MapaPorDia = Record<string, EntradaDia[]>`, `agruparDatasPorDia(rps: RpComStatus[], datasExibicao: DataExibicao[]): MapaPorDia`, `interface MesAno { ano: number; mes: number }`, `primeiroMesComDatas(rps: RpComStatus[], datasExibicao: DataExibicao[]): MesAno | null`, `construirGradeDoMes(ano: number, mes: number): (string | null)[][]` — all consumed by Task 4's component.

- [ ] **Step 1: Write the failing test — `lib/mapa/calendario.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import type { Rp } from '@/lib/data/rp';
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import type { DataExibicao } from '@/lib/data/datasExibicao';
import { agruparDatasPorDia, construirGradeDoMes, primeiroMesComDatas } from './calendario';

function criarRpDeTeste(overrides: Partial<Rp> = {}): RpComStatus {
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
    status: 'Disponível',
    ...overrides,
  };
}

describe('agruparDatasPorDia', () => {
  it('agrupa siglas por dia, marcando elegivel a partir da RP correspondente', () => {
    const rps = [criarRpDeTeste({ rp: '1', elegivel: true }), criarRpDeTeste({ rp: '2', elegivel: false })];
    const datas: DataExibicao[] = [
      { rp: '1', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-09-01' },
      { rp: '2', sigla: 'DEF', chave: 'DEF_RJ', data: '2026-09-01' },
    ];

    const mapa = agruparDatasPorDia(rps, datas);

    expect(mapa['2026-09-01']).toEqual(
      expect.arrayContaining([
        { sigla: 'ABC', elegivel: true },
        { sigla: 'DEF', elegivel: false },
      ])
    );
  });

  it('ignora datas de RPs fora da lista informada', () => {
    const rps = [criarRpDeTeste({ rp: '1', elegivel: true })];
    const datas: DataExibicao[] = [{ rp: '999', sigla: 'XYZ', chave: 'XYZ_RJ', data: '2026-09-01' }];

    const mapa = agruparDatasPorDia(rps, datas);

    expect(mapa['2026-09-01']).toBeUndefined();
  });

  it('mescla a mesma sigla no mesmo dia com OR de elegibilidade (elegível se qualquer ocorrência for elegível)', () => {
    const rps = [criarRpDeTeste({ rp: '1', elegivel: false }), criarRpDeTeste({ rp: '2', elegivel: true })];
    const datas: DataExibicao[] = [
      { rp: '1', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-09-01' },
      { rp: '2', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-09-01' },
    ];

    const mapa = agruparDatasPorDia(rps, datas);

    expect(mapa['2026-09-01']).toEqual([{ sigla: 'ABC', elegivel: true }]);
  });
});

describe('primeiroMesComDatas', () => {
  it('retorna o ano/mês da data mais antiga entre as RPs informadas', () => {
    const rps = [criarRpDeTeste({ rp: '1' })];
    const datas: DataExibicao[] = [
      { rp: '1', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-10-15' },
      { rp: '1', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-09-01' },
    ];

    expect(primeiroMesComDatas(rps, datas)).toEqual({ ano: 2026, mes: 9 });
  });

  it('retorna null quando não há datas para as RPs informadas', () => {
    const rps = [criarRpDeTeste({ rp: '1' })];
    expect(primeiroMesComDatas(rps, [])).toBeNull();
  });
});

describe('construirGradeDoMes', () => {
  it('monta setembro/2026 em 5 semanas, com 1º de setembro (terça) na posição correta', () => {
    const grade = construirGradeDoMes(2026, 9);

    expect(grade).toHaveLength(5);
    expect(grade[0]).toEqual([null, null, '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05']);
    expect(grade[4]).toEqual(['2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', null, null, null]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/mapa/calendario.test.ts`
Expected: FAIL with a module-not-found error for `./calendario`.

- [ ] **Step 3: Write the minimal implementation — `lib/mapa/calendario.ts`**

```ts
import type { DataExibicao } from '@/lib/data/datasExibicao';
import type { RpComStatus } from '@/lib/rps/rpComStatus';

export interface EntradaDia {
  sigla: string;
  elegivel: boolean;
}

export type MapaPorDia = Record<string, EntradaDia[]>;

export function agruparDatasPorDia(rps: RpComStatus[], datasExibicao: DataExibicao[]): MapaPorDia {
  const elegibilidadePorRp = new Map(rps.map((rp) => [rp.rp, rp.elegivel]));
  const mapa: MapaPorDia = {};

  for (const registro of datasExibicao) {
    const elegivel = elegibilidadePorRp.get(registro.rp);
    if (elegivel === undefined) {
      continue;
    }

    const entradas = mapa[registro.data] ?? (mapa[registro.data] = []);
    const existente = entradas.find((entrada) => entrada.sigla === registro.sigla);
    if (existente) {
      existente.elegivel = existente.elegivel || elegivel;
    } else {
      entradas.push({ sigla: registro.sigla, elegivel });
    }
  }

  return mapa;
}

export interface MesAno {
  ano: number;
  mes: number;
}

export function primeiroMesComDatas(rps: RpComStatus[], datasExibicao: DataExibicao[]): MesAno | null {
  const rpIds = new Set(rps.map((rp) => rp.rp));
  const datas = datasExibicao.filter((registro) => rpIds.has(registro.rp)).map((registro) => registro.data);

  if (datas.length === 0) {
    return null;
  }

  const primeira = [...datas].sort()[0];
  const [ano, mes] = primeira.split('-');
  return { ano: Number(ano), mes: Number(mes) };
}

export function construirGradeDoMes(ano: number, mes: number): (string | null)[][] {
  const primeiroDia = new Date(Date.UTC(ano, mes - 1, 1));
  const diaDaSemanaInicio = primeiroDia.getUTCDay();
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();

  const celulas: (string | null)[] = [];
  for (let i = 0; i < diaDaSemanaInicio; i++) {
    celulas.push(null);
  }
  for (let dia = 1; dia <= diasNoMes; dia++) {
    celulas.push(`${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`);
  }
  while (celulas.length % 7 !== 0) {
    celulas.push(null);
  }

  const semanas: (string | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) {
    semanas.push(celulas.slice(i, i + 7));
  }
  return semanas;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/mapa/calendario.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/mapa/calendario.ts lib/mapa/calendario.test.ts
git commit -m "feat: add pure calendar-grouping and month-grid functions"
```

---

### Task 3: Navegação por abas sensível à rota

**Files:**
- Create: `components/nav/AbasPrincipais.tsx`
- Modify: `app/(app)/layout.tsx`
- Modify: `middleware.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `<AbasPrincipais />` rendered inside the app header; `middleware.ts` now protects `/mapa` the same way it protects `/rps`.

- [ ] **Step 1: Create `components/nav/AbasPrincipais.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ABAS = [
  { href: '/rps', rotulo: 'Minhas RPs' },
  { href: '/mapa', rotulo: 'Mapa de Inserção' },
];

export function AbasPrincipais() {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {ABAS.map((aba) => {
        const ativa = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            style={{
              background: ativa ? 'var(--gradiente-marca)' : 'transparent',
              color: ativa ? 'var(--cor-superficie)' : 'var(--cor-tinta-secundaria)',
              padding: '6px 14px',
              borderRadius: 'var(--raio-botao)',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: ativa ? 'var(--sombra-botao)' : 'none',
            }}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Update `app/(app)/layout.tsx`**

Add the import at the top, alongside the existing imports:

```ts
import { AbasPrincipais } from '@/components/nav/AbasPrincipais';
```

Replace the static `<span>...Minhas RPs</span>` block with `<AbasPrincipais />`:

```tsx
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <strong style={{ fontSize: 13, fontWeight: 700, color: '#101820' }}>
            Hub Amplificado
          </strong>
          <AbasPrincipais />
        </div>
```

(This removes the old hardcoded `<span>` that always showed "Minhas RPs" as active — its `color: '#fff'` literal goes away with it, which also happens to fix a leftover stray hex-literal in this file that predates the token-usage cleanup done elsewhere.)

- [ ] **Step 3: Update `middleware.ts`**

Change the `matcher` array to also protect `/mapa`:

```ts
export const config = {
  matcher: ['/rps/:path*', '/mapa/:path*'],
};
```

- [ ] **Step 4: Verify manually in the browser**

Run: `npm run dev`, log in, and confirm:
- On `/rps`, the "Minhas RPs" tab shows the brand gradient (active), "Mapa de Inserção" shows plain text (inactive).
- Clicking "Mapa de Inserção" navigates to `/mapa` — it will 404 or error for now since Task 4 hasn't built that route yet; that's expected at this point in the plan. Just confirm the link/navigation itself works and the middleware doesn't block it before hitting the (not-yet-existing) page.

Stop the dev server after verifying.

- [ ] **Step 5: Commit**

```bash
git add components/nav/AbasPrincipais.tsx "app/(app)/layout.tsx" middleware.ts
git commit -m "feat: add route-aware navigation tabs and protect /mapa"
```

---

### Task 4: Página e componente Mapa de Inserção

**Files:**
- Create: `app/(app)/mapa/page.tsx`
- Create: `components/mapa/MapaInsercao.tsx`

**Interfaces:**
- Consumes: `lerSessao` from `lib/auth/session.ts`; `criarRepositorioMock` from `lib/data/repositorioRps.ts`; `listarRpsComElegibilidade` from `lib/regras/motor.ts`; `paraRpComStatus` from `lib/rps/rpComStatus.ts`; `minhasRps` from `lib/rps/regrasLista.ts`; `criarRepositorioDatasExibicaoMock` from `lib/data/datasExibicao.ts` (Task 1); `agruparDatasPorDia`, `primeiroMesComDatas`, `construirGradeDoMes`, `MesAno` from `lib/mapa/calendario.ts` (Task 2).
- Produces: the rendered "Mapa de Inserção" screen at `/mapa`.

- [ ] **Step 1: Create `app/(app)/mapa/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { lerSessao } from '@/lib/auth/session';
import { criarRepositorioMock } from '@/lib/data/repositorioRps';
import { listarRpsComElegibilidade } from '@/lib/regras/motor';
import { paraRpComStatus } from '@/lib/rps/rpComStatus';
import { minhasRps } from '@/lib/rps/regrasLista';
import { criarRepositorioDatasExibicaoMock } from '@/lib/data/datasExibicao';
import { MapaInsercao } from '@/components/mapa/MapaInsercao';

const MARGEM_DIAS_UTEIS = 2;

export default async function MapaDeInsercaoPage() {
  const sessao = await lerSessao();
  // Redundante com o guard do layout, mas necessário para o TypeScript estreitar
  // `sessao` para não-nulo abaixo (papel/executivoRaw são usados logo em seguida).
  if (!sessao) {
    redirect('/login');
  }

  const repositorio = criarRepositorioMock();
  const rpsComElegibilidade = listarRpsComElegibilidade(repositorio, new Date(), MARGEM_DIAS_UTEIS);
  const rpsComStatus = rpsComElegibilidade.map(paraRpComStatus);
  const rps = minhasRps(rpsComStatus, sessao.papel, sessao.executivoRaw);

  const repositorioDatas = criarRepositorioDatasExibicaoMock();
  const datasExibicao = repositorioDatas.listarDatasExibicao();

  return <MapaInsercao rps={rps} datasExibicao={datasExibicao} />;
}
```

- [ ] **Step 2: Create `components/mapa/MapaInsercao.tsx`**

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import type { DataExibicao } from '@/lib/data/datasExibicao';
import { agruparDatasPorDia, construirGradeDoMes, primeiroMesComDatas, type MesAno } from '@/lib/mapa/calendario';

interface MapaInsercaoProps {
  rps: RpComStatus[];
  datasExibicao: DataExibicao[];
}

const NOMES_MES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MAX_SIGLAS_VISIVEIS = 4;

export function MapaInsercao({ rps, datasExibicao }: MapaInsercaoProps) {
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [anoMes, setAnoMes] = useState<MesAno | null>(null);

  const anunciantes = useMemo(
    () => [...new Set(rps.map((rp) => rp.anunciante))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [rps]
  );

  const rpsDoCliente = useMemo(
    () => rps.filter((rp) => rp.anunciante === clienteSelecionado),
    [rps, clienteSelecionado]
  );

  useEffect(() => {
    if (!clienteSelecionado) {
      setAnoMes(null);
      return;
    }
    setAnoMes(primeiroMesComDatas(rpsDoCliente, datasExibicao));
  }, [clienteSelecionado, rpsDoCliente, datasExibicao]);

  const mapaPorDia = useMemo(
    () => agruparDatasPorDia(rpsDoCliente, datasExibicao),
    [rpsDoCliente, datasExibicao]
  );

  const grade = useMemo(() => (anoMes ? construirGradeDoMes(anoMes.ano, anoMes.mes) : []), [anoMes]);

  function irParaMesAnterior() {
    setAnoMes((atual) => {
      if (!atual) return atual;
      return atual.mes === 1 ? { ano: atual.ano - 1, mes: 12 } : { ano: atual.ano, mes: atual.mes - 1 };
    });
  }

  function irParaProximoMes() {
    setAnoMes((atual) => {
      if (!atual) return atual;
      return atual.mes === 12 ? { ano: atual.ano + 1, mes: 1 } : { ano: atual.ano, mes: atual.mes + 1 };
    });
  }

  return (
    <div style={{ padding: '16px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <label style={{ fontSize: 12.5, fontWeight: 600 }} htmlFor="cliente">
          Cliente
        </label>
        <select
          id="cliente"
          value={clienteSelecionado}
          onChange={(evento) => setClienteSelecionado(evento.target.value)}
          style={{
            padding: '8px 10px',
            border: '1px solid var(--cor-borda-input)',
            borderRadius: 'var(--raio-input)',
            fontSize: 13,
            minWidth: 240,
          }}
        >
          <option value="">Selecione um cliente</option>
          {anunciantes.map((anunciante) => (
            <option key={anunciante} value={anunciante}>
              {anunciante}
            </option>
          ))}
        </select>
      </div>

      {!clienteSelecionado && (
        <p style={{ fontSize: 12.5, color: 'var(--cor-tinta-terciaria)' }}>
          Selecione um cliente para ver o mapa de inserção.
        </p>
      )}

      {clienteSelecionado && !anoMes && (
        <p style={{ fontSize: 12.5, color: 'var(--cor-tinta-terciaria)' }}>
          Nenhuma data de exibição encontrada para este cliente.
        </p>
      )}

      {clienteSelecionado && anoMes && (
        <div
          style={{
            border: '1px solid var(--cor-borda)',
            borderRadius: 'var(--raio-card)',
            background: 'var(--cor-superficie)',
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
            <button
              type="button"
              onClick={irParaMesAnterior}
              style={{ border: '1px solid var(--cor-borda-forte)', background: 'transparent', borderRadius: 'var(--raio-input)', padding: '4px 10px', cursor: 'pointer' }}
            >
              ←
            </button>
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              {NOMES_MES[anoMes.mes - 1]} {anoMes.ano}
            </span>
            <button
              type="button"
              onClick={irParaProximoMes}
              style={{ border: '1px solid var(--cor-borda-forte)', background: 'transparent', borderRadius: 'var(--raio-input)', padding: '4px 10px', cursor: 'pointer' }}
            >
              →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--cor-tinta-terciaria)', textAlign: 'center' }}>
                {dia}
              </div>
            ))}
          </div>

          {grade.map((semana, indiceSemana) => (
            <div key={indiceSemana} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
              {semana.map((diaIso, indiceDia) => {
                if (!diaIso) {
                  return <div key={indiceDia} />;
                }
                const entradas = mapaPorDia[diaIso] ?? [];
                const visiveis = entradas.slice(0, MAX_SIGLAS_VISIVEIS);
                const restantes = entradas.length - visiveis.length;

                return (
                  <div
                    key={diaIso}
                    style={{
                      minHeight: 64,
                      border: '1px solid var(--cor-borda-sutil)',
                      borderRadius: 'var(--raio-input)',
                      padding: 4,
                    }}
                  >
                    <div style={{ fontSize: 10, color: 'var(--cor-tinta-terciaria)', marginBottom: 3 }}>
                      {Number(diaIso.slice(-2))}
                    </div>
                    {visiveis.map((entrada, indiceEntrada) => (
                      <div
                        key={`${entrada.sigla}-${indiceEntrada}`}
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          padding: '1px 4px',
                          marginBottom: 2,
                          borderRadius: 'var(--raio-chip)',
                          color: entrada.elegivel ? 'var(--cor-sucesso-texto)' : 'var(--cor-esgotado-texto)',
                          background: entrada.elegivel ? 'var(--cor-sucesso-fundo)' : 'var(--cor-esgotado-fundo)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {entrada.sigla}
                      </div>
                    ))}
                    {restantes > 0 && (
                      <div style={{ fontSize: 9, color: 'var(--cor-tinta-terciaria)' }}>+{restantes}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify manually in the browser**

Run: `npm run dev`, log in as `milena.dabul@empresa.com.br`, click the "Mapa de Inserção" tab, and confirm:
- Before selecting a client, the empty-state prompt shows and no calendar renders.
- The client select only lists anunciantes from Milena's own RPs (not all 408 RPs' anunciantes).
- After selecting a client, the calendar opens on the month of that client's earliest exhibition date, with sigla chips appearing on the correct days, colored green (eligible) or gray (ineligible) matching what `/rps`'s detail panel shows for the same RPs.
- The ←/→ buttons move between months and the grid updates correctly (e.g. weekday alignment stays correct across month boundaries).
- A day with more than 4 programs shows the "+N" overflow text.
- Log out and log back in as `gerente@empresa.com.br` — confirm the client selector lists anunciantes across all executives, not just one.

Stop the dev server after verifying.

- [ ] **Step 4: Run the full suite and typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass (55 pre-existing + 4 from Task 1 + 6 from Task 2 = 65), zero type errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/mapa/page.tsx" components/mapa/MapaInsercao.tsx
git commit -m "feat: add Mapa de Inserção calendar screen"
```

---

## Self-Review Notes

- **Spec coverage**: implements every decision made in the brainstorming conversation — new nav tab, mandatory client selection, month-by-month navigation defaulting to the earliest date, stacked sigla chips with a 4-item cap and overflow count, gray-for-ineligible-only coloring (status-independent), carteira-scoped client list, read-only (no click interaction). No proposal generation, no status changes, no click-through — all correctly out of scope.
- **Type consistency**: `DataExibicao` (Task 1) flows unchanged into Task 2's functions and Task 4's page/component. `EntradaDia`/`MapaPorDia`/`MesAno`/`agruparDatasPorDia`/`primeiroMesComDatas`/`construirGradeDoMes` (Task 2) are consumed with identical signatures in Task 4.
- **No placeholders**: every step has literal file contents; test fixtures for Task 1 are grounded in the real spreadsheet's independently-verified row counts and one confirmed sample record (RP 702290); Task 2's calendar-grid test is grounded in an independently-verified real calendar fact (2026-09-01 is a Tuesday, already used and verified in the Fase 2 plan).
