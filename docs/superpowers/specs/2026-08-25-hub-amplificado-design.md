# Hub Amplificado — Design

## Contexto

Aplicação web interna para executivos comerciais de mídia (TV) do Comercial
Amplificado. O executivo acessa as RPs (Requisições de Pedido) sob sua
responsabilidade, gera a proposta comercial (Excel + e-mail com anexo) e
atualiza o status comercial da RP. Há uma visão de gerência com funil da
equipe e aprovação de descontos fora da alçada.

Não existe codebase de destino — este é um projeto novo. O material de
referência (`README.md`, protótipos `.dc.html`, screenshots, planilhas fonte)
já está versionado neste repositório e documenta as regras de negócio, as
telas e os design tokens em detalhe; este spec não repete esse conteúdo,
apenas registra as decisões de arquitetura e as decisões de produto tomadas
com a stakeholder que não estavam (ou contradiziam o que estava) no README.

## Stack e hospedagem

- **Frontend + backend**: Next.js (App Router) + TypeScript, num único
  projeto. Server Actions/Route Handlers para as escritas.
- **Hospedagem**: em aberto (decisão adiada). O código deve evitar
  acoplamento a uma nuvem específica onde possível (ex: cliente BigQuery e
  cliente Graph API isolados atrás de módulos próprios).
- **Dados de leitura**: BigQuery, view `vw_rps_comercial_amplificado`
  (agregação Sigla/Exib/Secund/Modalidade + join com tabela de preço +
  flags de elegibilidade), conforme "Modelo de dados sugerido" do README.
  No MVP a carga da base comercial no BigQuery é **manual** (reexport do
  Power BI); automação fica para depois da aprovação do MVP.
- **Dados de escrita**: tabelas `fato_status_rp`, `fato_proposta`,
  `fato_aprovacao_desconto`, mais as novas entidades de cadastro (ver
  "Cadastros novos" abaixo).
- **Geração de Excel**: no backend, com `exceljs`.
- **Envio de e-mail com anexo**: Microsoft Graph API (`POST /me/sendMail`
  com `attachments`) — tenant já confirmado como permitido.
- **Autenticação**: **MVP com login simples** (e-mail/senha, como no
  protótipo), para não bloquear o desenvolvimento das telas enquanto o
  tenant/SSO é configurado. Troca para SSO Microsoft (Entra ID) é um
  item pós-MVP.

## Decisões de produto (resolvidas com a stakeholder)

1. **Contatos, agência e cliente**: cadastro novo e persistente de
   contato por anunciante, mais dados cadastrais de **agência**
   (Agência, Endereço, Cidade, CGC/MF, CEP, Estado, Insc. nº) e de
   **cliente** (Cliente, Endereço, Cidade, CNPJ, CEP, Estado, Insc. nº),
   usados no cabeçalho da proposta.
2. **Anexo automático de e-mail**: confirmado — usar Microsoft Graph API.
3. **Mapeamento `Executivo` → identidade de login**: vem de uma
   **carteira** (Executivo ↔ conjunto de RPs). No MVP, a carteira é
   carregada via input de planilha Excel; o login do executivo determina
   qual carteira (conjunto de RPs) ele enxerga.
4. **Vigência da tabela de preço**: o time de Pricing sobe uma tabela de
   preços atualizada quando necessário (fora do app, no MVP). A proposta
   deve congelar o preço praticado no momento da geração (não recalcular
   depois) — implica guardar o preço usado em `fato_proposta`, não só
   referenciar a tabela vigente.
5. **RPs não elegíveis por prazo**: sem fluxo de exceção no MVP — saem
   de jogo, como o protótipo já faz.
6. **Ingestão da base comercial**: manual no MVP; automação é item
   pós-MVP, após aprovação do MVP.
7. **Escopo do MVP**: "Minhas RPs" + motor de regras + geração de
   proposta. Fila, Funil e Gerência ficam para depois.
8. **Autenticação do MVP**: login simples primeiro (ver "Stack e
   hospedagem" acima); SSO é pós-MVP.

## Formato da proposta gerada (substitui o README seção 6)

O Excel de saída **não** é a tabela agregada (Programa | Sigla/Exib |
Modalidade | Segundagem | Múltiplo | Preço CA | Unitário | Datas | Valor de
tabela) descrita no README seção 6. O formato real é o modelo
**"Autorização de Programação"**, conforme print de referência fornecido
pela stakeholder:

- Cabeçalho com **dados da agência** e **dados do cliente** (ver cadastros
  acima), mais: Canal, Cidade, RP nº, Título/Filme, Produto, Mês/Ano de
  Veiculação, Prazo de Pagamento, e opção "Faturar pelo valor: Bruto ( ) /
  Líquido ( )".
- **Grade de inserções por dia do mês**: uma linha por Programa (com
  segundagem), uma coluna por dia do mês (com dia da semana abaixo do
  número), célula com a contagem de inserções naquele dia, coluna final
  "TT ins." com o total de inserções da linha.
- Blocos de programas agrupados (ex.: por horário/bloco), com subtotal por
  bloco e uma linha `TOTAL` final somando inserções por dia e no geral.
- **Não exibe valores monetários** — é um documento operacional de
  autorização de veiculação, não a proposta financeira.

Implicação técnica: a geração do Excel precisa das **datas individuais de
exibição por programa** (nível de linha "por data"), não só do agregado por
(Sigla, Exib, Secund, Modalidade) usado nas telas. O pipeline de dados
mantém os dois níveis: agregado (para as telas e o cálculo de valor) e
por-data (para a grade da Autorização de Programação).

**Assunção**: o corpo do e-mail continua trazendo o resumo financeiro
(Tabela / Desconto / Líquido), como descrito no README seção 6 — só o
anexo Excel mudou de formato. A ser confirmado durante a Fase 4.

Campos capturados no momento da geração da proposta, sem cadastro
persistente (variam por proposta): Título/Filme, Produto, Mês/Ano de
veiculação, Prazo de pagamento, Faturar Bruto/Líquido, desconto, validade,
destinatário.

## Cadastros novos

- `dim_agencia`: nome, endereço, cidade, CGC/MF, CEP, estado, inscrição.
- `dim_cliente` (estende o anunciante): nome, endereço, cidade, CNPJ, CEP,
  estado, inscrição.
- `dim_contato_anunciante`: contato (nome/e-mail) por anunciante, para
  preencher o destinatário da proposta sem digitação manual.
- `dim_carteira`: mapeamento executivo (login) → conjunto de RPs
  visíveis, carregado via input de planilha no MVP.

## Fases

1. **Fundação** — Next.js/TS, tema/tokens do README, login simples com
   carteira, camada de acesso a dados com fonte mock local (espelhando
   `dados.js`) atrás de uma interface substituível pelo client BigQuery.
2. **Motor de regras de negócio** — cálculo de valor, elegibilidade,
   desconto/alçada, como módulo isolado e testável (casos do README:
   408 RPs, 349 elegíveis, 59 não elegíveis).
3. **Minhas RPs + Detalhe** — listagem, filtros, seleção múltipla,
   painel de detalhe; cadastros de agência/cliente/contato.
4. **Geração de proposta** — modal com os campos novos, Excel real no
   layout Autorização de Programação, e-mail via Graph com anexo,
   atualização de status + histórico.

Pós-MVP (fora de escopo deste spec): Fila, Funil (kanban + acessibilidade
por teclado), Gerência, automação da ingestão no BigQuery, SSO Entra ID.

## Testes

- Motor de regras: testes unitários cobrindo cada regra de elegibilidade
  isoladamente e em combinação, cálculo de valor (múltiplos de segundagem,
  agregação por datas distintas), limite de alçada.
- Geração de Excel: teste de snapshot/estrutura da grade (linhas, colunas
  por dia, totais) contra um caso de RP conhecido.
- Fluxo de proposta: teste de integração cobrindo seleção múltipla →
  geração → congelamento do preço em `fato_proposta`.

## Riscos / pontos em aberto

- Formato exato da grade "Autorização de Programação" para RPs com muitos
  programas ou meses que cruzam (ex. RP com datas em dois meses) — o print
  de referência mostra um único mês; confirmar tratamento multi-mês durante
  a Fase 4.
- Hospedagem ainda não decidida — pode afetar como os clientes de BigQuery
  e Graph API são autenticados em produção.
