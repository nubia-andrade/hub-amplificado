# Cadastro de Agência/Cliente no Nhost — Design

## Contexto

O app hoje não tem nenhum banco de dados real — todas as leituras vêm de
`dados.js`/planilhas locais (`fontes/*.xlsx`), e o campo "agência" usado
na geração de proposta (`docs/superpowers/specs/2026-08-26-proposta-pdf-design.md`)
é um mock determinístico (`lib/data/agenciaMock.ts`), assumido como
temporário até existir uma coluna real. A stakeholder criou um projeto no
[Nhost](https://nhost.io) (Postgres + Hasura GraphQL gerenciados) para
começar a persistir dados reais.

Esta entrega cobre o primeiro pedaço dos "Cadastros novos" já previstos no
spec principal (`docs/superpowers/specs/2026-08-25-hub-amplificado-design.md`,
seção "Cadastros novos"): `agencias`, `clientes` (que estende o anunciante)
e `contatos_anunciante`. RPs, carteira e autenticação **continuam** vindo
das fontes mock atuais — não fazem parte desta entrega.

## Decisões de escopo (resolvidas com a stakeholder)

1. **Escopo dos dados**: só os cadastros novos (agência/cliente/contato).
   RPs, carteira e login seguem mock.
2. **Modo de acesso**: só pelo servidor, usando o Admin Secret do Nhost
   (nunca exposto ao navegador). Sem trocar o login mock por Nhost Auth
   nesta entrega — mantém o padrão já existente no app de toda regra de
   negócio e acesso a dados rodar server-side.
3. **CLI do Nhost**: não usada — o CLI não tem binário nativo para
   Windows (só macOS/Linux; Windows exige WSL2). O schema é criado
   manualmente pelo SQL Editor do dashboard web do Nhost.
4. **UI de cadastro**: fora de escopo agora. Os primeiros registros de
   agência/cliente/contato são inseridos manualmente pelo console do
   Hasura no dashboard do Nhost. Uma tela de cadastro no Hub Amplificado
   fica para uma entrega futura.

## Projeto Nhost

- Subdomain: `tkbbemlinptetnikkdeh`
- Region: `sa-east-1`
- Endpoint GraphQL: `https://tkbbemlinptetnikkdeh.hasura.sa-east-1.nhost.run/v1/graphql`
- Autenticação das requisições: header `x-hasura-admin-secret`.

## Schema (Postgres, criado manualmente via SQL Editor do dashboard)

```sql
create table public.agencias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text,
  cidade text,
  cgc_mf text,
  cep text,
  estado text,
  inscricao text,
  created_at timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  anunciante text not null unique,
  agencia_id uuid references public.agencias(id),
  endereco text,
  cidade text,
  cnpj text,
  cep text,
  estado text,
  inscricao text,
  created_at timestamptz not null default now()
);

create table public.contatos_anunciante (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  nome text not null,
  email text not null,
  created_at timestamptz not null default now()
);
```

`clientes.anunciante` é a chave de junção com o texto livre usado hoje em
`Rp.anunciante` (não há FK — RPs não estão no Postgres). `clientes.agencia_id`
nulo significa "cliente sem agência". Depois de criar, as 3 tabelas
precisam ser marcadas como "Track" no console do Hasura (aba Data) para
ficarem expostas no GraphQL.

Esta entrega **não** inclui migrations versionadas (CLI fora de escopo,
ver decisão 3) — o SQL acima é aplicado uma vez, manualmente, pela
stakeholder.

## Infraestrutura nova no app

- **`lib/data/nhost.ts`** (server-only): wrapper fino de `fetch()` para o
  endpoint GraphQL acima. Sem SDK novo (`@nhost/nhost-js` seria overkill
  para 1-2 queries) — usa `fetch` nativo, lê `NHOST_SUBDOMAIN`,
  `NHOST_REGION`, `NHOST_ADMIN_SECRET` de variáveis de ambiente. Lança
  erro se a resposta do GraphQL contiver `errors`.

- **`lib/data/agenciaCliente.ts`** (server-only): consulta `clientes`
  (com join em `agencias`) pelo texto de `anunciante`. Contrato:
  `obterAgenciaCliente(anunciante: string): Promise<{ possuiAgencia: boolean; nomeAgencia: string | null }>`.
  - Cliente não cadastrado no Nhost, ou erro de rede/config ao consultar:
    cai de volta no mock determinístico já existente
    (`obterAgenciaMock`), preservando o comportamento atual como rede de
    segurança enquanto o cadastro real está incompleto.
  - Cliente cadastrado sem `agencia_id`: `{ possuiAgencia: false, nomeAgencia: null }`.
  - Cliente cadastrado com `agencia_id`: `{ possuiAgencia: true, nomeAgencia: <agencias.nome> }`.

- **`app/api/proposta/route.tsx`**: troca a chamada síncrona
  `obterAgenciaMock(cliente)` por `await obterAgenciaCliente(cliente)`.
  O restante da lógica de validação (desconto de agência sem nome, etc.)
  não muda.

## Variáveis de ambiente

Novo `.env.local` (git-ignorado, já coberto pelo `.gitignore` existente):

```
NHOST_SUBDOMAIN=tkbbemlinptetnikkdeh
NHOST_REGION=sa-east-1
NHOST_ADMIN_SECRET=<a stakeholder preenche localmente, nunca commitado>
```

Um `.env.example` (sem valores reais, versionado) documenta as três
chaves esperadas, para qualquer outra pessoa que clonar o repo saber o
que configurar.

## Fora de escopo desta entrega

- Migrations/CLI versionadas (ver decisão 3).
- Tela de cadastro de agência/cliente/contato no Hub Amplificado (ver
  decisão 4) — inserção é manual via Hasura console por enquanto.
- Mover RPs, carteira ou autenticação para o Nhost.
- Nhost Auth / GraphQL client-side com Row-Level Security.

## Testes

- `lib/data/nhost.ts`: teste unitário mockando `fetch` global —
  confirma que monta a URL/headers corretos e propaga erros do GraphQL
  (`errors` na resposta) como exceção.
- `lib/data/agenciaCliente.ts`: testes unitários mockando o módulo
  `nhost.ts` — cobre os três casos (cliente com agência, cliente sem
  agência, cliente não encontrado/erro → fallback para o mock).
- Sem teste de integração contra o Nhost real (exigiria credenciais em
  CI) — a validação end-to-end é manual, feita pela stakeholder.
