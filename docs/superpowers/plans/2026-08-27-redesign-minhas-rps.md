# Redesign "Minhas RPs" (design handoff) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recriar a tela "Minhas RPs" (e o header/nav compartilhado) seguindo fielmente `design_handoff_hub_amplificado/README.md`: faixa de KPIs, tabela agrupada por mês, painel de proposta lateral, barra de ação fixa, com os tokens de cor/tipografia/espaçamento exatos do handoff.

**Architecture:** Tokens novos (aditivos, não sobrescrevem os existentes usados por Mapa de Inserção/Modal/Login — só a marca `--cor-marca`/`--gradiente-marca` é atualizada globalmente, por ser a identidade definitiva). Duas funções puras novas (agrupamento por mês). Componentes novos para KPI, checkbox customizado e painel de proposta redesenhado. `ListaRps.tsx` é reescrito por completo. Dados continuam vindo 100% de `carregarMinhasRps()` — nenhuma mudança na camada de dados.

**Tech Stack:** Next.js 15 App Router, TypeScript, CSS-in-JS via `style` inline (padrão já usado no projeto) + algumas classes CSS globais só para estados `:hover`/`:focus-visible` (não dá para fazer pseudo-classe via `style` inline).

**Spec:** `design_handoff_hub_amplificado/README.md` (o handoff é o próprio spec desta entrega — não há spec adicional).

## Global Constraints

- pt-BR em todos os identificadores/textos, com acentuação correta.
- `#F50234` (marca) só em: logo/gradiente, item de nav ativo, botão "Gerar proposta", indicador "PROPOSTA" no painel (`#FF5B7D` é a variante suave sobre fundo escuro, também aceitável). **Nunca** como cor de seleção/sucesso.
- `#0F8A5F` (disponibilidade) só em: status "Disponível", barra de estado da linha selecionada, checkbox marcado, foco do checkbox. **Nunca** para marca/ação primária.
- RPs não elegíveis: sempre visíveis na lista, checkbox desabilitado (`aria-disabled`), texto acinzentado, **nunca** selecionáveis; motivo disponível via `title` (já existe, reaproveitar).
- Todo número monetário/contagem tabular usa `formatarMoeda`/`toLocaleString('pt-BR')` já existentes — nunca formatar no servidor além do que já é feito.
- `font-variant-numeric: tabular-nums` em todo número monetário ou de contagem em coluna.
- Não sobrescrever tokens genéricos já usados por Mapa de Inserção, `ModalGerarProposta.tsx`, `PainelDetalhe.tsx` ou a tela de login (`--cor-fundo`, `--cor-superficie-suave`, `--cor-cabecalho-tabela`, `--cor-tinta-*`, `--cor-borda*`, `--raio-input`, `--raio-botao`, `--raio-card`/`--raio-cartao`, `--cor-sucesso-*`, `--cor-esgotado-*` continuam com os valores atuais) — os tokens novos deste redesign usam nomes próprios (prefixo `--cor-rps-*`/`--raio-rps-*`) para não regredir essas telas já entregues.
- Rodar `npm run typecheck` e `npm test` no fim de cada task.

---

### Task 1: Tokens novos e classes de hover (`app/globals.css`)

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: variáveis CSS novas (`--cor-rps-*`, `--raio-rps-*`) e classes `.aba-nav`, `.linha-rp`, `.botao-rps-secundario`, `.botao-rps-primario`, `.item-linha-proposta`, `.link-sair`, `.caixa-selecao` — consumidas pelas Tasks 2, 4, 5, 6, 7.

- [ ] **Step 1: Atualizar a marca (globalmente) e adicionar o bloco de tokens novo**

Em `app/globals.css`, dentro do `:root { ... }`, troque estas três linhas:

```css
  --cor-marca: #14161a;
  --cor-marca-hover: #000000;
  --gradiente-marca: linear-gradient(90deg, #ffa60c 0%, #f50234 97%);
```

por:

```css
  --cor-marca: #f50234;
  --cor-marca-hover: #ff2a55;
  --gradiente-marca: linear-gradient(90deg, #f50234 0%, #ff3b00 28%, #ff7a00 58%, #ffa00a 80%, #ffb612 100%);
```

Depois do bloco `/* Praça de exibição (Mapa de Inserção) ... */` (antes de `--overlay-modal`), adicione:

```css

  /* Redesign "Minhas RPs" (design_handoff_hub_amplificado/README.md) — tokens
     próprios (prefixo -rps-) para não alterar Mapa de Inserção, o modal de
     proposta ou o login, que usam os tokens genéricos acima. */
  --cor-rps-pagina: #f3f4f6;
  --cor-rps-superficie-suave: #f8f9fa;
  --cor-rps-cabecalho-tabela: #f4f5f7;
  --cor-rps-hover-linha: #f4f6f8;
  --cor-rps-borda: #e2e5e9;
  --cor-rps-borda-interna: #e8eaee;
  --cor-rps-borda-sutil: #eef0f3;
  --cor-rps-borda-tracejada: #ccd2da;

  --cor-rps-tinta-principal: #101820;
  --cor-rps-tinta-forte: #333a44;
  --cor-rps-tinta-corpo: #5b636e;
  --cor-rps-tinta-secundaria: #77808c;
  --cor-rps-tinta-terciaria: #aab1bb;
  --cor-rps-tinta-desabilitada: #8b93a0;
  --cor-rps-tinta-fraca: #c3c9d1;

  --cor-rps-disponivel-base: #0f8a5f;
  --cor-rps-disponivel-texto: #0b6b4a;
  --cor-rps-disponivel-fundo: #e6f6ef;
  --cor-rps-disponivel-borda: #bfe6d5;
  --cor-rps-disponivel-linha-fundo: #f2faf6;

  --cor-rps-nao-elegivel-texto: #77808c;
  --cor-rps-nao-elegivel-fundo: #f4f5f7;
  --cor-rps-nao-elegivel-borda: #e2e5e9;
  --cor-rps-nao-elegivel-ponto: #c3c9d1;

  --cor-rps-ink: #101820;
  --cor-rps-ink-avatar: #242c37;
  --cor-rps-ink-chip: #1e2732;
  --cor-rps-ink-hover: #1b2430;
  --cor-rps-ink-borda-botao: #2c3542;
  --cor-rps-ink-tinta-1: #d6dbe1;
  --cor-rps-ink-tinta-2: #e8ebee;
  --cor-rps-ink-tinta-3: #9aa4b0;
  --cor-rps-ink-tinta-4: #aeb6c0;
  --cor-rps-marca-suave: #ff5b7d;

  --raio-rps-input: 8px;
  --raio-rps-botao: 8px;
  --raio-rps-card: 12px;
  --raio-rps-chip: 5px;
  --raio-rps-nav: 7px;

  --fonte-rps-mono: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
```

- [ ] **Step 2: Adicionar as classes de hover/foco (fora do `:root`, no final do arquivo)**

```css

.aba-nav {
  transition: background-color 0.12s ease, color 0.12s ease;
}
.aba-nav:not(.aba-nav-ativa):hover {
  background: var(--cor-rps-ink-hover);
  color: #ffffff;
}

.link-sair {
  transition: color 0.12s ease;
}
.link-sair:hover {
  color: #ffffff;
}

.linha-rp {
  transition: background-color 0.12s ease;
}
.linha-rp:hover {
  background: var(--cor-rps-hover-linha);
}
.linha-rp.linha-rp-selecionada:hover {
  background: var(--cor-rps-disponivel-linha-fundo);
}

.botao-rps-secundario {
  transition: background-color 0.12s ease;
}
.botao-rps-secundario:hover {
  background: var(--cor-rps-ink-hover);
}

.botao-rps-primario {
  transition: background-color 0.12s ease;
}
.botao-rps-primario:hover:not(:disabled) {
  background: var(--cor-marca-hover);
}

.item-linha-proposta {
  transition: background-color 0.12s ease;
}
.item-linha-proposta:hover {
  background: var(--cor-rps-hover-linha);
}

.caixa-selecao:focus-visible {
  outline: 2px solid var(--cor-rps-disponivel-base);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Rodar o typecheck e conferir visualmente**

Run: `npm run typecheck`
Expected: sem erros (CSS puro, não afeta TS).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: add design tokens for the Minhas RPs redesign"
```

---

### Task 2: Header e navegação (`app/(app)/layout.tsx`, `components/nav/AbasPrincipais.tsx`)

**Files:**
- Modify: `app/(app)/layout.tsx`
- Modify: `components/nav/AbasPrincipais.tsx`

**Interfaces:**
- Consumes: tokens da Task 1 (`--cor-rps-ink`, `--cor-rps-ink-avatar`, etc.), `--gradiente-marca` atualizado.
- Produces: nenhuma interface nova — só visual.

- [ ] **Step 1: Reescrever `AbasPrincipais.tsx`**

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
    <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
      {ABAS.map((aba) => {
        const ativa = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={`aba-nav${ativa ? ' aba-nav-ativa' : ''}`}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--raio-rps-nav)',
              background: ativa ? 'var(--cor-marca)' : 'transparent',
              color: ativa ? '#ffffff' : 'var(--cor-rps-ink-tinta-4)',
              fontSize: 13,
              fontWeight: ativa ? 600 : 500,
              textDecoration: 'none',
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

- [ ] **Step 2: Reescrever o header em `app/(app)/layout.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { lerSessao } from '@/lib/auth/session';
import { AbasPrincipais } from '@/components/nav/AbasPrincipais';
import { sair } from './actions';

function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao();

  if (!sessao) {
    redirect('/login');
  }

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          height: 60,
          background: 'var(--cor-rps-ink)',
          color: '#ffffff',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <strong style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px', lineHeight: 1 }}>
              Hub Amplificado
            </strong>
            <span style={{ width: 64, height: 4, borderRadius: 2, background: 'var(--gradiente-marca)' }} />
          </div>
          <AbasPrincipais />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
          <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{sessao.nome}</div>
            <div style={{ fontSize: 11, color: 'var(--cor-rps-ink-tinta-3)' }}>
              {sessao.papel === 'gerente' ? 'Gerente · visão de equipe' : 'Executivo comercial'}
            </div>
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--cor-rps-ink-avatar)',
              color: 'var(--cor-rps-ink-tinta-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11.5,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {obterIniciais(sessao.nome)}
          </div>
          <form action={sair}>
            <button
              type="submit"
              className="link-sair"
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--cor-rps-ink-tinta-3)',
                fontSize: 12,
                cursor: 'pointer',
                paddingLeft: 12,
                borderLeft: '1px solid var(--cor-rps-ink-avatar)',
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

- [ ] **Step 3: Rodar o typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/layout.tsx" components/nav/AbasPrincipais.tsx
git commit -m "feat: redesign shared header and nav per design handoff"
```

---

### Task 3: Agrupamento por mês (`lib/rps/formato.ts`, `lib/rps/agrupamento.ts`)

**Files:**
- Modify: `lib/rps/formato.ts`
- Create: `lib/rps/agrupamento.ts`
- Test: `lib/rps/agrupamento.test.ts`

**Interfaces:**
- Consumes: `RpComStatus` (`lib/rps/rpComStatus.ts`), `MESES_PT`/lógica de datas já existente em `lib/rps/formato.ts`.
- Produces: `chaveMesDaRp(rp): string` e `rotuloMes(chave): string` (`lib/rps/formato.ts`); `GrupoMes` e `agruparRpsPorMes(rps): GrupoMes[]` (`lib/rps/agrupamento.ts`) — consumidos pela Task 7.

**Regra de agrupamento**: cada RP entra no grupo do mês da sua **primeira** data de exibição (mesma data usada por `mesDaRp` para o início do intervalo). RP sem nenhuma linha/data cai num grupo `'9999-99'` rotulado "Sem data", sempre por último. Grupos são ordenados cronologicamente (chave `AAAA-MM` crescente). O total do grupo soma `valorTabela` só das RPs elegíveis do grupo; se nenhuma RP do grupo for elegível, o total é `null` (renderiza "sem tabela").

- [ ] **Step 1: Adicionar `chaveMesDaRp` e `rotuloMes` a `lib/rps/formato.ts`**

Adicionar ao final do arquivo (depois de `mesDaRp`):

```ts
export function chaveMesDaRp(rp: RpComDatas): string {
  const datas = rp.linhas.flatMap((linha) => [linha.de, linha.ate]).filter(Boolean);
  if (datas.length === 0) {
    return '9999-99';
  }
  const primeira = [...datas].sort()[0];
  const [ano, mes] = primeira.split('-');
  return `${ano}-${mes}`;
}

export function rotuloMes(chave: string): string {
  if (chave === '9999-99') {
    return 'Sem data';
  }
  const [ano, mes] = chave.split('-');
  return `${capitalizar(MESES_PT[Number(mes) - 1])}/${ano}`;
}
```

(`RpComDatas`, `MESES_PT` e `capitalizar` já existem nesse arquivo — reaproveitar, não duplicar.)

- [ ] **Step 2: Escrever o teste de `lib/rps/agrupamento.ts`**

```ts
// lib/rps/agrupamento.test.ts
import { describe, expect, it } from 'vitest';
import type { LinhaRp } from '@/lib/data/rp';
import type { RpComStatus } from './rpComStatus';
import { agruparRpsPorMes } from './agrupamento';

function criarLinhaDeTeste(overrides: Partial<LinhaRp> = {}): LinhaRp {
  return {
    sigla: 'N20H',
    exib: 'RJ',
    chave: 'N20H_RJ',
    programa: 'Novela III',
    modalidade: 'COMERCIAL BREAK',
    secund: 60,
    mult: 2,
    precoBase: 100,
    unit: 200,
    nDatas: 22,
    total: 4400,
    motivos: [],
    de: '2026-09-01',
    ate: '2026-09-30',
    ...overrides,
  };
}

function criarRpDeTeste(overrides: Partial<RpComStatus> = {}): RpComStatus {
  return {
    rp: '1',
    anunciante: 'Anunciante Teste',
    cnpj: '00.000.000/0000-00',
    executivo: 'Executivo Teste',
    setor: 'Setor Teste',
    exib: 'RJ',
    portfolio: 'PORTFOLIO TESTE',
    cm: '000000',
    linhas: [criarLinhaDeTeste()],
    nDatas: 22,
    elegivel: true,
    motivos: [],
    valorTabela: 1000,
    status: 'Disponível',
    ...overrides,
  };
}

describe('agruparRpsPorMes', () => {
  it('agrupa RPs pelo mês da primeira data de exibição, em ordem cronológica', () => {
    const rps = [
      criarRpDeTeste({ rp: '1', linhas: [criarLinhaDeTeste({ de: '2026-10-01', ate: '2026-10-31' })] }),
      criarRpDeTeste({ rp: '2', linhas: [criarLinhaDeTeste({ de: '2026-09-01', ate: '2026-09-30' })] }),
    ];

    const grupos = agruparRpsPorMes(rps);

    expect(grupos.map((g) => g.chave)).toEqual(['2026-09', '2026-10']);
    expect(grupos[0].rotulo).toBe('Setembro/2026');
    expect(grupos[0].rps.map((rp) => rp.rp)).toEqual(['2']);
  });

  it('soma o valorTabela só das RPs elegíveis do grupo', () => {
    const rps = [
      criarRpDeTeste({ rp: '1', elegivel: true, valorTabela: 500 }),
      criarRpDeTeste({ rp: '2', elegivel: false, valorTabela: 999 }),
    ];

    const grupos = agruparRpsPorMes(rps);

    expect(grupos[0].totalTabela).toBe(500);
  });

  it('retorna totalTabela null quando nenhuma RP do grupo é elegível', () => {
    const rps = [criarRpDeTeste({ elegivel: false, valorTabela: 999 })];

    const grupos = agruparRpsPorMes(rps);

    expect(grupos[0].totalTabela).toBeNull();
  });

  it('agrupa RP sem linhas no grupo "Sem data", por último', () => {
    const rps = [
      criarRpDeTeste({ rp: '1', linhas: [] }),
      criarRpDeTeste({ rp: '2', linhas: [criarLinhaDeTeste({ de: '2026-09-01', ate: '2026-09-30' })] }),
    ];

    const grupos = agruparRpsPorMes(rps);

    expect(grupos.map((g) => g.rotulo)).toEqual(['Setembro/2026', 'Sem data']);
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npx vitest run lib/rps/agrupamento.test.ts`
Expected: FAIL — `Cannot find module './agrupamento'`.

- [ ] **Step 4: Implementar `lib/rps/agrupamento.ts`**

```ts
import type { RpComStatus } from './rpComStatus';
import { chaveMesDaRp, rotuloMes } from './formato';

export interface GrupoMes {
  chave: string;
  rotulo: string;
  rps: RpComStatus[];
  totalTabela: number | null;
}

export function agruparRpsPorMes(rps: RpComStatus[]): GrupoMes[] {
  const porChave = new Map<string, RpComStatus[]>();

  for (const rp of rps) {
    const chave = chaveMesDaRp(rp);
    const lista = porChave.get(chave) ?? [];
    lista.push(rp);
    porChave.set(chave, lista);
  }

  return [...porChave.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, rpsDoGrupo]) => {
      const elegiveisDoGrupo = rpsDoGrupo.filter((rp) => rp.elegivel);
      return {
        chave,
        rotulo: rotuloMes(chave),
        rps: rpsDoGrupo,
        totalTabela:
          elegiveisDoGrupo.length === 0
            ? null
            : elegiveisDoGrupo.reduce((soma, rp) => soma + rp.valorTabela, 0),
      };
    });
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npx vitest run lib/rps/agrupamento.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 6: Rodar a suíte inteira (garante que `chaveMesDaRp`/`rotuloMes` não quebraram `mesDaRp`)**

Run: `npm test && npm run typecheck`
Expected: tudo verde.

- [ ] **Step 7: Commit**

```bash
git add lib/rps/formato.ts lib/rps/agrupamento.ts lib/rps/agrupamento.test.ts
git commit -m "feat: group RPs by veiculação month"
```

---

### Task 4: Checkbox customizado (`components/rps/CaixaSelecao.tsx`)

**Files:**
- Create: `components/rps/CaixaSelecao.tsx`

**Interfaces:**
- Produces: componente `CaixaSelecao` — consumido pela Task 7 (cabeçalho "selecionar todos" e cada linha).

Sem teste automatizado (componente puramente visual/interativo, sem lógica pura a testar — mesmo padrão de `BadgeStatus.tsx`, que também não tem teste).

- [ ] **Step 1: Implementar**

```tsx
'use client';

import { useEffect, useRef } from 'react';

interface CaixaSelecaoProps {
  checked: boolean;
  indeterminado?: boolean;
  disabled?: boolean;
  titulo?: string;
  onChange: () => void;
  aoClicar?: (evento: React.MouseEvent) => void;
}

export function CaixaSelecao({ checked, indeterminado, disabled, titulo, onChange, aoClicar }: CaixaSelecaoProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminado) && !checked;
    }
  }, [indeterminado, checked]);

  const marcado = checked || indeterminado;

  return (
    <span style={{ position: 'relative', width: 16, height: 16, display: 'inline-block', flexShrink: 0 }}>
      <input
        ref={ref}
        type="checkbox"
        className="caixa-selecao"
        checked={checked}
        disabled={disabled}
        aria-disabled={disabled}
        title={titulo}
        onClick={aoClicar}
        onChange={onChange}
        style={{
          position: 'absolute',
          inset: 0,
          width: 16,
          height: 16,
          margin: 0,
          opacity: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: 16,
          height: 16,
          borderRadius: 4,
          border: `1.5px solid ${
            disabled
              ? 'var(--cor-rps-nao-elegivel-borda)'
              : marcado
                ? 'var(--cor-rps-disponivel-base)'
                : 'var(--cor-rps-tinta-terciaria)'
          }`,
          background: disabled
            ? 'var(--cor-rps-nao-elegivel-fundo)'
            : marcado
              ? 'var(--cor-rps-disponivel-base)'
              : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {!checked && indeterminado && <span style={{ width: 8, height: 1.6, background: '#ffffff' }} />}
      </span>
    </span>
  );
}
```

- [ ] **Step 2: Rodar o typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/rps/CaixaSelecao.tsx
git commit -m "feat: add custom checkbox component for the RP table"
```

---

### Task 5: `BadgeStatus.tsx` (recolorir) e `FaixaKpis.tsx` (novo)

**Files:**
- Modify: `components/rps/BadgeStatus.tsx`
- Create: `components/rps/FaixaKpis.tsx`

**Interfaces:**
- Consumes (FaixaKpis): valores já calculados pelo chamador (nenhuma lógica de negócio dentro do componente).
- Produces: `BadgeStatus` com novo visual (mesma interface de props, sem mudança de contrato) e `FaixaKpis` — consumidos pela Task 7.

- [ ] **Step 1: Recolorir `BadgeStatus.tsx`**

Substituir todo o conteúdo do arquivo por:

```tsx
import type { StatusComercial } from '@/lib/rps/rpComStatus';

interface BadgeStatusProps {
  status: StatusComercial;
  elegivel: boolean;
  motivos?: string[];
}

const CORES: Record<StatusComercial | 'Não elegível', { texto: string; fundo: string; borda: string; ponto: string }> = {
  Disponível: {
    texto: 'var(--cor-rps-disponivel-texto)',
    fundo: 'var(--cor-rps-disponivel-fundo)',
    borda: 'var(--cor-rps-disponivel-borda)',
    ponto: 'var(--cor-rps-disponivel-base)',
  },
  'Em negociação': {
    texto: 'var(--cor-neutro-texto)',
    fundo: 'var(--cor-neutro-fundo)',
    borda: 'var(--cor-neutro-borda)',
    ponto: 'var(--cor-neutro-borda)',
  },
  'Fechada Ganha': {
    texto: 'var(--cor-rps-disponivel-texto)',
    fundo: 'var(--cor-rps-disponivel-fundo)',
    borda: 'var(--cor-rps-disponivel-borda)',
    ponto: 'var(--cor-rps-disponivel-base)',
  },
  'Negócio Perdido': {
    texto: 'var(--cor-erro-texto)',
    fundo: 'var(--cor-erro-fundo)',
    borda: 'var(--cor-erro-borda)',
    ponto: 'var(--cor-erro-borda)',
  },
  'Não elegível': {
    texto: 'var(--cor-rps-nao-elegivel-texto)',
    fundo: 'var(--cor-rps-nao-elegivel-fundo)',
    borda: 'var(--cor-rps-nao-elegivel-borda)',
    ponto: 'var(--cor-rps-nao-elegivel-ponto)',
  },
};

export function BadgeStatus({ status, elegivel, motivos }: BadgeStatusProps) {
  const rotulo = elegivel ? status : 'Não elegível';
  const cor = CORES[rotulo];
  const titulo = !elegivel && motivos && motivos.length > 0 ? motivos.join('; ') : undefined;

  return (
    <span
      title={titulo}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        padding: '4px 10px 4px 8px',
        borderRadius: 'var(--raio-badge)',
        color: cor.texto,
        background: cor.fundo,
        border: `1px solid ${cor.borda}`,
        whiteSpace: 'nowrap',
        cursor: titulo ? 'help' : undefined,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cor.ponto, flexShrink: 0 }} />
      {rotulo}
    </span>
  );
}
```

- [ ] **Step 2: Implementar `FaixaKpis.tsx`**

```tsx
interface FaixaKpisProps {
  carteiraTotal: number;
  disponiveisContagem: number;
  tabelaDisponivel: number;
  selecionadoTotal: number;
}

function formatarMoedaKpi(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

function CardKpi({
  rotulo,
  valor,
  sufixo,
  corValor,
}: {
  rotulo: string;
  valor: string;
  sufixo?: string;
  corValor?: string;
}) {
  return (
    <div style={{ background: '#ffffff', padding: '15px 18px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--fonte-rps-mono)',
          fontSize: 9.5,
          letterSpacing: '.13em',
          textTransform: 'uppercase',
          color: 'var(--cor-rps-tinta-secundaria)',
        }}
      >
        {rotulo}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 23,
          fontWeight: 600,
          letterSpacing: '-.6px',
          fontVariantNumeric: 'tabular-nums',
          color: corValor ?? 'var(--cor-rps-tinta-principal)',
        }}
      >
        {valor}
        {sufixo && (
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--cor-rps-tinta-secundaria)', marginLeft: 4 }}>
            {sufixo}
          </span>
        )}
      </p>
    </div>
  );
}

export function FaixaKpis({ carteiraTotal, disponiveisContagem, tabelaDisponivel, selecionadoTotal }: FaixaKpisProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        gap: 1,
        background: 'var(--cor-rps-borda)',
        border: '1px solid var(--cor-rps-borda)',
        borderRadius: 'var(--raio-rps-card)',
        overflow: 'hidden',
      }}
    >
      <CardKpi rotulo="Carteira" valor={String(carteiraTotal)} sufixo="RPs" />
      <CardKpi
        rotulo="Disponíveis"
        valor={String(disponiveisContagem)}
        sufixo={`de ${carteiraTotal}`}
        corValor="var(--cor-rps-disponivel-base)"
      />
      <CardKpi rotulo="Tabela disponível" valor={formatarMoedaKpi(tabelaDisponivel)} />
      <CardKpi rotulo="Selecionado" valor={formatarMoedaKpi(selecionadoTotal)} />
    </div>
  );
}
```

- [ ] **Step 3: Rodar o typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add components/rps/BadgeStatus.tsx components/rps/FaixaKpis.tsx
git commit -m "feat: recolor status badge and add KPI strip per design handoff"
```

---

### Task 6: Painel de proposta (`components/rps/ResumoConsolidado.tsx`)

**Files:**
- Modify: `components/rps/ResumoConsolidado.tsx`

**Interfaces:**
- Consumes: `RpComStatus[]` (sem mudança de props — mesma interface já usada pela Task 7/ListaRps atual).
- Produces: mesmo componente, visual redesenhado conforme seção 1.4 do README.

- [ ] **Step 1: Substituir todo o conteúdo do arquivo**

```tsx
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import { formatarMoeda } from '@/lib/rps/formato';

interface ResumoConsolidadoProps {
  rps: RpComStatus[];
}

export function ResumoConsolidado({ rps }: ResumoConsolidadoProps) {
  const totalTabela = rps.reduce((soma, rp) => soma + rp.valorTabela, 0);
  const totalDatas = rps.reduce((soma, rp) => soma + rp.nDatas, 0);
  const anunciantesDistintos = [...new Set(rps.map((rp) => rp.anunciante))];

  const linhas = rps.flatMap((rp) => rp.linhas.map((linha) => ({ rp: rp.rp, linha })));

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--cor-rps-borda)',
        borderRadius: 'var(--raio-rps-card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', padding: '16px 18px 14px', background: 'var(--cor-rps-ink)', color: '#ffffff' }}>
        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--gradiente-marca)' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{rps.length} RPs selecionadas</span>
          <span
            style={{
              fontFamily: 'var(--fonte-rps-mono)',
              fontSize: 10,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: 'var(--cor-rps-marca-suave)',
            }}
          >
            Proposta
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
          {anunciantesDistintos.map((anunciante) => (
            <span
              key={anunciante}
              style={{
                fontFamily: 'var(--fonte-rps-mono)',
                fontSize: 10.5,
                padding: '3px 8px',
                borderRadius: 'var(--raio-rps-chip)',
                background: 'var(--cor-rps-ink-chip)',
                color: 'var(--cor-rps-ink-tinta-1)',
              }}
            >
              {anunciante}
            </span>
          ))}
          <span style={{ fontSize: 11.5, color: 'var(--cor-rps-ink-tinta-3)' }}>{totalDatas} datas de exibição</span>
        </div>
      </div>

      <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--cor-rps-borda-interna)' }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--fonte-rps-mono)',
            fontSize: 9.5,
            textTransform: 'uppercase',
            color: 'var(--cor-rps-tinta-secundaria)',
          }}
        >
          Total de tabela
        </p>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-.7px', fontVariantNumeric: 'tabular-nums' }}>
          {formatarMoeda(totalTabela)}
        </p>
      </div>

      <div style={{ padding: '12px 18px 4px', display: 'flex', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--fonte-rps-mono)',
            fontSize: 9.5,
            textTransform: 'uppercase',
            color: 'var(--cor-rps-tinta-secundaria)',
          }}
        >
          Linhas por RP
        </span>
        <span style={{ fontFamily: 'var(--fonte-rps-mono)', fontSize: 9.5, color: 'var(--cor-rps-tinta-terciaria)' }}>
          unitário × datas
        </span>
      </div>

      <div style={{ maxHeight: 420, overflow: 'auto', padding: '6px 6px 10px' }}>
        {linhas.map(({ rp, linha }, indice) => (
          <div
            key={indice}
            className="item-linha-proposta"
            style={{
              display: 'grid',
              gridTemplateColumns: '56px minmax(0,1fr) 62px 96px',
              gap: 6,
              padding: '9px 12px',
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: 'var(--fonte-rps-mono)', fontSize: 11, color: 'var(--cor-rps-tinta-secundaria)' }}>
              {rp}
            </span>
            <span
              style={{
                fontSize: 12.5,
                color: 'var(--cor-rps-tinta-principal)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {linha.programa}{' '}
              <span style={{ fontFamily: 'var(--fonte-rps-mono)', fontSize: 9.5, color: 'var(--cor-rps-tinta-terciaria)' }}>
                {linha.chave}
              </span>
            </span>
            <span
              style={{
                fontFamily: 'var(--fonte-rps-mono)',
                fontSize: 11,
                color: 'var(--cor-rps-tinta-corpo)',
                textAlign: 'right',
              }}
            >
              {linha.secund}″ {linha.nDatas}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 500, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
              {linha.total !== null ? formatarMoeda(linha.total) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rodar o typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/rps/ResumoConsolidado.tsx
git commit -m "feat: redesign consolidated proposal panel per design handoff"
```

---

### Task 7: `ListaRps.tsx` — redesign completo

**Files:**
- Modify: `components/rps/ListaRps.tsx`

**Interfaces:**
- Consumes: `FaixaKpis` (Task 5), `CaixaSelecao` (Task 4), `agruparRpsPorMes` (Task 3), `ResumoConsolidado` (Task 6), `BadgeStatus` (Task 5) — mais tudo que já era consumido (`ehSelecionavel`, `ehSelecionavelParaProposta`, `anuncianteDaSelecao`, `estadoSelecaoTodas`, `filtrarRps`, `resumoSelecao`, `formatarMoeda`, `mesDaRp`, `PainelDetalhe`, `ModalGerarProposta`).
- Produces: mesma interface de componente (`ListaRpsProps { rps, sessao }`) — sem mudança de contrato para `app/(app)/rps/page.tsx`.

**Notas de implementação:**
- A distinção **clique-abre-detalhe vs. checkbox-seleciona** continua exatamente como está hoje (confirmado com a stakeholder) — não seguir a recomendação do README de "clique alterna seleção".
- O limiar `selecionadas.length >= 2` para trocar `PainelDetalhe` por `ResumoConsolidado` já existe e não muda.
- Estados novos: carteira vazia (`rps.length === 0`) e resultado de filtro vazio (`filtradas.length === 0` com `rps.length > 0`).
- Colunas do grid (cabeçalho e linha, idênticas): `44px 92px minmax(160px,1fr) 66px 128px 156px 118px` → checkbox · RP · Anunciante · Praça · Mês · Tabela · Status.
- Wrapper de rolagem horizontal com `min-width: 860px` no conteúdo interno da tabela.

- [ ] **Step 1: Substituir todo o conteúdo do arquivo**

```tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Sessao } from '@/lib/auth/session';
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import { formatarMoeda, mesDaRp } from '@/lib/rps/formato';
import {
  anuncianteDaSelecao,
  ehSelecionavel,
  ehSelecionavelParaProposta,
  estadoSelecaoTodas,
  filtrarRps,
  resumoSelecao,
  type FiltrosRps,
} from '@/lib/rps/regrasLista';
import { agruparRpsPorMes } from '@/lib/rps/agrupamento';
import { BadgeStatus } from './BadgeStatus';
import { CaixaSelecao } from './CaixaSelecao';
import { FaixaKpis } from './FaixaKpis';
import { ModalGerarProposta } from './ModalGerarProposta';
import { PainelDetalhe } from './PainelDetalhe';
import { ResumoConsolidado } from './ResumoConsolidado';

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

const COLUNAS_TABELA = '44px 92px minmax(160px,1fr) 66px 128px 156px 118px';

const ESTILO_INPUT_FILTRO: React.CSSProperties = {
  height: 36,
  padding: '0 12px',
  border: '1px solid var(--cor-rps-borda)',
  borderRadius: 'var(--raio-rps-input)',
  background: 'var(--cor-rps-superficie-suave)',
  fontSize: 12.5,
  color: 'var(--cor-rps-tinta-forte)',
};

export function ListaRps({ rps, sessao }: ListaRpsProps) {
  const [filtros, setFiltros] = useState<FiltrosRps>(FILTROS_INICIAIS);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [modalPropostaAberto, setModalPropostaAberto] = useState(false);
  const checkboxCabecalhoRef = useRef<HTMLInputElement>(null);

  const pracas = useMemo(() => [...new Set(rps.map((rp) => rp.exib))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [rps]);
  const executivos = useMemo(
    () => [...new Set(rps.map((rp) => rp.executivo))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [rps]
  );
  const filtradas = useMemo(() => filtrarRps(rps, filtros), [rps, filtros]);
  const anuncianteSelecao = useMemo(() => anuncianteDaSelecao(rps, selecionadas), [rps, selecionadas]);
  const estadoTodas = estadoSelecaoTodas(filtradas, selecionadas, anuncianteSelecao);
  const resumo = resumoSelecao(rps, selecionadas);
  const grupos = useMemo(() => agruparRpsPorMes(filtradas), [filtradas]);

  const disponiveis = useMemo(() => rps.filter(ehSelecionavel), [rps]);
  const tabelaDisponivel = useMemo(() => disponiveis.reduce((soma, rp) => soma + rp.valorTabela, 0), [disponiveis]);

  useEffect(() => {
    if (checkboxCabecalhoRef.current) {
      checkboxCabecalhoRef.current.indeterminate = estadoTodas === 'parcial';
    }
  }, [estadoTodas]);

  function alternarSelecao(rp: string) {
    setSelecionadas((atual) => (atual.includes(rp) ? atual.filter((id) => id !== rp) : [...atual, rp]));
  }

  function alternarTodas() {
    const selecionaveisFiltradas = filtradas
      .filter((rp) => ehSelecionavelParaProposta(rp, anuncianteSelecao))
      .map((rp) => rp.rp);
    if (estadoTodas === 'todas') {
      setSelecionadas((atual) => atual.filter((id) => !selecionaveisFiltradas.includes(id)));
    } else {
      setSelecionadas((atual) => [...new Set([...atual, ...selecionaveisFiltradas])]);
    }
  }

  return (
    <div style={{ background: 'var(--cor-rps-pagina)', minHeight: 'calc(100vh - 60px)' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'flex-start',
          padding: '20px 24px 84px',
        }}
      >
        <main style={{ flex: '1 1 620px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FaixaKpis
            carteiraTotal={rps.length}
            disponiveisContagem={disponiveis.length}
            tabelaDisponivel={tabelaDisponivel}
            selecionadoTotal={resumo.totalTabela}
          />

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--cor-rps-borda)',
              borderRadius: 'var(--raio-rps-card)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '13px 16px',
                borderBottom: '1px solid var(--cor-rps-borda-interna)',
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <input
                value={filtros.busca}
                onChange={(evento) => setFiltros({ ...filtros, busca: evento.target.value })}
                placeholder="Buscar RP, anunciante ou CNPJ"
                style={{ ...ESTILO_INPUT_FILTRO, flex: 1, minWidth: 230 }}
              />
              <select
                value={filtros.praca}
                onChange={(evento) => setFiltros({ ...filtros, praca: evento.target.value })}
                style={ESTILO_INPUT_FILTRO}
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
                style={ESTILO_INPUT_FILTRO}
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
                style={ESTILO_INPUT_FILTRO}
              >
                <option value="todas">Elegibilidade: toda</option>
                <option value="sim">Só elegíveis</option>
                <option value="nao">Só não elegíveis</option>
              </select>
              {sessao.papel === 'gerente' && (
                <select
                  value={filtros.executivo}
                  onChange={(evento) => setFiltros({ ...filtros, executivo: evento.target.value })}
                  style={ESTILO_INPUT_FILTRO}
                >
                  <option value="">Executivo: todos</option>
                  {executivos.map((executivo) => (
                    <option key={executivo} value={executivo}>
                      {executivo}
                    </option>
                  ))}
                </select>
              )}
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--fonte-rps-mono)',
                  fontSize: 11,
                  color: 'var(--cor-rps-tinta-secundaria)',
                }}
              >
                {filtradas.length} / {rps.length}
              </span>
            </div>

            {rps.length === 0 ? (
              <p style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12.5, color: 'var(--cor-rps-tinta-secundaria)' }}>
                Nenhuma RP na sua carteira no momento.
              </p>
            ) : filtradas.length === 0 ? (
              <p style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12.5, color: 'var(--cor-rps-tinta-secundaria)' }}>
                Nenhuma RP encontrada para os filtros atuais.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: 860 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: COLUNAS_TABELA,
                      height: 38,
                      alignItems: 'center',
                      padding: '0 16px',
                      background: 'var(--cor-rps-cabecalho-tabela)',
                      borderBottom: '1px solid var(--cor-rps-borda)',
                      fontFamily: 'var(--fonte-rps-mono)',
                      fontSize: 9.5,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      color: 'var(--cor-rps-tinta-secundaria)',
                    }}
                  >
                    <CaixaSelecao
                      checked={estadoTodas === 'todas'}
                      indeterminado={estadoTodas === 'parcial'}
                      onChange={alternarTodas}
                    />
                    <span>RP</span>
                    <span>Anunciante</span>
                    <span>Praça</span>
                    <span>Mês</span>
                    <span style={{ textAlign: 'right' }}>Tabela</span>
                    <span style={{ textAlign: 'right' }}>Status</span>
                  </div>

                  {grupos.map((grupo) => (
                    <div key={grupo.chave}>
                      <div
                        style={{
                          padding: '9px 16px',
                          background: 'var(--cor-rps-superficie-suave)',
                          borderTop: '1px solid var(--cor-rps-borda-interna)',
                          borderBottom: '1px solid var(--cor-rps-borda-interna)',
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cor-rps-tinta-fraca)' }} />
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--cor-rps-tinta-forte)' }}>
                          {grupo.rotulo}
                        </span>
                        <span style={{ fontFamily: 'var(--fonte-rps-mono)', fontSize: 10, color: 'var(--cor-rps-tinta-desabilitada)' }}>
                          {grupo.rps.length} RPs
                        </span>
                        <span style={{ flex: 1, height: 1, background: 'var(--cor-rps-borda-interna)' }} />
                        <span
                          style={{
                            fontFamily: 'var(--fonte-rps-mono)',
                            fontSize: 10.5,
                            color: 'var(--cor-rps-tinta-corpo)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {grupo.totalTabela !== null ? formatarMoeda(grupo.totalTabela) : 'sem tabela'}
                        </span>
                      </div>

                      {grupo.rps.map((rp) => {
                        const selecionavel = ehSelecionavelParaProposta(rp, anuncianteSelecao);
                        const aberta = detalheId === rp.rp;
                        const marcada = selecionadas.includes(rp.rp);
                        const motivoIndisponivel = !ehSelecionavel(rp)
                          ? 'Só RPs elegíveis e com status Disponível podem ser selecionadas.'
                          : 'Só é possível selecionar RPs do mesmo cliente numa proposta.';

                        return (
                          <div
                            key={rp.rp}
                            onClick={() => setDetalheId(rp.rp)}
                            className={`linha-rp${marcada ? ' linha-rp-selecionada' : ''}`}
                            style={{
                              position: 'relative',
                              display: 'grid',
                              gridTemplateColumns: COLUNAS_TABELA,
                              height: 52,
                              alignItems: 'center',
                              padding: '0 16px',
                              borderBottom: '1px solid var(--cor-rps-borda-sutil)',
                              cursor: 'pointer',
                              background: aberta ? 'var(--cor-rps-hover-linha)' : marcada ? 'var(--cor-rps-disponivel-linha-fundo)' : '#ffffff',
                            }}
                          >
                            <span
                              aria-hidden
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: 3,
                                background: marcada ? 'var(--cor-rps-disponivel-base)' : 'transparent',
                              }}
                            />
                            <CaixaSelecao
                              checked={marcada}
                              disabled={!selecionavel}
                              titulo={selecionavel ? undefined : motivoIndisponivel}
                              aoClicar={(evento) => evento.stopPropagation()}
                              onChange={() => alternarSelecao(rp.rp)}
                            />
                            <span
                              style={{
                                fontFamily: 'var(--fonte-rps-mono)',
                                fontSize: 12.5,
                                fontWeight: 500,
                                color: rp.elegivel ? 'var(--cor-rps-tinta-principal)' : 'var(--cor-rps-tinta-desabilitada)',
                              }}
                            >
                              {rp.rp}
                            </span>
                            <span style={{ minWidth: 0 }}>
                              <span
                                style={{
                                  display: 'block',
                                  fontSize: 13,
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  color: rp.elegivel ? 'var(--cor-rps-tinta-principal)' : 'var(--cor-rps-tinta-desabilitada)',
                                }}
                              >
                                {rp.anunciante}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--cor-rps-tinta-terciaria)' }}>
                                {rp.linhas.length} linhas
                              </span>
                            </span>
                            <span>
                              <span
                                style={{
                                  fontFamily: 'var(--fonte-rps-mono)',
                                  fontSize: 10,
                                  letterSpacing: '.06em',
                                  padding: '3px 7px',
                                  borderRadius: 'var(--raio-rps-chip)',
                                  background: 'var(--cor-rps-borda-sutil)',
                                  color: 'var(--cor-rps-tinta-corpo)',
                                }}
                              >
                                {rp.exib}
                              </span>
                            </span>
                            <span style={{ fontSize: 12.5, color: 'var(--cor-rps-tinta-corpo)' }}>{mesDaRp(rp)}</span>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                textAlign: 'right',
                                fontVariantNumeric: 'tabular-nums',
                                color: rp.elegivel ? 'var(--cor-rps-tinta-principal)' : 'var(--cor-rps-tinta-fraca)',
                              }}
                            >
                              {rp.elegivel ? formatarMoeda(rp.valorTabela) : '—'}
                            </span>
                            <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <BadgeStatus status={rp.status} elegivel={rp.elegivel} motivos={rp.motivos} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        <aside style={{ flex: '0 1 400px', width: 400, position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selecionadas.length >= 2 ? (
            <ResumoConsolidado rps={rps.filter((rp) => selecionadas.includes(rp.rp))} />
          ) : detalheId ? (
            (() => {
              const rpAberta = rps.find((rp) => rp.rp === detalheId);
              return rpAberta ? (
                <PainelDetalhe rp={rpAberta} />
              ) : (
                <p style={{ fontSize: 12.5, color: 'var(--cor-rps-tinta-secundaria)' }}>RP não encontrada.</p>
              );
            })()
          ) : (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--cor-rps-borda)',
                borderRadius: 'var(--raio-rps-card)',
                padding: 16,
              }}
            >
              <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--cor-rps-tinta-secundaria)', margin: 0 }}>
                Selecione uma RP na lista para ver o detalhamento por programa, o valor unitário calculado e
                gerar uma proposta.
              </p>
            </div>
          )}

          <div
            style={{
              padding: '12px 16px',
              border: '1px dashed var(--cor-rps-borda-tracejada)',
              borderRadius: 'var(--raio-rps-card)',
              fontSize: 11.5,
              lineHeight: 1.5,
              color: 'var(--cor-rps-tinta-secundaria)',
            }}
          >
            Somente RPs <strong style={{ color: 'var(--cor-rps-disponivel-texto)', fontWeight: 600 }}>Disponíveis</strong>{' '}
            entram na proposta. RPs não elegíveis permanecem visíveis para consulta.
          </div>
        </aside>
      </div>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          padding: '12px 24px',
          background: 'var(--cor-rps-ink)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{resumo.quantidade} RPs disponíveis</span>
          <span style={{ width: 1, height: 14, background: 'var(--cor-rps-ink-avatar)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {formatarMoeda(resumo.totalTabela)}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--cor-rps-ink-tinta-3)' }}>
            {rps.filter((rp) => selecionadas.includes(rp.rp)).reduce((soma, rp) => soma + rp.nDatas, 0)} datas
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button
            type="button"
            disabled
            className="botao-rps-secundario"
            style={{
              height: 38,
              padding: '0 16px',
              border: '1px solid var(--cor-rps-ink-borda-botao)',
              background: 'transparent',
              borderRadius: 'var(--raio-rps-botao)',
              color: 'var(--cor-rps-ink-tinta-2)',
              fontSize: 13,
              fontWeight: 500,
              opacity: 0.5,
              cursor: 'not-allowed',
            }}
          >
            Alterar status
          </button>
          <button
            type="button"
            onClick={() => setModalPropostaAberto(true)}
            disabled={selecionadas.length === 0}
            className="botao-rps-primario"
            style={{
              height: 38,
              padding: '0 20px',
              border: 'none',
              borderRadius: 'var(--raio-rps-botao)',
              background: 'var(--cor-marca)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              opacity: selecionadas.length === 0 ? 0.45 : 1,
              cursor: selecionadas.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Gerar proposta
          </button>
        </div>
      </div>

      {modalPropostaAberto && (
        <ModalGerarProposta
          rpsSelecionadas={rps.filter((rp) => selecionadas.includes(rp.rp))}
          aoFechar={() => setModalPropostaAberto(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rodar o typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Rodar a suíte inteira**

Run: `npm test`
Expected: tudo verde (esta task não altera nenhuma função pura testada — só o componente visual).

- [ ] **Step 4: Testar manualmente**

Run: `npm run dev`, acessar `/rps`, conferir: KPIs corretos, agrupamento por mês, seleção funcionando (checkbox e clique continuam distintos), painel consolidado ao marcar 2+, barra fixa, filtros, estado de carteira vazia (pode simular temporariamente passando `rps={[]}` — reverter depois do teste).

- [ ] **Step 5: Commit**

```bash
git add components/rps/ListaRps.tsx
git commit -m "feat: redesign Minhas RPs screen per design handoff"
```

---

### Task 8: Estados de carregamento e erro (`app/(app)/rps/loading.tsx`, `app/(app)/rps/error.tsx`)

**Files:**
- Create: `app/(app)/rps/loading.tsx`
- Create: `app/(app)/rps/error.tsx`

**Interfaces:**
- Consumes: nenhuma (arquivos especiais do App Router do Next.js — `loading.tsx` é mostrado automaticamente via Suspense enquanto `page.tsx` resolve a busca de dados assíncrona; `error.tsx` captura erros lançados durante a renderização/busca de dados desse segmento).

- [ ] **Step 1: Implementar `loading.tsx` (skeleton)**

```tsx
function LinhaEsqueleto() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 92px minmax(160px,1fr) 66px 128px 156px 118px',
        height: 52,
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid var(--cor-rps-borda-sutil)',
      }}
    >
      {Array.from({ length: 7 }).map((_, indice) => (
        <span
          key={indice}
          style={{
            height: 12,
            width: indice === 2 ? '70%' : '50%',
            borderRadius: 4,
            background: 'var(--cor-rps-borda-sutil)',
          }}
        />
      ))}
    </div>
  );
}

export default function CarregandoMinhasRps() {
  return (
    <div style={{ background: 'var(--cor-rps-pagina)', minHeight: 'calc(100vh - 60px)', padding: '20px 24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: 1,
          background: 'var(--cor-rps-borda)',
          border: '1px solid var(--cor-rps-borda)',
          borderRadius: 'var(--raio-rps-card)',
          overflow: 'hidden',
          marginBottom: 14,
        }}
      >
        {Array.from({ length: 4 }).map((_, indice) => (
          <div key={indice} style={{ background: '#ffffff', padding: '15px 18px 14px' }}>
            <span style={{ display: 'block', height: 10, width: 80, borderRadius: 4, background: 'var(--cor-rps-borda-sutil)', marginBottom: 8 }} />
            <span style={{ display: 'block', height: 20, width: 100, borderRadius: 4, background: 'var(--cor-rps-borda-sutil)' }} />
          </div>
        ))}
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--cor-rps-borda)', borderRadius: 'var(--raio-rps-card)', overflow: 'hidden' }}>
        {Array.from({ length: 8 }).map((_, indice) => (
          <LinhaEsqueleto key={indice} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implementar `error.tsx`**

```tsx
'use client';

export default function ErroMinhasRps({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          textAlign: 'center',
          background: '#ffffff',
          border: '1px solid var(--cor-rps-borda)',
          borderRadius: 'var(--raio-rps-card)',
          padding: 28,
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--cor-rps-tinta-principal)', margin: '0 0 6px' }}>
          Não foi possível carregar suas RPs
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--cor-rps-tinta-secundaria)', margin: '0 0 18px' }}>
          {error.message || 'Ocorreu um erro inesperado ao buscar sua carteira.'}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            height: 38,
            padding: '0 20px',
            border: 'none',
            borderRadius: 'var(--raio-rps-botao)',
            background: 'var(--cor-marca)',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Rodar o typecheck e a suíte inteira**

Run: `npm run typecheck && npm test`
Expected: tudo verde.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/rps/loading.tsx" "app/(app)/rps/error.tsx"
git commit -m "feat: add loading skeleton and error state for Minhas RPs"
```
