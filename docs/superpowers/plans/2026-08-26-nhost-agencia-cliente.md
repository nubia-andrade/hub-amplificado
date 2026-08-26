# Cadastro de Agência/Cliente no Nhost Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o mock determinístico de agência (`obterAgenciaMock`) usado na geração de proposta por uma consulta real ao Postgres do Nhost (via GraphQL/Hasura), com fallback automático para o mock quando o cliente ainda não estiver cadastrado ou o Nhost estiver indisponível.

**Architecture:** Um wrapper fino de `fetch()` para o endpoint GraphQL do Nhost (`lib/data/nhost.ts`), consumido por um módulo de domínio (`lib/data/agenciaCliente.ts`) que resolve agência por nome de cliente com fallback para o mock existente. `app/api/proposta/route.tsx` troca a chamada síncrona ao mock pela nova função assíncrona.

**Tech Stack:** Next.js 15 Route Handlers, `fetch` nativo (sem SDK novo), GraphQL/Hasura (Nhost), Vitest.

**Spec:** `docs/superpowers/specs/2026-08-26-nhost-agencia-cliente-design.md`

## Global Constraints

- pt-BR em todos os identificadores/textos, com acentuação correta.
- `lib/data/nhost.ts` e `lib/data/agenciaCliente.ts` usam variáveis de
  ambiente sensíveis do servidor (`NHOST_ADMIN_SECRET`) — levam o
  comentário: `// Usa variáveis de ambiente sensíveis do servidor —
  nunca importar este módulo a partir de um componente 'use client'.`
- Nunca lançar o `NHOST_ADMIN_SECRET` em log, mensagem de erro ou
  qualquer texto que possa aparecer no cliente.
- Qualquer falha ao consultar o Nhost (variáveis de ambiente ausentes,
  erro de rede, erro no GraphQL) deve cair de volta no mock existente
  (`obterAgenciaMock`) — nunca deve derrubar a geração da proposta.
- Rodar `npm run typecheck` e `npm test` no fim de cada task.

---

### Task 1: `lib/data/nhost.ts` — cliente GraphQL do Nhost

**Files:**
- Create: `lib/data/nhost.ts`
- Test: `lib/data/nhost.test.ts`

**Interfaces:**
- Consumes: variáveis de ambiente `NHOST_SUBDOMAIN`, `NHOST_REGION`,
  `NHOST_ADMIN_SECRET`.
- Produces: `executarGraphQL<T>(query: string, variables?:
  Record<string, unknown>): Promise<T>`, consumida pela Task 2.

- [ ] **Step 1: Escrever os testes**

```ts
// lib/data/nhost.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { executarGraphQL } from './nhost';

const AMBIENTE_ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...AMBIENTE_ORIGINAL };
  vi.unstubAllGlobals();
});

describe('executarGraphQL', () => {
  it('monta a URL e os headers corretos e retorna os dados da resposta', async () => {
    process.env.NHOST_SUBDOMAIN = 'abc123';
    process.env.NHOST_REGION = 'sa-east-1';
    process.env.NHOST_ADMIN_SECRET = 'segredo-de-teste';

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ data: { ok: true } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await executarGraphQL<{ ok: boolean }>('query { ok }', { x: 1 });

    expect(resultado).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://abc123.hasura.sa-east-1.nhost.run/v1/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'x-hasura-admin-secret': 'segredo-de-teste',
        }),
        body: JSON.stringify({ query: 'query { ok }', variables: { x: 1 } }),
      })
    );
  });

  it('lança erro quando a resposta do GraphQL contém errors', async () => {
    process.env.NHOST_SUBDOMAIN = 'abc123';
    process.env.NHOST_REGION = 'sa-east-1';
    process.env.NHOST_ADMIN_SECRET = 'segredo-de-teste';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ errors: [{ message: 'campo inválido' }] }),
      })
    );

    await expect(executarGraphQL('query { invalido }')).rejects.toThrow('campo inválido');
  });

  it('lança erro quando as variáveis de ambiente do Nhost não estão configuradas', async () => {
    delete process.env.NHOST_SUBDOMAIN;
    delete process.env.NHOST_REGION;
    delete process.env.NHOST_ADMIN_SECRET;

    await expect(executarGraphQL('query { ok }')).rejects.toThrow(/não configuradas/);
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run lib/data/nhost.test.ts`
Expected: FAIL — `Cannot find module './nhost'`.

- [ ] **Step 3: Implementar**

```ts
// lib/data/nhost.ts
// Usa variáveis de ambiente sensíveis do servidor — nunca importar este módulo a partir de um componente 'use client'.

interface RespostaGraphQL<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function executarGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const subdomain = process.env.NHOST_SUBDOMAIN;
  const region = process.env.NHOST_REGION;
  const adminSecret = process.env.NHOST_ADMIN_SECRET;

  if (!subdomain || !region || !adminSecret) {
    throw new Error(
      'Variáveis de ambiente do Nhost não configuradas (NHOST_SUBDOMAIN, NHOST_REGION, NHOST_ADMIN_SECRET).'
    );
  }

  const resposta = await fetch(`https://${subdomain}.hasura.${region}.nhost.run/v1/graphql`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hasura-admin-secret': adminSecret,
    },
    body: JSON.stringify({ query, variables }),
  });

  const corpo = (await resposta.json()) as RespostaGraphQL<T>;

  if (corpo.errors && corpo.errors.length > 0) {
    throw new Error(`Erro no GraphQL do Nhost: ${corpo.errors.map((erro) => erro.message).join('; ')}`);
  }

  if (!corpo.data) {
    throw new Error('Resposta do GraphQL do Nhost sem dados.');
  }

  return corpo.data;
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run lib/data/nhost.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/data/nhost.ts lib/data/nhost.test.ts
git commit -m "feat: add thin GraphQL client for Nhost"
```

---

### Task 2: `lib/data/agenciaCliente.ts` — resolução de agência com fallback

**Files:**
- Create: `lib/data/agenciaCliente.ts`
- Test: `lib/data/agenciaCliente.test.ts`

**Interfaces:**
- Consumes: `executarGraphQL` (Task 1), `obterAgenciaMock`
  (`lib/data/agenciaMock.ts`, já existe).
- Produces: `AgenciaCliente { possuiAgencia: boolean; nomeAgencia:
  string | null }`, `obterAgenciaCliente(anunciante: string):
  Promise<AgenciaCliente>` — consumida pela Task 3.

**Contexto do schema** (já criado manualmente no Nhost pela
stakeholder, ver spec): tabela `clientes` (`anunciante text unique`,
`agencia_id uuid` opcional referenciando `agencias`) e `agencias`
(`nome text`). A relação `agencia_id → agencias.id` é rastreada no
Hasura como o campo de objeto `agencia` dentro de `clientes` na query
GraphQL abaixo.

- [ ] **Step 1: Escrever os testes**

```ts
// lib/data/agenciaCliente.test.ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('./nhost', () => ({
  executarGraphQL: vi.fn(),
}));

import { executarGraphQL } from './nhost';
import { obterAgenciaCliente } from './agenciaCliente';
import { obterAgenciaMock } from './agenciaMock';

describe('obterAgenciaCliente', () => {
  it('retorna a agência quando o cliente está cadastrado e tem agência', async () => {
    vi.mocked(executarGraphQL).mockResolvedValue({
      clientes: [{ agencia: { nome: 'WMcCann' } }],
    });

    expect(await obterAgenciaCliente('SAERJ')).toEqual({ possuiAgencia: true, nomeAgencia: 'WMcCann' });
  });

  it('retorna sem agência quando o cliente está cadastrado mas não tem agência vinculada', async () => {
    vi.mocked(executarGraphQL).mockResolvedValue({
      clientes: [{ agencia: null }],
    });

    expect(await obterAgenciaCliente('SAERJ')).toEqual({ possuiAgencia: false, nomeAgencia: null });
  });

  it('cai no mock determinístico quando o cliente não está cadastrado no Nhost', async () => {
    vi.mocked(executarGraphQL).mockResolvedValue({ clientes: [] });

    const esperado = obterAgenciaMock('ClienteNuncaCadastrado');

    expect(await obterAgenciaCliente('ClienteNuncaCadastrado')).toEqual({
      possuiAgencia: esperado !== null,
      nomeAgencia: esperado,
    });
  });

  it('cai no mock determinístico quando a consulta ao Nhost falha', async () => {
    vi.mocked(executarGraphQL).mockRejectedValue(new Error('falha de rede'));

    const esperado = obterAgenciaMock('SAERJ');

    expect(await obterAgenciaCliente('SAERJ')).toEqual({
      possuiAgencia: esperado !== null,
      nomeAgencia: esperado,
    });
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run lib/data/agenciaCliente.test.ts`
Expected: FAIL — `Cannot find module './agenciaCliente'`.

- [ ] **Step 3: Implementar**

```ts
// lib/data/agenciaCliente.ts
// Usa variáveis de ambiente sensíveis do servidor — nunca importar este módulo a partir de um componente 'use client'.

import { executarGraphQL } from './nhost';
import { obterAgenciaMock } from './agenciaMock';

export interface AgenciaCliente {
  possuiAgencia: boolean;
  nomeAgencia: string | null;
}

interface ClientePorAnuncianteResposta {
  clientes: Array<{
    agencia: { nome: string } | null;
  }>;
}

const QUERY_CLIENTE_POR_ANUNCIANTE = `
  query ClientePorAnunciante($anunciante: String!) {
    clientes(where: { anunciante: { _eq: $anunciante } }, limit: 1) {
      agencia {
        nome
      }
    }
  }
`;

function agenciaMockComo(anunciante: string): AgenciaCliente {
  const nomeMock = obterAgenciaMock(anunciante);
  return { possuiAgencia: nomeMock !== null, nomeAgencia: nomeMock };
}

export async function obterAgenciaCliente(anunciante: string): Promise<AgenciaCliente> {
  try {
    const resultado = await executarGraphQL<ClientePorAnuncianteResposta>(QUERY_CLIENTE_POR_ANUNCIANTE, {
      anunciante,
    });

    const cliente = resultado.clientes[0];
    if (!cliente) {
      return agenciaMockComo(anunciante);
    }

    if (!cliente.agencia) {
      return { possuiAgencia: false, nomeAgencia: null };
    }

    return { possuiAgencia: true, nomeAgencia: cliente.agencia.nome };
  } catch {
    return agenciaMockComo(anunciante);
  }
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run lib/data/agenciaCliente.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/data/agenciaCliente.ts lib/data/agenciaCliente.test.ts
git commit -m "feat: resolve agência real do Nhost com fallback para o mock"
```

---

### Task 3: Conectar `app/api/proposta/route.tsx` + variáveis de ambiente

**Files:**
- Modify: `app/api/proposta/route.tsx`
- Create: `.env.example`

**Interfaces:**
- Consumes: `obterAgenciaCliente` (Task 2).

- [ ] **Step 1: Trocar o import**

Em `app/api/proposta/route.tsx`, troque:

```ts
import { obterAgenciaMock } from '@/lib/data/agenciaMock';
```

por:

```ts
import { obterAgenciaCliente } from '@/lib/data/agenciaCliente';
```

- [ ] **Step 2: Trocar a resolução de agência para assíncrona**

Troque o bloco:

```ts
  const cliente = rpsEscolhidas[0]!.anunciante;
  const agenciaMock = obterAgenciaMock(cliente);
  const possuiAgencia = typeof corpo.possuiAgencia === 'boolean' ? corpo.possuiAgencia : Boolean(agenciaMock);
  const nomeAgencia = possuiAgencia ? corpo.nomeAgencia?.trim() || agenciaMock : null;
```

por:

```ts
  const cliente = rpsEscolhidas[0]!.anunciante;
  const agenciaCadastrada = await obterAgenciaCliente(cliente);
  const possuiAgencia =
    typeof corpo.possuiAgencia === 'boolean' ? corpo.possuiAgencia : agenciaCadastrada.possuiAgencia;
  const nomeAgencia = possuiAgencia ? corpo.nomeAgencia?.trim() || agenciaCadastrada.nomeAgencia : null;
```

- [ ] **Step 3: Criar o `.env.example`**

```
# GraphQL/Postgres do Nhost — ver docs/superpowers/specs/2026-08-26-nhost-agencia-cliente-design.md
NHOST_SUBDOMAIN=
NHOST_REGION=
# Nunca commitar o valor real — só em .env.local (git-ignorado)
NHOST_ADMIN_SECRET=
```

- [ ] **Step 4: Rodar a suíte inteira e o typecheck**

Run: `npm test && npm run typecheck`
Expected: tudo verde, 100+ testes passando, **sem alterar nenhum teste
existente** — `app/api/proposta/route.test.ts` não precisa de nenhuma
mudança: como as variáveis de ambiente `NHOST_*` não estão definidas no
ambiente de teste, `executarGraphQL` sempre lança o erro de configuração
ausente, `obterAgenciaCliente` captura esse erro e cai no mesmo
`obterAgenciaMock` que os testes já usavam antes desta mudança — o
comportamento observado pelos testes existentes não muda.

Se algum teste existente de `route.test.ts` falhar, NÃO ajuste o teste
para "consertar" — pare e reporte: significa que o fallback não está
replicando o comportamento anterior corretamente, o que é a garantia
central desta task.

- [ ] **Step 5: Commit**

```bash
git add app/api/proposta/route.tsx .env.example
git commit -m "feat: use real Nhost agência data in proposal generation"
```
