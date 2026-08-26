# Proposta em PDF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Habilitar o botão "Gerar proposta" (hoje desabilitado) em Minhas RPs para gerar um PDF de proposta comercial — uma página por RP selecionada, com tabela de linhas de programação, desconto de agência (20%, condicionado a um mock de "cliente possui agência") e desconto do executivo (com alçada de 20%).

**Architecture:** Módulos puros de cálculo (`lib/propostas/calculoProposta.ts`) e de dados server-only (`lib/data/tabelaPrecos.ts`, `lib/data/agenciaMock.ts`) alimentam um template `@react-pdf/renderer` (`components/pdf/PropostaDocumento.tsx`), renderizado num Route Handler (`app/api/proposta/route.ts`) que valida sessão/carteira/alçada no servidor. Um modal client-side (`components/rps/ModalGerarProposta.tsx`) coleta desconto e agência por RP e dispara o download.

**Tech Stack:** Next.js 15 App Router, TypeScript, `@react-pdf/renderer` (novo), `xlsx` (já usado), Vitest.

**Spec:** `docs/superpowers/specs/2026-08-26-proposta-pdf-design.md`

## Global Constraints

- pt-BR em todos os identificadores/textos visíveis, com acentuação correta.
- Módulos que usam `fs`/`path`/`xlsx` (Node) levam o comentário padrão do
  projeto: `// Usa fs/path (Node) [e a biblioteca xlsx] — nunca importar
  este módulo a partir de um componente 'use client'.`
- Nunca usar hex cru fora de `app/globals.css`/PDF — no app web, sempre
  `var(--cor-*)`. Dentro do template PDF (`@react-pdf/renderer` não lê CSS
  custom properties), usar os valores hex documentados abaixo, copiados
  literalmente de `app/globals.css`.
- Alçada de desconto: 20% (`avaliarDesconto` em `lib/regras/desconto.ts`,
  `percentualLimite` padrão). O desconto do executivo nunca passa de 20% —
  validado no cliente (modal) E no servidor (route handler).
- Desconto de agência é sempre 20% fixo quando a RP tem agência marcada;
  não editável.
- Cores de referência para o PDF: gradiente marca `#FFA60C` (0%) →
  `#F50234` (97%); tinta principal `#14161a`; tinta secundária `#5a606a`;
  tinta terciária `#8a909a`; borda `#eceef1`; borda forte `#d7dae0`;
  cabeçalho de tabela `#f7f8f9`.
- Rodar `npm run typecheck` e `npm test` no fim de cada task.

---

### Task 1: Dependência `@react-pdf/renderer`

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: pacote `@react-pdf/renderer` instalado e disponível para
  import em `components/pdf/PropostaDocumento.tsx` e
  `app/api/proposta/route.ts` (tasks seguintes).

- [ ] **Step 1: Instalar a dependência**

Run: `npm install @react-pdf/renderer@4.8.1`

Isso atualiza `package.json` (nova entrada em `dependencies`) e
`package-lock.json`.

- [ ] **Step 2: Verificar que o projeto ainda builda**

Run: `npm run typecheck && npm test`
Expected: mesmos resultados de antes (nenhum teste novo ainda,
typecheck limpo) — confirma que a instalação não quebrou nada.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @react-pdf/renderer dependency"
```

---

### Task 2: `lib/data/tabelaPrecos.ts` — leitura da coluna "Proposta CA"

**Files:**
- Create: `lib/data/tabelaPrecos.ts`
- Test: `lib/data/tabelaPrecos.test.ts`

**Interfaces:**
- Consumes: `fontes/Tabela de Precos Comercial Amplificado.xlsx` (abas
  `Base` e `Regional`), via `xlsx` (mesmo pacote usado em
  `lib/data/datasExibicao.ts`).
- Produces: `obterPropostaCaPorChave(): Record<string, number>`,
  consumida pela Task 4 (`montarLinhasProposta`). Chave no formato
  `${sigla}_${praca}` — o MESMO formato de `LinhaRp.chave` (ex.:
  `"BPRA_RJ"`, `"ALTA_NET"`), para permitir o lookup direto
  `propostaCaPorChave[linha.chave]` sem reconstrução de string.

**Contexto dos dados (confirmado por inspeção direta do arquivo):**
- Aba `Base`: cada linha é um programa nacional ("rede"), sempre praça
  `NET` (coluna `programa_tipo`, índice 2). Colunas relevantes por
  índice: `0` = PGM (sigla), `2` = praça, `6` = "Proposta CA" (string
  tipo `"182,080"`), `7` = "Comercial Amplificado" (preço, não usado
  aqui). A linha de cabeçalho real (`"PGM"` na coluna 0) não é a
  primeira linha da planilha — há uma linha em branco antes dela — por
  isso o parser deve localizar o cabeçalho pelo conteúdo, não por índice
  fixo.
- Aba `Regional`: mesmo layout de colunas, mas praça é `SP` ou `RJ`
  (nunca `NET`). Há linhas finais com colunas vazias que devem ser
  ignoradas. `SP` deve ser normalizado para `SP1` (convenção usada em
  todo o resto do app — ver `lib/data/carteira.ts`,
  `components/mapa/MapaInsercao.tsx`).
- Valores confirmados por leitura direta do arquivo (usados nos testes):
  `ALTA` em `Base` → praça `NET`, Proposta CA `"182,080"` → chave
  `ALTA_NET` = `182080`. `BPRA` em `Regional` → linha praça `RJ`,
  Proposta CA `"63,760"` → chave `BPRA_RJ` = `63760`; linha praça `SP`,
  Proposta CA `"58,320"` → chave `BPRA_SP1` = `58320`.

- [ ] **Step 1: Escrever o teste**

```ts
// lib/data/tabelaPrecos.test.ts
import { describe, expect, it } from 'vitest';
import { obterPropostaCaPorChave } from './tabelaPrecos';

describe('obterPropostaCaPorChave', () => {
  const propostaCaPorChave = obterPropostaCaPorChave();

  it('inclui um programa nacional (aba Base, praça NET)', () => {
    expect(propostaCaPorChave['ALTA_NET']).toBe(182080);
  });

  it('inclui um programa regional no RJ (aba Regional)', () => {
    expect(propostaCaPorChave['BPRA_RJ']).toBe(63760);
  });

  it('normaliza a praça SP da aba Regional para SP1', () => {
    expect(propostaCaPorChave['BPRA_SP1']).toBe(58320);
    expect(propostaCaPorChave['BPRA_SP']).toBeUndefined();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run lib/data/tabelaPrecos.test.ts`
Expected: FAIL — `Cannot find module './tabelaPrecos'`.

- [ ] **Step 3: Implementar**

```ts
// lib/data/tabelaPrecos.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';

// Usa fs/path (Node) e a biblioteca xlsx — nunca importar este módulo a partir de um componente 'use client'.

const NORMALIZACAO_PRACA: Record<string, string> = {
  SP: 'SP1',
};

function normalizarPraca(praca: string): string {
  return NORMALIZACAO_PRACA[praca] ?? praca;
}

function extrairLinhasDaAba(linhas: unknown[][]): Array<{ sigla: string; praca: string; propostaCa: number }> {
  const indiceCabecalho = linhas.findIndex((linha) => linha[0] === 'PGM');
  if (indiceCabecalho === -1) {
    return [];
  }

  return linhas
    .slice(indiceCabecalho + 1)
    .filter((linha): linha is unknown[] => typeof linha[0] === 'string' && linha[0].trim() !== '')
    .map((linha) => ({
      sigla: String(linha[0]),
      praca: normalizarPraca(String(linha[2])),
      propostaCa: Number(String(linha[6]).replace(/,/g, '')),
    }));
}

let cache: Record<string, number> | null = null;

export function obterPropostaCaPorChave(): Record<string, number> {
  if (cache) {
    return cache;
  }

  const caminho = join(process.cwd(), 'fontes', 'Tabela de Precos Comercial Amplificado.xlsx');
  const buffer = readFileSync(caminho);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const linhasBase = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets['Base'], { header: 1, raw: false });
  const linhasRegional = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets['Regional'], { header: 1, raw: false });

  const registros = [...extrairLinhasDaAba(linhasBase), ...extrairLinhasDaAba(linhasRegional)];

  cache = {};
  for (const registro of registros) {
    cache[`${registro.sigla}_${registro.praca}`] = registro.propostaCa;
  }
  return cache;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run lib/data/tabelaPrecos.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/data/tabelaPrecos.ts lib/data/tabelaPrecos.test.ts
git commit -m "feat: read Proposta CA (impressões) from price sheet by sigla+praça"
```

---

### Task 3: `lib/data/agenciaMock.ts` — mock determinístico de agência

**Files:**
- Create: `lib/data/agenciaMock.ts`
- Test: `lib/data/agenciaMock.test.ts`

**Interfaces:**
- Produces: `obterAgenciaMock(rpId: string): string | null`, consumida
  pela Task 7 (pré-preenchimento do modal) e reaproveitável pela Task 6
  (fallback no servidor, caso o modal não envie um valor).

Este módulo NÃO lê nenhum arquivo — é puro e síncrono. Não precisa do
comentário de "server-only", mas fica em `lib/data/` por ser, conceitualmente,
uma fonte de dados temporária que será substituída por uma coluna real no
futuro (ver spec, seção "Fora de escopo").

- [ ] **Step 1: Escrever o teste**

```ts
// lib/data/agenciaMock.test.ts
import { describe, expect, it } from 'vitest';
import { obterAgenciaMock } from './agenciaMock';

describe('obterAgenciaMock', () => {
  it('é determinístico para o mesmo id de RP', () => {
    expect(obterAgenciaMock('702290')).toBe(obterAgenciaMock('702290'));
  });

  it('retorna null para uma RP sem agência mockada', () => {
    expect(obterAgenciaMock('702290')).toBeNull();
  });

  it('retorna um nome de agência para uma RP com agência mockada', () => {
    expect(obterAgenciaMock('999999')).toBe('DPZ&T');
  });

  it('retorna nomes diferentes conforme o id', () => {
    expect(obterAgenciaMock('2')).toBe('WMcCann');
    expect(obterAgenciaMock('3')).toBe('Ogilvy Brasil');
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run lib/data/agenciaMock.test.ts`
Expected: FAIL — `Cannot find module './agenciaMock'`.

- [ ] **Step 3: Implementar**

```ts
// lib/data/agenciaMock.ts
const NOMES_AGENCIA = ['WMcCann', 'Ogilvy Brasil', 'DPZ&T', 'Africa Criação', 'AlmapBBDO'];

/**
 * Mock determinístico de agência por RP, até a base trazer uma coluna
 * real de Agência. ~30% das RPs recebem uma agência; as demais, null.
 */
export function obterAgenciaMock(rpId: string): string | null {
  const hash = [...rpId].reduce((soma, caractere) => soma + caractere.charCodeAt(0), 0);
  if (hash % 10 < 3) {
    return NOMES_AGENCIA[hash % NOMES_AGENCIA.length];
  }
  return null;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run lib/data/agenciaMock.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/data/agenciaMock.ts lib/data/agenciaMock.test.ts
git commit -m "feat: add deterministic agência mock per RP"
```

---

### Task 4: `lib/propostas/calculoProposta.ts` — cálculos puros da proposta

**Files:**
- Create: `lib/propostas/calculoProposta.ts`
- Test: `lib/propostas/calculoProposta.test.ts`

**Interfaces:**
- Consumes: `Rp`/`LinhaRp` de `lib/data/rp.ts`.
- Produces: `LinhaProposta`, `TotalProposta`,
  `calcularValorBrutoNegociado`, `calcularValorLiquido`,
  `calcularTotalImpressoes`, `montarLinhasProposta` — consumidos pela
  Task 6 (route handler, que monta os dados) e pela Task 5 (template,
  que só recebe `LinhaProposta[]`/`TotalProposta` prontos).

- [ ] **Step 1: Escrever os testes**

```ts
// lib/propostas/calculoProposta.test.ts
import { describe, expect, it } from 'vitest';
import type { Rp } from '@/lib/data/rp';
import {
  calcularTotalImpressoes,
  calcularValorBrutoNegociado,
  calcularValorLiquido,
  montarLinhasProposta,
} from './calculoProposta';

describe('calcularValorBrutoNegociado', () => {
  it('aplica o desconto do executivo sobre o valor de tabela', () => {
    expect(calcularValorBrutoNegociado(24336, 10)).toBeCloseTo(21902.4, 2);
  });

  it('sem desconto, retorna o próprio valor de tabela', () => {
    expect(calcularValorBrutoNegociado(24336, 0)).toBeCloseTo(24336, 2);
  });
});

describe('calcularValorLiquido', () => {
  it('aplica 20% de desconto de agência quando possuiAgencia é true', () => {
    expect(calcularValorLiquido(21902.4, true)).toBeCloseTo(17521.92, 2);
  });

  it('não aplica desconto quando possuiAgencia é false', () => {
    expect(calcularValorLiquido(21902.4, false)).toBeCloseTo(21902.4, 2);
  });
});

describe('calcularTotalImpressoes', () => {
  it('multiplica o valor de Proposta CA pela quantidade de inserções', () => {
    expect(calcularTotalImpressoes(41600, 13)).toBe(540800);
  });
});

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

describe('montarLinhasProposta', () => {
  it('monta uma linha por LinhaRp com todos os valores calculados', () => {
    const rp = criarRpDeTeste({
      linhas: [
        {
          sigla: 'MAVO',
          exib: 'RJ',
          chave: 'MAVO_RJ',
          programa: 'Mais Você',
          modalidade: 'COMERCIAL BREAK',
          secund: 15,
          mult: 0.75,
          precoBase: 2496,
          unit: 1872,
          nDatas: 13,
          total: 24336,
          motivos: [],
          de: '2026-09-01',
          ate: '2026-09-30',
        },
      ],
    });

    const { linhas, total } = montarLinhasProposta(rp, 10, true, { MAVO_RJ: 41600 });

    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toEqual({
      sigla: 'MAVO',
      programa: 'Mais Você',
      secundagem: 15,
      local: 'RJ',
      precoInsercao: 1872,
      totalInsercoes: 13,
      totalImpressoes: 540800,
      valorTabela: 24336,
      percentualDesconto: 10,
      valorBrutoNegociado: 21902.4,
      valorLiquido: 17521.92,
    });
    expect(total).toEqual({
      totalInsercoes: 13,
      totalImpressoes: 540800,
      valorTabela: 24336,
      percentualDesconto: 10,
      valorBrutoNegociado: 21902.4,
      valorLiquido: 17521.92,
    });
  });

  it('usa 0 quando a chave da linha não está na tabela de Proposta CA', () => {
    const rp = criarRpDeTeste({
      linhas: [
        {
          sigla: 'XYZW',
          exib: 'RJ',
          chave: 'XYZW_RJ',
          programa: 'Programa Sem Preço',
          modalidade: 'COMERCIAL BREAK',
          secund: 30,
          mult: 1,
          precoBase: 100,
          unit: 100,
          nDatas: 2,
          total: 200,
          motivos: [],
          de: '2026-09-01',
          ate: '2026-09-30',
        },
      ],
    });

    const { linhas } = montarLinhasProposta(rp, 0, false, {});

    expect(linhas[0].totalImpressoes).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run lib/propostas/calculoProposta.test.ts`
Expected: FAIL — `Cannot find module './calculoProposta'`.

- [ ] **Step 3: Implementar**

```ts
// lib/propostas/calculoProposta.ts
import type { Rp } from '@/lib/data/rp';

export interface LinhaProposta {
  sigla: string;
  programa: string;
  secundagem: number;
  local: string;
  precoInsercao: number;
  totalInsercoes: number;
  totalImpressoes: number;
  valorTabela: number;
  percentualDesconto: number;
  valorBrutoNegociado: number;
  valorLiquido: number;
}

export interface TotalProposta {
  totalInsercoes: number;
  totalImpressoes: number;
  valorTabela: number;
  percentualDesconto: number;
  valorBrutoNegociado: number;
  valorLiquido: number;
}

export function calcularValorBrutoNegociado(valorTabela: number, percentualDesconto: number): number {
  return valorTabela * (1 - percentualDesconto / 100);
}

export function calcularValorLiquido(valorBrutoNegociado: number, possuiAgencia: boolean): number {
  return possuiAgencia ? valorBrutoNegociado * 0.8 : valorBrutoNegociado;
}

export function calcularTotalImpressoes(propostaCa: number, nDatas: number): number {
  return propostaCa * nDatas;
}

export function montarLinhasProposta(
  rp: Rp,
  percentualDesconto: number,
  possuiAgencia: boolean,
  propostaCaPorChave: Record<string, number>
): { linhas: LinhaProposta[]; total: TotalProposta } {
  const linhas: LinhaProposta[] = rp.linhas.map((linha) => {
    const valorTabela = linha.total ?? 0;
    const valorBrutoNegociado = calcularValorBrutoNegociado(valorTabela, percentualDesconto);
    const valorLiquido = calcularValorLiquido(valorBrutoNegociado, possuiAgencia);
    const propostaCa = propostaCaPorChave[linha.chave] ?? 0;

    return {
      sigla: linha.sigla,
      programa: linha.programa,
      secundagem: linha.secund,
      local: linha.exib,
      precoInsercao: linha.unit ?? 0,
      totalInsercoes: linha.nDatas,
      totalImpressoes: calcularTotalImpressoes(propostaCa, linha.nDatas),
      valorTabela,
      percentualDesconto,
      valorBrutoNegociado,
      valorLiquido,
    };
  });

  const total: TotalProposta = linhas.reduce(
    (acumulado, linha) => ({
      totalInsercoes: acumulado.totalInsercoes + linha.totalInsercoes,
      totalImpressoes: acumulado.totalImpressoes + linha.totalImpressoes,
      valorTabela: acumulado.valorTabela + linha.valorTabela,
      percentualDesconto,
      valorBrutoNegociado: acumulado.valorBrutoNegociado + linha.valorBrutoNegociado,
      valorLiquido: acumulado.valorLiquido + linha.valorLiquido,
    }),
    {
      totalInsercoes: 0,
      totalImpressoes: 0,
      valorTabela: 0,
      percentualDesconto,
      valorBrutoNegociado: 0,
      valorLiquido: 0,
    }
  );

  return { linhas, total };
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run lib/propostas/calculoProposta.test.ts`
Expected: PASS (6 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/propostas/calculoProposta.ts lib/propostas/calculoProposta.test.ts
git commit -m "feat: pure calculation functions for PDF proposal lines"
```

---

### Task 5: `components/pdf/PropostaDocumento.tsx` — template do PDF

**Files:**
- Create: `components/pdf/PropostaDocumento.tsx`

**Interfaces:**
- Consumes: `LinhaProposta`/`TotalProposta` de
  `lib/propostas/calculoProposta.ts`; `formatarMoeda` de
  `lib/rps/formato.ts`.
- Produces: `PaginaProposta` (interface exportada), componente
  `PropostaDocumento` (`Document` do `@react-pdf/renderer`), consumido
  pela Task 6 (route handler chama `renderToBuffer(<PropostaDocumento
  paginas={...} dataGeracao={...} />)`).

Sem teste automatizado nesta task — o projeto não usa
`@testing-library/react` (só testes de função pura em Node, ver
`vitest.config.ts`: `environment: 'node'`) e `@react-pdf/renderer` não
roda sob jsdom. A verificação de que o template compila e renderiza um
PDF válido acontece na Task 6, via teste de integração do route handler.

- [ ] **Step 1: Implementar o componente**

```tsx
// components/pdf/PropostaDocumento.tsx
import { join } from 'node:path';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from '@react-pdf/renderer';
import { formatarMoeda } from '@/lib/rps/formato';
import type { LinhaProposta, TotalProposta } from '@/lib/propostas/calculoProposta';

// Usa fs/path (Node) — nunca importar este módulo a partir de um componente 'use client'.

const PASTA_FONTES = join(process.cwd(), 'assets', 'fonts');

Font.register({
  family: 'Globotipo Corporativa',
  fonts: [
    { src: join(PASTA_FONTES, 'GlobotipoCorporativa-Regular.ttf'), fontWeight: 400 },
    { src: join(PASTA_FONTES, 'GlobotipoCorporativa-Bold.ttf'), fontWeight: 700 },
  ],
});

Font.register({
  family: 'Globotipo Corporativa Textos',
  fonts: [
    { src: join(PASTA_FONTES, 'GlobotipoCorporativaTextos-Regular.ttf'), fontWeight: 400 },
    { src: join(PASTA_FONTES, 'GlobotipoCorporativaTextos-Bold.ttf'), fontWeight: 700 },
  ],
});

export interface PaginaProposta {
  rp: string;
  cliente: string;
  executivo: string;
  agencia: string | null;
  mesAno: string;
  linhas: LinhaProposta[];
  total: TotalProposta;
}

interface PropostaDocumentoProps {
  paginas: PaginaProposta[];
  dataGeracao: string;
}

const LARGURA_PAGINA = 842;
const ALTURA_FAIXA = 64;

const styles = StyleSheet.create({
  pagina: {
    fontFamily: 'Globotipo Corporativa Textos',
    fontSize: 9,
    color: '#14161a',
    paddingBottom: 32,
  },
  faixaCabecalho: {
    height: ALTURA_FAIXA,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  faixaSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tituloFaixa: {
    fontFamily: 'Globotipo Corporativa',
    fontWeight: 700,
    fontSize: 18,
    color: '#ffffff',
  },
  subtituloFaixa: {
    fontFamily: 'Globotipo Corporativa Textos',
    fontSize: 10,
    color: '#ffffff',
    marginTop: 2,
  },
  corpo: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  linhaCabecalhoInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  campoInfo: {
    marginRight: 28,
    marginBottom: 6,
  },
  rotuloInfo: {
    fontSize: 8,
    color: '#8a909a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  valorInfo: {
    fontFamily: 'Globotipo Corporativa',
    fontWeight: 700,
    fontSize: 11,
    marginTop: 2,
  },
  tabela: {
    borderWidth: 1,
    borderColor: '#eceef1',
    borderRadius: 4,
  },
  linhaTabela: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eceef1',
    alignItems: 'center',
    minHeight: 22,
  },
  linhaCabecalhoTabela: {
    backgroundColor: '#f7f8f9',
  },
  linhaTotal: {
    backgroundColor: '#f7f8f9',
    borderBottomWidth: 0,
  },
  celula: {
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  textoCabecalhoCelula: {
    fontFamily: 'Globotipo Corporativa',
    fontWeight: 700,
    fontSize: 7.5,
    color: '#5a606a',
    textTransform: 'uppercase',
  },
  textoTotal: {
    fontFamily: 'Globotipo Corporativa',
    fontWeight: 700,
  },
  colSigla: { width: '7%' },
  colPrograma: { width: '17%' },
  colSecundagem: { width: '7%', textAlign: 'right' },
  colLocal: { width: '6%' },
  colPreco: { width: '11%', textAlign: 'right' },
  colInsercoes: { width: '9%', textAlign: 'right' },
  colImpressoes: { width: '11%', textAlign: 'right' },
  colTabela: { width: '11%', textAlign: 'right' },
  colDesconto: { width: '7%', textAlign: 'right' },
  colBruto: { width: '13%', textAlign: 'right' },
  colLiquido: { width: '13%', textAlign: 'right' },
});

function FaixaGradiente() {
  return (
    <Svg style={styles.faixaSvg} width={LARGURA_PAGINA} height={ALTURA_FAIXA}>
      <Defs>
        <LinearGradient id="gradienteMarca" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFA60C" />
          <Stop offset="0.97" stopColor="#F50234" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={LARGURA_PAGINA} height={ALTURA_FAIXA} fill="url(#gradienteMarca)" />
    </Svg>
  );
}

function CampoInfo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={styles.campoInfo}>
      <Text style={styles.rotuloInfo}>{rotulo}</Text>
      <Text style={styles.valorInfo}>{valor}</Text>
    </View>
  );
}

function PaginaDaProposta({ pagina, dataGeracao }: { pagina: PaginaProposta; dataGeracao: string }) {
  return (
    <Page size="A4" orientation="landscape" style={styles.pagina}>
      <View style={styles.faixaCabecalho}>
        <FaixaGradiente />
        <Text style={styles.tituloFaixa}>Proposta · Comercial Amplificado</Text>
        <Text style={styles.subtituloFaixa}>Hub Amplificado</Text>
      </View>

      <View style={styles.corpo}>
        <View style={styles.linhaCabecalhoInfo}>
          <CampoInfo rotulo="Data" valor={dataGeracao} />
          <CampoInfo rotulo="Cliente" valor={pagina.cliente} />
          {pagina.agencia && <CampoInfo rotulo="Agência" valor={pagina.agencia} />}
          <CampoInfo rotulo="RP" valor={pagina.rp} />
          <CampoInfo rotulo="Executivo" valor={pagina.executivo} />
          <CampoInfo rotulo="Mês/Ano" valor={pagina.mesAno} />
        </View>

        <View style={styles.tabela}>
          <View style={[styles.linhaTabela, styles.linhaCabecalhoTabela]}>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colSigla]}>Sigla</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colPrograma]}>Programa</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colSecundagem]}>Secundagem</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colLocal]}>Local</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colPreco]}>Preço Inserção</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colInsercoes]}>Total Inserções</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colImpressoes]}>Total Impressões</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colTabela]}>Valor Tabela</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colDesconto]}>% Desconto</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colBruto]}>Valor Bruto Negociado</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colLiquido]}>Valor Líquido</Text>
          </View>

          {pagina.linhas.map((linha, indice) => (
            <View key={indice} style={styles.linhaTabela}>
              <Text style={[styles.celula, styles.colSigla]}>{linha.sigla}</Text>
              <Text style={[styles.celula, styles.colPrograma]}>{linha.programa}</Text>
              <Text style={[styles.celula, styles.colSecundagem]}>{linha.secundagem}</Text>
              <Text style={[styles.celula, styles.colLocal]}>{linha.local}</Text>
              <Text style={[styles.celula, styles.colPreco]}>{formatarMoeda(linha.precoInsercao)}</Text>
              <Text style={[styles.celula, styles.colInsercoes]}>{linha.totalInsercoes}</Text>
              <Text style={[styles.celula, styles.colImpressoes]}>
                {linha.totalImpressoes.toLocaleString('pt-BR')}
              </Text>
              <Text style={[styles.celula, styles.colTabela]}>{formatarMoeda(linha.valorTabela)}</Text>
              <Text style={[styles.celula, styles.colDesconto]}>{linha.percentualDesconto}%</Text>
              <Text style={[styles.celula, styles.colBruto]}>{formatarMoeda(linha.valorBrutoNegociado)}</Text>
              <Text style={[styles.celula, styles.colLiquido]}>{formatarMoeda(linha.valorLiquido)}</Text>
            </View>
          ))}

          <View style={[styles.linhaTabela, styles.linhaTotal]}>
            <Text style={[styles.celula, styles.textoTotal, styles.colSigla]}>Total</Text>
            <Text style={[styles.celula, styles.colPrograma]} />
            <Text style={[styles.celula, styles.colSecundagem]} />
            <Text style={[styles.celula, styles.colLocal]} />
            <Text style={[styles.celula, styles.colPreco]} />
            <Text style={[styles.celula, styles.textoTotal, styles.colInsercoes]}>{pagina.total.totalInsercoes}</Text>
            <Text style={[styles.celula, styles.textoTotal, styles.colImpressoes]}>
              {pagina.total.totalImpressoes.toLocaleString('pt-BR')}
            </Text>
            <Text style={[styles.celula, styles.textoTotal, styles.colTabela]}>
              {formatarMoeda(pagina.total.valorTabela)}
            </Text>
            <Text style={[styles.celula, styles.textoTotal, styles.colDesconto]}>{pagina.total.percentualDesconto}%</Text>
            <Text style={[styles.celula, styles.textoTotal, styles.colBruto]}>
              {formatarMoeda(pagina.total.valorBrutoNegociado)}
            </Text>
            <Text style={[styles.celula, styles.textoTotal, styles.colLiquido]}>
              {formatarMoeda(pagina.total.valorLiquido)}
            </Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

export function PropostaDocumento({ paginas, dataGeracao }: PropostaDocumentoProps) {
  return (
    <Document title="Proposta Comercial Amplificado">
      {paginas.map((pagina) => (
        <PaginaDaProposta key={pagina.rp} pagina={pagina} dataGeracao={dataGeracao} />
      ))}
    </Document>
  );
}
```

- [ ] **Step 2: Rodar o typecheck**

Run: `npm run typecheck`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
git add components/pdf/PropostaDocumento.tsx
git commit -m "feat: PDF proposal template with brand gradient header"
```

---

### Task 6: `app/api/proposta/route.ts` — Route Handler

**Files:**
- Create: `app/api/proposta/route.tsx` (extensão `.tsx` porque o arquivo
  usa JSX — `<PropostaDocumento ... />` — ao montar o documento antes de
  chamar `renderToBuffer`)
- Test: `app/api/proposta/route.test.ts`

**Interfaces:**
- Consumes: `lerSessao` (`lib/auth/session.ts`), `criarRepositorioMock`
  (`lib/data/repositorioRps.ts`), `listarRpsComElegibilidade`
  (`lib/regras/motor.ts`), `paraRpComStatus`/`RpComStatus`
  (`lib/rps/rpComStatus.ts`), `minhasRps`/`ehSelecionavel`
  (`lib/rps/regrasLista.ts`), `mesDaRp` (`lib/rps/formato.ts`),
  `obterPropostaCaPorChave` (`lib/data/tabelaPrecos.ts`),
  `obterAgenciaMock` (`lib/data/agenciaMock.ts`), `montarLinhasProposta`
  (`lib/propostas/calculoProposta.ts`), `PropostaDocumento`
  (`components/pdf/PropostaDocumento.tsx`), `renderToBuffer` (
  `@react-pdf/renderer`).
- Produces: `POST /api/proposta` — consumido pela Task 7 (modal faz o
  `fetch`).

**Contrato da API:**

Request `POST /api/proposta`, corpo JSON:
```ts
{
  rpIds: string[];
  percentualDesconto: number;
  agencias: Record<string, { possui: boolean; nome: string }>; // chave = rp.rp
}
```

Respostas de erro (todas `{ erro: string }` em JSON):
- `401` sem sessão.
- `400` `rpIds` vazio.
- `400` `percentualDesconto` fora de `[0, 20]`.
- `400` alguma `rpId` não está entre as RPs selecionáveis do executivo
  (fora da carteira, não elegível, ou status diferente de "Disponível").

Sucesso: `200`, `Content-Type: application/pdf`,
`Content-Disposition: attachment; filename="proposta-<rpIds joined by
"-">.pdf"`, corpo = buffer do PDF.

- [ ] **Step 1: Escrever o teste de integração**

```ts
// app/api/proposta/route.test.ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/session', () => ({
  lerSessao: vi.fn(),
}));

import { lerSessao } from '@/lib/auth/session';
import { POST } from './route';

function requisicao(corpo: unknown): Request {
  return new Request('http://localhost/api/proposta', {
    method: 'POST',
    body: JSON.stringify(corpo),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/proposta', () => {
  it('retorna 401 sem sessão', async () => {
    vi.mocked(lerSessao).mockResolvedValue(null);

    const resposta = await POST(requisicao({ rpIds: ['1'], percentualDesconto: 0, agencias: {} }));

    expect(resposta.status).toBe(401);
  });

  it('retorna 400 quando percentualDesconto excede a alçada de 20%', async () => {
    vi.mocked(lerSessao).mockResolvedValue({
      nome: 'Karina Martinelli',
      email: 'karina@teste.com',
      papel: 'executivo',
      executivoRaw: 'Karina Martinelli',
    });

    const resposta = await POST(requisicao({ rpIds: ['1'], percentualDesconto: 25, agencias: {} }));

    expect(resposta.status).toBe(400);
  });

  it('retorna 400 quando rpIds está vazio', async () => {
    vi.mocked(lerSessao).mockResolvedValue({
      nome: 'Karina Martinelli',
      email: 'karina@teste.com',
      papel: 'executivo',
      executivoRaw: 'Karina Martinelli',
    });

    const resposta = await POST(requisicao({ rpIds: [], percentualDesconto: 10, agencias: {} }));

    expect(resposta.status).toBe(400);
  });

  it('retorna 400 quando uma rpId não pertence à carteira do executivo', async () => {
    vi.mocked(lerSessao).mockResolvedValue({
      nome: 'Karina Martinelli',
      email: 'karina@teste.com',
      papel: 'executivo',
      executivoRaw: 'Karina Martinelli',
    });

    const resposta = await POST(requisicao({ rpIds: ['rp-inexistente-999'], percentualDesconto: 10, agencias: {} }));

    expect(resposta.status).toBe(400);
  });

  it('gera um PDF válido para uma RP elegível da carteira do executivo (gerente vê todas)', async () => {
    vi.mocked(lerSessao).mockResolvedValue({
      nome: 'Gerência',
      email: 'gerencia@teste.com',
      papel: 'gerente',
      executivoRaw: null,
    });

    // Descobre uma RP elegível/Disponível real repetindo a mesma consulta do handler.
    const { criarRepositorioMock } = await import('@/lib/data/repositorioRps');
    const { listarRpsComElegibilidade } = await import('@/lib/regras/motor');
    const { paraRpComStatus } = await import('@/lib/rps/rpComStatus');
    const { ehSelecionavel } = await import('@/lib/rps/regrasLista');

    const rps = listarRpsComElegibilidade(criarRepositorioMock(), new Date(), 2).map(paraRpComStatus);
    const rpSelecionavel = rps.find(ehSelecionavel);
    expect(rpSelecionavel).toBeDefined();

    const resposta = await POST(
      requisicao({ rpIds: [rpSelecionavel!.rp], percentualDesconto: 10, agencias: {} })
    );

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('content-type')).toBe('application/pdf');
    const buffer = Buffer.from(await resposta.arrayBuffer());
    expect(buffer.subarray(0, 4).toString('utf-8')).toBe('%PDF');
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run app/api/proposta/route.test.ts`
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: Implementar**

```ts
// app/api/proposta/route.ts
import { lerSessao } from '@/lib/auth/session';
import { criarRepositorioMock } from '@/lib/data/repositorioRps';
import { listarRpsComElegibilidade } from '@/lib/regras/motor';
import { paraRpComStatus } from '@/lib/rps/rpComStatus';
import { ehSelecionavel, minhasRps } from '@/lib/rps/regrasLista';
import { mesDaRp } from '@/lib/rps/formato';
import { obterPropostaCaPorChave } from '@/lib/data/tabelaPrecos';
import { obterAgenciaMock } from '@/lib/data/agenciaMock';
import { montarLinhasProposta } from '@/lib/propostas/calculoProposta';
import { PropostaDocumento, type PaginaProposta } from '@/components/pdf/PropostaDocumento';
import { renderToBuffer } from '@react-pdf/renderer';

const MARGEM_DIAS_UTEIS = 2;
const ALCADA_MAXIMA = 20;

interface CorpoRequisicao {
  rpIds: string[];
  percentualDesconto: number;
  agencias: Record<string, { possui: boolean; nome: string }>;
}

function erro(mensagem: string, status: number): Response {
  return Response.json({ erro: mensagem }, { status });
}

export async function POST(request: Request): Promise<Response> {
  const sessao = await lerSessao();
  if (!sessao) {
    return erro('Sessão não encontrada.', 401);
  }

  const corpo = (await request.json()) as CorpoRequisicao;

  if (!Array.isArray(corpo.rpIds) || corpo.rpIds.length === 0) {
    return erro('Selecione ao menos uma RP.', 400);
  }
  if (
    typeof corpo.percentualDesconto !== 'number' ||
    corpo.percentualDesconto < 0 ||
    corpo.percentualDesconto > ALCADA_MAXIMA
  ) {
    return erro(`Desconto deve estar entre 0% e ${ALCADA_MAXIMA}% (alçada do executivo).`, 400);
  }

  const repositorio = criarRepositorioMock();
  const rpsComElegibilidade = listarRpsComElegibilidade(repositorio, new Date(), MARGEM_DIAS_UTEIS);
  const rpsComStatus = rpsComElegibilidade.map(paraRpComStatus);
  const rpsDaCarteira = minhasRps(rpsComStatus, sessao.papel, sessao.executivoRaw);
  const rpsSelecionaveis = rpsDaCarteira.filter(ehSelecionavel);

  const rpsEscolhidas = corpo.rpIds.map((id) => rpsSelecionaveis.find((rp) => rp.rp === id));
  if (rpsEscolhidas.some((rp) => rp === undefined)) {
    return erro('Uma ou mais RPs selecionadas não estão disponíveis para você.', 400);
  }

  const propostaCaPorChave = obterPropostaCaPorChave();
  const dataGeracao = new Intl.DateTimeFormat('pt-BR').format(new Date());

  const paginas: PaginaProposta[] = rpsEscolhidas.map((rp) => {
    const configuracaoAgencia = corpo.agencias?.[rp!.rp];
    const possuiAgencia = configuracaoAgencia?.possui ?? Boolean(obterAgenciaMock(rp!.rp));
    const nomeAgencia = possuiAgencia ? (configuracaoAgencia?.nome || obterAgenciaMock(rp!.rp)) : null;

    const { linhas, total } = montarLinhasProposta(rp!, corpo.percentualDesconto, possuiAgencia, propostaCaPorChave);

    return {
      rp: rp!.rp,
      cliente: rp!.anunciante,
      executivo: rp!.executivo,
      agencia: nomeAgencia,
      mesAno: mesDaRp(rp!),
      linhas,
      total,
    };
  });

  const buffer = await renderToBuffer(<PropostaDocumento paginas={paginas} dataGeracao={dataGeracao} />);

  return new Response(buffer, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="proposta-${corpo.rpIds.join('-')}.pdf"`,
    },
  });
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run app/api/proposta/route.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Rodar a suíte inteira e o typecheck**

Run: `npm test && npm run typecheck`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add app/api/proposta/route.tsx app/api/proposta/route.test.ts
git commit -m "feat: PDF proposal generation route handler"
```

---

### Task 7: `ModalGerarProposta` — UI e integração em `ListaRps`

**Files:**
- Create: `components/rps/ModalGerarProposta.tsx`
- Modify: `components/rps/ListaRps.tsx`

**Interfaces:**
- Consumes: `RpComStatus[]` (RPs selecionadas, já disponíveis em
  `ListaRps`), `obterAgenciaMock` (`lib/data/agenciaMock.ts`, chamável
  de um client component pois é síncrono e não usa `fs`),
  `formatarMoeda` (`lib/rps/formato.ts`).
- Produces: componente `ModalGerarProposta`, montado condicionalmente em
  `ListaRps` quando o modal está aberto.

- [ ] **Step 1: Implementar o modal**

```tsx
// components/rps/ModalGerarProposta.tsx
'use client';

import { useMemo, useState } from 'react';
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import { formatarMoeda } from '@/lib/rps/formato';
import { obterAgenciaMock } from '@/lib/data/agenciaMock';

interface ModalGerarPropostaProps {
  rpsSelecionadas: RpComStatus[];
  aoFechar: () => void;
}

interface EstadoAgencia {
  possui: boolean;
  nome: string;
}

const ALCADA_MAXIMA = 20;

export function ModalGerarProposta({ rpsSelecionadas, aoFechar }: ModalGerarPropostaProps) {
  const [percentualDesconto, setPercentualDesconto] = useState(0);
  const [agencias, setAgencias] = useState<Record<string, EstadoAgencia>>(() => {
    const inicial: Record<string, EstadoAgencia> = {};
    for (const rp of rpsSelecionadas) {
      const nomeMock = obterAgenciaMock(rp.rp);
      inicial[rp.rp] = { possui: nomeMock !== null, nome: nomeMock ?? '' };
    }
    return inicial;
  });
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const descontoInvalido = percentualDesconto < 0 || percentualDesconto > ALCADA_MAXIMA;

  const totalTabela = useMemo(
    () => rpsSelecionadas.reduce((soma, rp) => soma + rp.valorTabela, 0),
    [rpsSelecionadas]
  );

  function atualizarAgencia(rpId: string, campo: keyof EstadoAgencia, valor: string | boolean) {
    setAgencias((atual) => ({ ...atual, [rpId]: { ...atual[rpId], [campo]: valor } }));
  }

  async function gerarProposta() {
    if (descontoInvalido) return;
    setGerando(true);
    setErro(null);

    try {
      const resposta = await fetch('/api/proposta', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          rpIds: rpsSelecionadas.map((rp) => rp.rp),
          percentualDesconto,
          agencias,
        }),
      });

      if (!resposta.ok) {
        const corpo = (await resposta.json().catch(() => null)) as { erro?: string } | null;
        setErro(corpo?.erro ?? 'Não foi possível gerar a proposta.');
        return;
      }

      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proposta-${rpsSelecionadas.map((rp) => rp.rp).join('-')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      aoFechar();
    } finally {
      setGerando(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={aoFechar}
    >
      <div
        onClick={(evento) => evento.stopPropagation()}
        style={{
          background: 'var(--cor-superficie)',
          borderRadius: 'var(--raio-modal)',
          boxShadow: 'var(--sombra-modal)',
          padding: 24,
          width: 520,
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16 }}>Gerar proposta</h2>
        <p style={{ fontSize: 12.5, color: 'var(--cor-tinta-secundaria)', marginTop: 4 }}>
          {rpsSelecionadas.length} RPs · {formatarMoeda(totalTabela)} de tabela
        </p>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600 }} htmlFor="percentual-desconto">
            % de desconto (aplicado a todas as RPs selecionadas)
          </label>
          <input
            id="percentual-desconto"
            type="number"
            min={0}
            max={ALCADA_MAXIMA}
            value={percentualDesconto}
            onChange={(evento) => setPercentualDesconto(Number(evento.target.value))}
            style={{
              display: 'block',
              marginTop: 6,
              padding: '8px 10px',
              border: `1px solid ${descontoInvalido ? 'var(--cor-erro-borda)' : 'var(--cor-borda-input)'}`,
              borderRadius: 'var(--raio-input)',
              fontSize: 13,
              width: 120,
            }}
          />
          {descontoInvalido && (
            <p style={{ fontSize: 11.5, color: 'var(--cor-erro-texto)', marginTop: 4 }}>
              O desconto não pode passar de {ALCADA_MAXIMA}% (alçada do executivo).
            </p>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          {rpsSelecionadas.map((rp) => (
            <div key={rp.rp} style={{ padding: '10px 0', borderTop: '1px solid var(--cor-borda-sutil)' }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, margin: 0 }}>
                RP {rp.rp} · {rp.anunciante}
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={agencias[rp.rp]?.possui ?? false}
                  onChange={(evento) => atualizarAgencia(rp.rp, 'possui', evento.target.checked)}
                />
                Cliente possui agência (desconto adicional de 20%)
              </label>
              {agencias[rp.rp]?.possui && (
                <input
                  value={agencias[rp.rp]?.nome ?? ''}
                  onChange={(evento) => atualizarAgencia(rp.rp, 'nome', evento.target.value)}
                  placeholder="Nome da agência"
                  style={{
                    display: 'block',
                    marginTop: 6,
                    padding: '6px 8px',
                    border: '1px solid var(--cor-borda-input)',
                    borderRadius: 'var(--raio-input)',
                    fontSize: 12.5,
                    width: '100%',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {erro && (
          <p style={{ fontSize: 12, color: 'var(--cor-erro-texto)', marginTop: 12 }}>{erro}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button
            type="button"
            onClick={aoFechar}
            style={{
              border: '1px solid var(--cor-borda-forte)',
              background: 'transparent',
              borderRadius: 'var(--raio-botao)',
              padding: '8px 16px',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={gerarProposta}
            disabled={descontoInvalido || gerando}
            style={{
              border: 'none',
              background: 'var(--gradiente-marca)',
              color: '#ffffff',
              borderRadius: 'var(--raio-botao)',
              padding: '8px 18px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: descontoInvalido || gerando ? 'not-allowed' : 'pointer',
              opacity: descontoInvalido || gerando ? 0.6 : 1,
            }}
          >
            {gerando ? 'Gerando…' : 'Confirmar e baixar'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrar em `ListaRps.tsx`**

Em `components/rps/ListaRps.tsx`:

1. Adicionar o import:

```ts
import { ModalGerarProposta } from './ModalGerarProposta';
```

2. Adicionar estado, logo abaixo de `detalheId`:

```ts
const [modalPropostaAberto, setModalPropostaAberto] = useState(false);
```

3. Substituir o botão "Gerar proposta" (atualmente `disabled`) por uma
   versão habilitada que abre o modal:

```tsx
<button
  type="button"
  onClick={() => setModalPropostaAberto(true)}
  style={{
    border: 'none',
    background: 'var(--cor-superficie)',
    color: 'var(--cor-tinta-principal)',
    borderRadius: 'var(--raio-botao)',
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  }}
>
  Gerar proposta
</button>
```

4. Renderizar o modal ao final do componente (antes do fechamento do
   elemento raiz), condicionado ao estado:

```tsx
{modalPropostaAberto && (
  <ModalGerarProposta
    rpsSelecionadas={rps.filter((rp) => selecionadas.includes(rp.rp))}
    aoFechar={() => setModalPropostaAberto(false)}
  />
)}
```

- [ ] **Step 3: Rodar a suíte completa e o typecheck**

Run: `npm test && npm run typecheck`
Expected: tudo verde, nenhuma regressão.

- [ ] **Step 4: Testar manualmente**

Run: `npm run dev`, acessar `/rps`, selecionar 1-2 RPs elegíveis/
Disponíveis, clicar "Gerar proposta", ajustar desconto e agência,
confirmar, verificar que o PDF baixado abre corretamente e reflete os
valores calculados.

- [ ] **Step 5: Commit**

```bash
git add components/rps/ModalGerarProposta.tsx components/rps/ListaRps.tsx
git commit -m "feat: wire up proposal generation modal in Minhas RPs"
```
