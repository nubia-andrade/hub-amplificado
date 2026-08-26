# Proposta em PDF — Design

## Contexto

O botão "Gerar proposta" já existe (desabilitado) na tela Minhas RPs
(`components/rps/ListaRps.tsx`), habilitado quando o executivo seleciona
1+ RPs elegíveis/Disponíveis. Esta entrega implementa a geração de um
documento de **proposta comercial em PDF**, um por RP selecionada,
combinados num único arquivo. É um documento distinto do Excel
"Autorização de Programação" descrito em
`docs/superpowers/specs/2026-08-25-hub-amplificado-design.md` (esse fica
para avaliação futura) — este PDF é a proposta financeira, com valores,
enviável ao cliente.

Baseado em dois prints de referência fornecidos pela stakeholder: um
mockup inicial de cabeçalho/tabela simples, e um segundo, mais detalhado,
que define o layout final da tabela por linha de programa.

## Fluxo

1. Executivo seleciona 1+ RPs na lista (regra de seleção já existe:
   `ehSelecionavel` em `lib/rps/regrasLista.ts` — só RPs elegíveis com
   status "Disponível").
2. Clica "Gerar proposta" → abre `ModalGerarProposta`:
   - Lista somente-leitura das RPs selecionadas (RP, anunciante, valor de
     tabela).
   - Campo único de **% de desconto do executivo**, aplicado a todas as
     linhas de todas as RPs selecionadas. Validação em tempo real: acima
     de 20% (alçada de `avaliarDesconto` em `lib/regras/desconto.ts`)
     bloqueia o envio com mensagem explicando o limite — não há fluxo de
     aprovação de gerência implementado ainda.
   - Por RP selecionada: toggle "Cliente possui agência" + campo com nome
     da agência, pré-preenchidos a partir de `obterAgenciaMock` (ver
     abaixo), editáveis pelo executivo antes de gerar.
   - Botão "Confirmar e baixar" → POST para o route handler, resposta é
     o PDF, navegador inicia o download.
3. PDF resultante: uma página por RP selecionada, no layout descrito
   abaixo.

## Layout da página (por RP)

**Cabeçalho:**
- Data (data de geração da proposta, não a data da RP)
- Cliente (= `rp.anunciante`)
- Agência (nome, só aparece se a RP tiver agência marcada)
- RP (= `rp.rp`)
- Executivo (= `rp.executivo`)
- Mês/Ano (= `mesDaRp(rp)`, já existe em `lib/rps/formato.ts`)

**Identidade visual**: banda de cabeçalho com o gradiente da marca
(`#FFA60C` → `#F50234`, mesmo ângulo/posições usados no resto do app),
renderizada via `<Svg><Defs><LinearGradient>` do `@react-pdf/renderer`
(que suporta gradientes SVG nativamente, ao contrário de CSS gradients).
Tipografia: reaproveitar as fontes Globotipo já usadas no app (embutir os
arquivos de `assets/fonts/` no PDF via `Font.register`). Fora do
cabeçalho, o documento permanece limpo/formal (fundo branco, texto escuro,
sem gradiente na tabela) — é um documento para envio a cliente.

**Tabela** (uma linha por `LinhaRp` da RP):

| Coluna | Origem |
|---|---|
| Sigla | `linha.sigla` |
| Programa | `linha.programa` |
| Secundagem | `linha.secund` |
| Local | `linha.exib` |
| Preço Inserção | `linha.unit` |
| Total Inserções | `linha.nDatas` |
| Total Impressões | ver "Total Impressões" abaixo |
| Valor Tabela | `linha.total` |
| % Desconto | percentual único digitado no modal |
| Valor Bruto Negociado | `Valor Tabela × (1 − %desconto/100)` |
| Valor Líquido | `Valor Bruto Negociado × (1 − 0.20)` se a RP tiver
  agência marcada, senão igual ao Valor Bruto Negociado |

Linha final `Total`: soma de Total Inserções, Total Impressões, Valor
Tabela, Valor Bruto Negociado e Valor Líquido; % Desconto mostra o mesmo
percentual único usado em todas as linhas.

**Total Impressões**: a planilha `fontes/Tabela de Precos Comercial
Amplificado.xlsx` (aba `Base`) tem uma coluna G "Proposta CA" (ex.:
"182,080" para o programa Altas Horas) que é um valor de audiência/
impressões por inserção, por sigla de programa — **não** é o mesmo valor
usado no motor de valor (que usa a coluna H "Comercial Amplificado", ver
`README.md` seção 4). `Total Impressões = propostaCaPorSigla[linha.sigla]
× linha.nDatas`.

## Infraestrutura nova

- **`lib/data/tabelaPrecos.ts`** (server-only, segue o padrão de
  `lib/data/datasExibicao.ts`): lê `fontes/Tabela de Precos Comercial
  Amplificado.xlsx`, aba `Base`, colunas `PGM` (sigla) e `Proposta CA`;
  parseia o número (remove separador de milhar), expõe
  `obterPropostaCaPorSigla(): Record<string, number>`. Não recalcula
  `precoBase` (já vem pronto em `dados.js`) — expõe só o que falta.

- **`lib/data/agenciaMock.ts`**: como a base ainda não tem uma coluna real
  de agência, expõe `obterAgenciaMock(rpId: string): string | null` — hash
  determinístico simples do id da RP contra uma pequena lista de nomes de
  agência fictícios (≈30% das RPs recebem uma agência, as demais `null`).
  Isolado numa função pura e substituível quando a base real trouxer a
  coluna.

- **`lib/propostas/calculoProposta.ts`**: funções puras e testáveis:
  - `calcularValorBrutoNegociado(valorTabela: number, percentualDesconto: number): number`
  - `calcularValorLiquido(valorBrutoNegociado: number, possuiAgencia: boolean): number` (aplica 20% fixo)
  - `calcularTotalImpressoes(propostaCa: number, nDatas: number): number`
  - `montarLinhasProposta(rp: Rp, percentualDesconto: number, possuiAgencia: boolean, propostaCaPorSigla: Record<string, number>): LinhaProposta[]`
    (uma `LinhaProposta` por `LinhaRp`, com todos os campos calculados
    acima prontos para o template), mais o total agregado.

- **`components/pdf/PropostaDocumento.tsx`**: componente `@react-pdf/renderer`
  (`Document`/`Page`/`View`/`Text`/`Svg`), recebe uma lista de
  `{ rp, linhasProposta, agencia, dataGeracao }` e renderiza uma página
  por item.

- **`components/rps/ModalGerarProposta.tsx`**: client component, estado do
  desconto/agências por RP, validação de alçada, dispara o POST e
  trata o download do blob retornado.

- **`app/api/proposta/route.ts`**: Route Handler POST. Recebe
  `{ rpIds: string[], percentualDesconto: number, agencias: Record<string, { possui: boolean; nome: string }> }`.
  Valida sessão (`lerSessao`), filtra `rpIds` pelo escopo de carteira do
  executivo (reaproveita o mesmo padrão de `carregarMinhasRps`/
  `minhasRps`, para impedir gerar proposta de RP fora da carteira),
  valida alçada (20%) no servidor também (nunca confiar só no cliente),
  monta os dados via `calculoProposta`, renderiza o PDF com
  `renderToBuffer` do `@react-pdf/renderer`, responde com
  `Content-Type: application/pdf` e
  `Content-Disposition: attachment; filename="proposta-<RPs>.pdf"`.

## Dependência nova

`@react-pdf/renderer` — renderização de PDF server-side em React, suporta
SVG/gradientes e fontes customizadas, sem depender de navegador headless.

## Fora de escopo desta entrega

- Cadastro persistente de agência/cliente (`dim_agencia`/`dim_cliente` do
  spec principal) — o campo de agência aqui é só um mock local, sem
  persistência.
- Envio por e-mail (Graph API) — só o download do PDF.
- Campos Título/Filme, Produto, Prazo de Pagamento, Faturar Bruto/Líquido
  — ficam para quando o template Excel "Autorização de Programação" for
  avaliado.
- Fluxo de aprovação de desconto fora da alçada (gerência) — acima de 20%
  simplesmente bloqueia a geração.

## Testes

- `lib/data/tabelaPrecos.ts`: teste unitário lendo o xlsx real, conferindo
  o valor de "Proposta CA" de uma sigla conhecida do print (ex.: BPRA).
- `lib/data/agenciaMock.ts`: teste de determinismo (mesmo `rpId` sempre
  retorna o mesmo resultado).
- `lib/propostas/calculoProposta.ts`: testes unitários de cada função pura
  — inclusive o caso de alçada (>20% não deve nem chegar aqui, mas as
  funções de cálculo em si não validam alçada, isso é responsabilidade do
  modal/route handler) e o caso de RP com/sem agência.
- `app/api/proposta/route.ts`: teste de integração — request válida
  retorna um buffer que começa com `%PDF`; RP fora da carteira do
  executivo retorna erro; desconto acima de 20% retorna erro.
