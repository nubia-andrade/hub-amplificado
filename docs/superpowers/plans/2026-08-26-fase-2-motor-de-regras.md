# Fase 2 — Motor de Regras de Negócio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure, framework-free business-rules engine (value calculation, deadline eligibility, discount/alçada) plus the mock data-access layer it runs against, validated end-to-end against the README's known baseline (408 RPs, 349 elegíveis, 59 não elegíveis antes da regra de prazo).

**Architecture:** `lib/data/` holds the RP types and a repository (interface + mock implementation) that parses the existing prototype fixture `dados.js` (root of the repo) into typed objects — this is the "fonte mock local... atrás de uma interface substituível pelo client BigQuery" the spec calls for. `lib/regras/` holds three independent pure-function modules (valor, elegibilidade, desconto) plus a thin integration module (motor) that composes the repository with the deadline rule. Everything outside the data loader is pure TypeScript with no Next.js/browser dependency, so it is directly unit-testable with Vitest.

**Tech Stack:** TypeScript, Vitest (already configured in Phase 1, including the `@/*` path alias).

**Spec:** [docs/superpowers/specs/2026-08-25-hub-amplificado-design.md](../specs/2026-08-25-hub-amplificado-design.md)

## Global Constraints

- Segundagem multiplier table (exact, from the README): `6″→0.40, 10″→0.45, 15″→0.75, 30″→1.00, 45″→1.50, 60″→2.00`. A segundagem outside this table has no valid multiplier.
- Deadline (prazo) eligibility rule: a RP is ineligible if **any** of its rows (`linhas[].de`) has an exhibition start date on or before **hoje + `margemDiasUteis` business days** (Saturday/Sunday excluded from the count; no holiday awareness — this matches the prototype's own rule, holidays are out of scope). `margemDiasUteis` defaults to 2 and must be a parameter, not a hardcoded constant.
- Alçada de desconto: default limit is 20%, must be a parameter, not a hardcoded constant.
- The mock data source is `dados.js` at the repo root — `window.CA_DATA = {"rps": [...408 objects...], "executivos": [...], "mult": {...}, "excecoes": [...]}`, a single-line file. Parse it by stripping the `window.CA_DATA=` prefix and the trailing `;`, then `JSON.parse` — never `eval()` it. Confirmed ground truth (via `grep -c` on the file): exactly 408 RPs, 349 with `"elegivel":true`, 59 with `"elegivel":false` — this is the numbers the README calls "antes da regra de prazo," i.e. the exceção-de-sigla / segundagem-fora-dos-coeficientes / sem-preço checks are already baked into these fields by the fixture; this phase does not re-derive them, it only layers the prazo rule on top (mirroring the existing prototype's own division of labor between build-time data and runtime rule).
- All modules in `lib/regras/` and `lib/data/rp.ts`/`lib/data/repositorioRps.ts` must be pure and framework-free (importable and testable outside Next.js). Only `lib/data/dadosMock.ts` may use Node's `fs`/`path` (server-only file I/O) — never import it from a client component.
- Date arithmetic in `lib/regras/elegibilidade.ts` must be timezone-independent: derive the calendar date from the input `Date`'s local getters once, then do all further arithmetic (day increments, weekday checks) in UTC, so the same test produces the same result regardless of the machine's timezone.
- Language: pt-BR for all identifiers, copy, and test descriptions — with **correct diacritics** (an earlier phase's final review had to fix several missing accents; get them right the first time here: "não", "está", "único", "código", etc.).

---

### Task 1: Tipos de RP e camada de acesso a dados (repositório mock)

**Files:**
- Create: `lib/data/rp.ts`
- Create: `lib/data/dadosMock.ts`
- Create: `lib/data/repositorioRps.ts`
- Test: `lib/data/repositorioRps.test.ts`

**Interfaces:**
- Consumes: nothing (first task of this plan; independent of Phase 1's `lib/auth`/`lib/data/carteira.ts`).
- Produces: `interface LinhaRp`, `interface Rp`, `interface RepositorioRps { listarRps(): Rp[] }`, `criarRepositorioMock(): RepositorioRps` — used by Tasks 3 and 5.

- [ ] **Step 1: Create `lib/data/rp.ts`**

```ts
export interface LinhaRp {
  sigla: string;
  exib: string;
  chave: string;
  programa: string;
  modalidade: string;
  titulo?: string;
  secund: number;
  mult: number;
  precoBase: number | null;
  unit: number | null;
  nDatas: number;
  total: number | null;
  motivos: string[];
  de: string;
  ate: string;
}

export interface Rp {
  rp: string;
  anunciante: string;
  cnpj: string;
  executivo: string;
  setor: string;
  exib: string;
  portfolio: string;
  cm: string;
  linhas: LinhaRp[];
  nDatas: number;
  elegivel: boolean;
  motivos: string[];
  valorTabela: number;
}
```

- [ ] **Step 2: Create `lib/data/dadosMock.ts`**

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Rp } from './rp';

interface CaData {
  rps: Rp[];
  executivos: (string | null)[];
  mult: Record<string, number>;
  excecoes: string[];
}

let cache: CaData | null = null;

export function carregarCaData(): CaData {
  if (cache) {
    return cache;
  }

  const caminho = join(process.cwd(), 'dados.js');
  const conteudo = readFileSync(caminho, 'utf-8');
  const casamento = conteudo.match(/^window\.CA_DATA=(\{.*\});?\s*$/s);
  if (!casamento) {
    throw new Error('dados.js não está no formato esperado (window.CA_DATA={...};)');
  }

  cache = JSON.parse(casamento[1]) as CaData;
  return cache;
}
```

- [ ] **Step 3: Write the failing test — `lib/data/repositorioRps.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { criarRepositorioMock } from './repositorioRps';

describe('criarRepositorioMock', () => {
  const repositorio = criarRepositorioMock();

  it('carrega as 408 RPs do dados.js', () => {
    expect(repositorio.listarRps()).toHaveLength(408);
  });

  it('reflete a elegibilidade já calculada no dados.js: 349 elegíveis e 59 não elegíveis', () => {
    const rps = repositorio.listarRps();
    expect(rps.filter((rp) => rp.elegivel)).toHaveLength(349);
    expect(rps.filter((rp) => !rp.elegivel)).toHaveLength(59);
  });

  it('mapeia corretamente os campos da RP 702290 e da sua primeira linha', () => {
    const rp = repositorio.listarRps().find((r) => r.rp === '702290');
    expect(rp).toBeDefined();
    expect(rp?.anunciante).toBe('SAERJ');
    expect(rp?.cnpj).toBe('10.554.856/0001-62');
    expect(rp?.exib).toBe('RJ');
    expect(rp?.valorTabela).toBe(753984);

    const linha = rp?.linhas[0];
    expect(linha?.sigla).toBe('N20H');
    expect(linha?.chave).toBe('N20H_RJ');
    expect(linha?.programa).toBe('Novela III');
    expect(linha?.secund).toBe(60);
    expect(linha?.precoBase).toBe(4694.4);
    expect(linha?.unit).toBe(9388.8);
    expect(linha?.nDatas).toBe(22);
    expect(linha?.total).toBe(206553.6);
    expect(linha?.de).toBe('2026-09-01');
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run lib/data/repositorioRps.test.ts`
Expected: FAIL with a module-not-found error for `./repositorioRps`.

- [ ] **Step 5: Write the minimal implementation — `lib/data/repositorioRps.ts`**

```ts
import type { Rp } from './rp';
import { carregarCaData } from './dadosMock';

export interface RepositorioRps {
  listarRps(): Rp[];
}

export function criarRepositorioMock(): RepositorioRps {
  return {
    listarRps() {
      return carregarCaData().rps;
    },
  };
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run lib/data/repositorioRps.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add lib/data/rp.ts lib/data/dadosMock.ts lib/data/repositorioRps.ts lib/data/repositorioRps.test.ts
git commit -m "feat: add RP types and mock data repository backed by dados.js"
```

---

### Task 2: Cálculo de valor (múltiplo de segundagem)

**Files:**
- Create: `lib/regras/valor.ts`
- Test: `lib/regras/valor.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MULTIPLOS_SEGUNDAGEM: Readonly<Record<number, number>>`, `calcularValorUnitario(precoBase: number, segundagem: number): number | null`, `calcularValorLinha(precoBase: number, segundagem: number, nDatas: number): number | null` — informational reference for later phases (proposal generation); not consumed by other tasks in this plan.

- [ ] **Step 1: Write the failing test — `lib/regras/valor.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { calcularValorLinha, calcularValorUnitario, MULTIPLOS_SEGUNDAGEM } from './valor';

describe('MULTIPLOS_SEGUNDAGEM', () => {
  it('tem os seis múltiplos definidos no README', () => {
    expect(MULTIPLOS_SEGUNDAGEM).toEqual({ 6: 0.4, 10: 0.45, 15: 0.75, 30: 1, 45: 1.5, 60: 2 });
  });
});

describe('calcularValorUnitario', () => {
  it('multiplica o preço base pelo múltiplo da segundagem (caso real: RP 702290, Novela III)', () => {
    expect(calcularValorUnitario(4694.4, 60)).toBeCloseTo(9388.8, 2);
  });

  it('retorna null para segundagem fora dos coeficientes (0", 5", 90")', () => {
    expect(calcularValorUnitario(1000, 0)).toBeNull();
    expect(calcularValorUnitario(1000, 5)).toBeNull();
    expect(calcularValorUnitario(1000, 90)).toBeNull();
  });
});

describe('calcularValorLinha', () => {
  it('multiplica o valor unitário pelo número de datas distintas (caso real: RP 702290, Novela III)', () => {
    expect(calcularValorLinha(4694.4, 60, 22)).toBeCloseTo(206553.6, 2);
  });

  it('retorna null quando a segundagem é inválida, independente do número de datas', () => {
    expect(calcularValorLinha(1000, 90, 10)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/regras/valor.test.ts`
Expected: FAIL with a module-not-found error for `./valor`.

- [ ] **Step 3: Write the minimal implementation — `lib/regras/valor.ts`**

```ts
export const MULTIPLOS_SEGUNDAGEM: Readonly<Record<number, number>> = {
  6: 0.4,
  10: 0.45,
  15: 0.75,
  30: 1,
  45: 1.5,
  60: 2,
};

export function calcularValorUnitario(precoBase: number, segundagem: number): number | null {
  const multiplo = MULTIPLOS_SEGUNDAGEM[segundagem];
  if (multiplo === undefined) {
    return null;
  }
  return precoBase * multiplo;
}

export function calcularValorLinha(precoBase: number, segundagem: number, nDatas: number): number | null {
  const unitario = calcularValorUnitario(precoBase, segundagem);
  if (unitario === null) {
    return null;
  }
  return unitario * nDatas;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/regras/valor.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/regras/valor.ts lib/regras/valor.test.ts
git commit -m "feat: add valor calculation using the segundagem multiplier table"
```

---

### Task 3: Elegibilidade — regra de prazo (dias úteis)

**Files:**
- Create: `lib/regras/elegibilidade.ts`
- Test: `lib/regras/elegibilidade.test.ts`

**Interfaces:**
- Consumes: `Rp`, `LinhaRp` from `lib/data/rp.ts` (Task 1).
- Produces: `calcularDataCorte(hoje: Date, margemDiasUteis: number): Date`, `formatarDataISO(data: Date): string`, `aplicarRegraPrazo(rp: Rp, corteISO: string): Rp` — used by Task 5.

- [ ] **Step 1: Write the failing test — `lib/regras/elegibilidade.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import type { Rp } from '@/lib/data/rp';
import { aplicarRegraPrazo, calcularDataCorte, formatarDataISO } from './elegibilidade';

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

describe('calcularDataCorte', () => {
  it('pula sábado e domingo ao contar dias úteis (sexta 28/08/2026 + 2 dias úteis = terça 01/09/2026)', () => {
    const hoje = new Date(2026, 7, 28); // sexta-feira
    const corte = calcularDataCorte(hoje, 2);
    expect(formatarDataISO(corte)).toBe('2026-09-01');
  });

  it('com margem zero, o corte é o próprio dia informado', () => {
    const hoje = new Date(2020, 0, 1);
    expect(formatarDataISO(calcularDataCorte(hoje, 0))).toBe('2020-01-01');
  });
});

describe('aplicarRegraPrazo', () => {
  it('mantém elegível uma RP cujas datas são todas posteriores ao corte', () => {
    const rp = criarRpDeTeste({
      linhas: [
        {
          sigla: 'X', exib: 'RJ', chave: 'X_RJ', programa: 'P', modalidade: 'M',
          secund: 30, mult: 1, precoBase: 100, unit: 100, nDatas: 1, total: 100,
          motivos: [], de: '2026-09-02', ate: '2026-09-02',
        },
      ],
    });
    const resultado = aplicarRegraPrazo(rp, '2026-09-01');
    expect(resultado.elegivel).toBe(true);
    expect(resultado.motivos).toEqual([]);
  });

  it('torna não elegível uma RP com alguma data de exibição no corte ou antes', () => {
    const rp = criarRpDeTeste({
      linhas: [
        {
          sigla: 'X', exib: 'RJ', chave: 'X_RJ', programa: 'P', modalidade: 'M',
          secund: 30, mult: 1, precoBase: 100, unit: 100, nDatas: 1, total: 100,
          motivos: [], de: '2026-09-01', ate: '2026-09-01',
        },
      ],
    });
    const resultado = aplicarRegraPrazo(rp, '2026-09-01');
    expect(resultado.elegivel).toBe(false);
    expect(resultado.motivos).toHaveLength(1);
    expect(resultado.motivos[0]).toContain('01/09/2026');
  });

  it('preserva motivos de inelegibilidade já existentes ao adicionar o motivo de prazo', () => {
    const rp = criarRpDeTeste({
      elegivel: false,
      motivos: ['Sem preço para X_RJ'],
      linhas: [
        {
          sigla: 'X', exib: 'RJ', chave: 'X_RJ', programa: 'P', modalidade: 'M',
          secund: 30, mult: 1, precoBase: null, unit: null, nDatas: 1, total: null,
          motivos: ['Sem preço para X_RJ'], de: '2026-09-01', ate: '2026-09-01',
        },
      ],
    });
    const resultado = aplicarRegraPrazo(rp, '2026-09-01');
    expect(resultado.motivos).toEqual(['Sem preço para X_RJ', expect.stringContaining('01/09/2026')]);
    expect(resultado.elegivel).toBe(false);
  });

  it('não altera uma RP sem linhas', () => {
    const rp = criarRpDeTeste({ linhas: [] });
    const resultado = aplicarRegraPrazo(rp, '2026-09-01');
    expect(resultado).toEqual(rp);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/regras/elegibilidade.test.ts`
Expected: FAIL with a module-not-found error for `./elegibilidade`.

- [ ] **Step 3: Write the minimal implementation — `lib/regras/elegibilidade.ts`**

```ts
import type { Rp } from '@/lib/data/rp';

export function calcularDataCorte(hoje: Date, margemDiasUteis: number): Date {
  let corte = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
  let restantes = margemDiasUteis;

  while (restantes > 0) {
    corte = new Date(corte.getTime() + 24 * 60 * 60 * 1000);
    const diaDaSemana = corte.getUTCDay();
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
      restantes -= 1;
    }
  }

  return corte;
}

export function formatarDataISO(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function formatarDataBR(dataISO: string): string {
  return dataISO.split('-').reverse().join('/');
}

export function aplicarRegraPrazo(rp: Rp, corteISO: string): Rp {
  const primeira = rp.linhas.reduce<string | null>(
    (minima, linha) => (!minima || linha.de < minima ? linha.de : minima),
    null
  );
  if (!primeira) {
    return rp;
  }

  const algumaVencida = rp.linhas.some((linha) => linha.de <= corteISO);
  if (!algumaVencida) {
    return rp;
  }

  const motivo =
    'Datas de exibição a partir de ' +
    formatarDataBR(primeira) +
    ' — precisa ser posterior a ' +
    formatarDataBR(corteISO);

  return {
    ...rp,
    motivos: [...rp.motivos, motivo],
    elegivel: false,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/regras/elegibilidade.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/regras/elegibilidade.ts lib/regras/elegibilidade.test.ts
git commit -m "feat: add prazo eligibility rule with business-day cutoff"
```

---

### Task 4: Desconto e alçada

**Files:**
- Create: `lib/regras/desconto.ts`
- Test: `lib/regras/desconto.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `interface AvaliacaoDesconto { dentroDaAlcada: boolean; percentualLimite: number }`, `avaliarDesconto(percentualDesconto: number, percentualLimite?: number): AvaliacaoDesconto`, `calcularLiquido(valorTabela: number, percentualDesconto: number): number` — informational reference for later phases (proposal generation); not consumed by other tasks in this plan.

- [ ] **Step 1: Write the failing test — `lib/regras/desconto.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { avaliarDesconto, calcularLiquido } from './desconto';

describe('avaliarDesconto', () => {
  it('considera dentro da alçada um desconto de até 20% (limite padrão)', () => {
    expect(avaliarDesconto(20).dentroDaAlcada).toBe(true);
    expect(avaliarDesconto(0).dentroDaAlcada).toBe(true);
  });

  it('considera fora da alçada um desconto acima de 20%', () => {
    expect(avaliarDesconto(21).dentroDaAlcada).toBe(false);
  });

  it('aceita um limite de alçada customizado (parametrizável)', () => {
    expect(avaliarDesconto(25, 30).dentroDaAlcada).toBe(true);
    expect(avaliarDesconto(35, 30).dentroDaAlcada).toBe(false);
  });
});

describe('calcularLiquido', () => {
  it('aplica o percentual de desconto sobre o valor de tabela', () => {
    expect(calcularLiquido(753984, 0)).toBe(753984);
    expect(calcularLiquido(1000, 10)).toBe(900);
    expect(calcularLiquido(206553.6, 20)).toBeCloseTo(165242.88, 2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/regras/desconto.test.ts`
Expected: FAIL with a module-not-found error for `./desconto`.

- [ ] **Step 3: Write the minimal implementation — `lib/regras/desconto.ts`**

```ts
export interface AvaliacaoDesconto {
  dentroDaAlcada: boolean;
  percentualLimite: number;
}

export function avaliarDesconto(percentualDesconto: number, percentualLimite = 20): AvaliacaoDesconto {
  return {
    dentroDaAlcada: percentualDesconto <= percentualLimite,
    percentualLimite,
  };
}

export function calcularLiquido(valorTabela: number, percentualDesconto: number): number {
  return valorTabela * (1 - percentualDesconto / 100);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/regras/desconto.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/regras/desconto.ts lib/regras/desconto.test.ts
git commit -m "feat: add discount alçada evaluation and net-value calculation"
```

---

### Task 5: Motor de regras — integração

**Files:**
- Create: `lib/regras/motor.ts`
- Test: `lib/regras/motor.test.ts`

**Interfaces:**
- Consumes: `RepositorioRps`, `criarRepositorioMock` from `lib/data/repositorioRps.ts` (Task 1); `Rp` from `lib/data/rp.ts` (Task 1); `aplicarRegraPrazo`, `calcularDataCorte`, `formatarDataISO` from `lib/regras/elegibilidade.ts` (Task 3).
- Produces: `listarRpsComElegibilidade(repositorio: RepositorioRps, hoje: Date, margemDiasUteis: number): Rp[]` — the composed entry point later phases (Minhas RPs listing) will call.

- [ ] **Step 1: Write the failing test — `lib/regras/motor.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { criarRepositorioMock } from '@/lib/data/repositorioRps';
import { listarRpsComElegibilidade } from './motor';

describe('listarRpsComElegibilidade', () => {
  const repositorio = criarRepositorioMock();

  it('não altera a elegibilidade quando o corte de prazo é muito anterior a todas as datas da base (baseline do README: 349 elegíveis)', () => {
    const rps = listarRpsComElegibilidade(repositorio, new Date(2020, 0, 1), 0);
    expect(rps).toHaveLength(408);
    expect(rps.filter((rp) => rp.elegivel)).toHaveLength(349);
  });

  it('mantém a RP 702290 elegível quando o corte de prazo é anterior à sua primeira data de exibição (01/09/2026)', () => {
    const rps = listarRpsComElegibilidade(repositorio, new Date(2020, 0, 1), 0);
    const rp = rps.find((r) => r.rp === '702290');
    expect(rp?.elegivel).toBe(true);
  });

  it('torna a RP 702290 não elegível quando o corte de prazo é posterior à sua primeira data de exibição', () => {
    const rps = listarRpsComElegibilidade(repositorio, new Date(2030, 0, 1), 0);
    const rp = rps.find((r) => r.rp === '702290');
    expect(rp?.elegivel).toBe(false);
    expect(rp?.motivos.some((motivo) => motivo.includes('01/09/2026'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/regras/motor.test.ts`
Expected: FAIL with a module-not-found error for `./motor`.

- [ ] **Step 3: Write the minimal implementation — `lib/regras/motor.ts`**

```ts
import type { Rp } from '@/lib/data/rp';
import type { RepositorioRps } from '@/lib/data/repositorioRps';
import { aplicarRegraPrazo, calcularDataCorte, formatarDataISO } from './elegibilidade';

export function listarRpsComElegibilidade(
  repositorio: RepositorioRps,
  hoje: Date,
  margemDiasUteis: number
): Rp[] {
  const corteISO = formatarDataISO(calcularDataCorte(hoje, margemDiasUteis));
  return repositorio.listarRps().map((rp) => aplicarRegraPrazo(rp, corteISO));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/regras/motor.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `npx vitest run`
Expected: PASS, all tests across Phase 1 and Phase 2 (11 from Phase 1 + 3 + 6 + 6 + 5 + 3 = 34 total).

- [ ] **Step 6: Commit**

```bash
git add lib/regras/motor.ts lib/regras/motor.test.ts
git commit -m "feat: compose repository and prazo rule into the rules engine entry point"
```

---

## Self-Review Notes

- **Spec coverage**: this plan implements the "Motor de regras de negócio" bullet of the spec's Fase 2 (cálculo de valor, elegibilidade — prazo rule, desconto/alçada), plus the data-access-layer gap flagged during Fase 1's final review (spec's Fundação section asked for a mock repository behind a swappable interface; Fase 1's plan omitted it, so Task 1 here delivers it). Exceção-de-sigla, segundagem-fora-dos-coeficientes, and sem-preço eligibility checks are NOT re-implemented here — they arrive pre-computed in the `dados.js` fixture (confirmed via direct byte-count: 408/349/59 matches the README exactly), matching how the future BigQuery view (`vw_rps_comercial_amplificado`) is spec'd to pre-join and pre-flag them. "Minhas RPs" listing/filtering UI, proposal generation, and BigQuery wiring are explicitly out of scope for this plan — later phases.
- **Type consistency**: `Rp`/`LinhaRp` (Task 1) are consumed unchanged by Tasks 3 and 5. `RepositorioRps`/`criarRepositorioMock` (Task 1) consumed unchanged by Task 5. `aplicarRegraPrazo`/`calcularDataCorte`/`formatarDataISO` (Task 3) consumed unchanged by Task 5's `motor.ts`.
- **No placeholders**: every step has literal, complete file contents or literal shell commands; test values are drawn from the actual `dados.js` fixture (RP 702290) or from dates verified against a real calendar, not invented.
