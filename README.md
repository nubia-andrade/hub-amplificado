# Handoff: App de Propostas — Comercial Amplificado

## Visão geral

Aplicação web interna para executivos comerciais de mídia (TV). O executivo acessa as **RPs (Requisições de Pedido)** que estão sob sua responsabilidade, gera a **proposta comercial** (Excel + e-mail no Outlook) e atualiza o **status comercial** da RP: `Disponível` → `Em negociação` → `Fechada Ganha` / `Negócio Perdido`. Há uma visão de gerência com funil da equipe e aprovação de descontos fora da alçada.

Hoje a base vem de um export do dashboard de Power BI (`fontes/*.xlsx`). O destino é **BigQuery**: a leitura das RPs deve virar query, e as escritas (status, propostas geradas, aprovações) precisam de tabelas próprias — ver "Modelo de dados sugerido".

## Sobre os arquivos de design

Os arquivos deste pacote são **referências de design feitas em HTML** — protótipos que mostram aparência e comportamento pretendidos, **não código de produção para copiar**. A tarefa é **recriar esses designs no ambiente do codebase de destino** (React/Next, Vue, Django+HTMX, Flask etc.), usando os padrões e bibliotecas já estabelecidos ali. Se ainda não existe codebase, escolha o stack mais adequado e implemente os designs nele.

O protótipo roda 100% no navegador: dados pré-processados num arquivo JS, persistência em `localStorage`, geração de Excel via SheetJS pelo CDN e e-mail via `mailto:`. Nada disso é a arquitetura final — é a demonstração das regras e das telas.

## Fidelidade

- `App Propostas Comercial Amplificado.dc.html` — **alta fidelidade**. Cores, tipografia, espaçamentos, densidade de tabela e interações são a referência final. Recriar fielmente com as bibliotecas do codebase.
- `Propostas Comercial Amplificado - Wireframes.dc.html` — **baixa fidelidade**, histórico das direções exploradas (1a tabela+painel, 1b kanban, 1c fila, 1d por anunciante, 1e modal de geração, 1f gerência). Serve só como contexto de decisão; o app final combina 1a + 1c + 1b + 1e + 1f.

---

## Regras de negócio (a parte crítica)

### 1. Cálculo do valor

Fontes: `fontes/Tabela de Precos Comercial Amplificado.xlsx`, abas `Base`, `Regional`, `Exceção Siglas`.

1. **Escolha da aba de preço pela praça** (coluna `Exib` da base comercial):
   - `Exib = NET` → aba **Base** (que tem `programa_tipo = NET`).
   - `Exib = RJ` → aba **Regional**, linhas com `programa_tipo = RJ`.
   - `Exib = SP1` → aba **Regional**, linhas com `programa_tipo = SP` (atenção: a base usa `SP1`, a tabela usa `SP`).
2. **Chave de junção**: `Sigla` (base) + `Exib` (base) ↔ `PGM` (coluna A) + `programa_tipo` (coluna C) da tabela de preço. É a chave `SIGLA__EXIB` usada também na aba de exceções.
3. **Múltiplo da segundagem** (colunas J/L da tabela de preço — `Coeficiente` / `Multiplo`):

   | Segundagem | Múltiplo |
   |---|---|
   | 6″ | 0,40 |
   | 10″ | 0,45 |
   | 15″ | 0,75 |
   | 30″ | 1,00 |
   | 45″ | 1,50 |
   | 60″ | 2,00 |

   (a coluna K `CPM` existe na planilha mas **não** entra neste cálculo)
4. **Valor unitário** = coluna **H** (`Comercial Amplificado`) × múltiplo da segundagem. A coluna G (`Proposta CA`) é apenas exibição na planilha; não usar.
5. **Valor da linha** = valor unitário × **número de datas de exibição distintas** daquele programa dentro da RP. Cada data equivale a 1 inserção.
6. **Valor de tabela da RP** = soma das linhas.
7. **Líquido** = valor de tabela × (1 − desconto%).

Agrupamento das linhas: a base comercial tem uma linha por data de exibição. Agregue por (`Sigla`, `Exib`, `Secund`, `Modalidade`), contando datas distintas — foi o que o protótipo fez (4.339 linhas → 1.955 linhas agregadas em 408 RPs).

### 2. Elegibilidade da RP

A RP é **não elegível como um todo** (não pode gerar proposta, não pode ser selecionada) se **qualquer** uma das condições abaixo ocorrer em **qualquer** linha:

- **Exceção de sigla**: a chave `SIGLA_EXIB` está na aba `Exceção Siglas` com regra "Não se aplica" (26 combinações: `BIGB_RJ`, `BIGF_SP1`, `CMAD_NET`, `SSUP_RJ` etc.).
- **Segundagem fora dos coeficientes**: valores diferentes de 6/10/15/30/45/60 (a base tem 0″, 5″ e 90″).
- **Sem preço** para a combinação Sigla+Exib na aba correspondente.
- **Prazo**: alguma data de exibição da RP é anterior ou igual a **hoje + 2 dias úteis** (margem de segurança; sábado e domingo não contam). Todas as datas precisam ser posteriores ao corte. A margem é parametrizável.

Quando não elegível, o app mostra o badge "Não elegível" e lista os motivos textuais no painel de detalhe. No dataset atual: 408 RPs, 349 elegíveis, 59 não elegíveis (antes da regra de prazo).

### 3. Desconto e alçada

- Campo em % (0–100), com **limite de alçada do executivo = 20%** (parametrizável).
- Acima do limite: a proposta pode ser gerada, mas entra na fila de **aprovação da gerência** (registro com RP, anunciante, executivo, % e líquido; ações Aprovar/Recusar). Aviso visível ao executivo antes de gerar.

### 4. Status comercial

- Valores: `Disponível` (default, vem da base), `Em negociação`, `Fechada Ganha`, `Negócio Perdido`.
- **Gerar proposta NÃO altera o status** — decisão explícita do cliente. A troca é sempre ação manual.
- Ao alterar o status captura-se: status novo, **motivo da perda** (obrigatório quando `Negócio Perdido`; opções: Preço, Verba do cliente, Concorrência, Praça/programa indisponível, Sem resposta, Outro), **valor final negociado**, **previsão de fechamento** (data), **observação** livre.
- Todo evento entra no **histórico** da RP (texto + autor + timestamp), exibido no painel de detalhe em ordem decrescente.

### 5. Proposta com múltiplas RPs

- O executivo pode selecionar **várias RPs numa proposta única**, desde que **todas** estejam com status `Disponível` e sejam elegíveis. Tentar marcar uma RP em outro status é bloqueado com aviso.
- Um único Excel e um único corpo de e-mail consolidam as RPs (blocos por RP + totais gerais).
- O checkbox do cabeçalho da tabela considera apenas as RPs selecionáveis e tem três estados: `☐` nada, `⊟` parcial, `☑` todas.

### 6. Excel e e-mail

**Excel** (uma aba `Proposta`): cabeçalho (executivo, e-mail, emissão, validade); por RP: anunciante, CNPJ, RP, praça, portfólio; tabela de linhas com colunas `Programa | Sigla/Exib | Modalidade | Segundagem | Múltiplo | Preço CA | Unitário | Datas | Valor de tabela`; ao final `Total de tabela`, `Desconto X%` (negativo), `Investimento líquido`; duas linhas de nota explicando o cálculo e a tabela aplicada. Larguras de coluna definidas.

**E-mail**: assunto `Proposta Comercial Amplificado — <Anunciante> — RP <n>` (ou `— N RPs`). Corpo em texto: saudação, frase de abertura, um bloco por RP com as linhas (`programa (SIGLA_EXIB) · seg″ · N inserções · R$ x`), totais, desconto, líquido, validade, menção ao anexo, assinatura com nome e e-mail do executivo.

No protótipo o e-mail abre via `mailto:` (o navegador não anexa arquivo) e o Excel é baixado para anexo manual. **Na implementação real, gere o arquivo no backend e use o Microsoft Graph API** (`POST /me/sendMail` ou criação de rascunho com `attachments`) para já anexar o `.xlsx`, ou entregue um `.eml`/`.msg` com anexo. Essa é a maior diferença entre o protótipo e o produto.

### 7. Autenticação e escopo

- Protótipo: login e-mail + senha, com e-mail derivado do nome do executivo (`nome.sobrenome@empresa.com.br`) e senha livre.
- Produção: **SSO Microsoft (Entra ID)**. O executivo vê apenas RPs onde `Executivo` = ele; o perfil gerente vê todas, com filtro por executivo, e acessa a aba Gerência. Mapear o e-mail do SSO para o valor da coluna `Executivo` (que hoje vem sujo, com sufixos como `(N)`, `(GOV)`, `(FIN)`, `(AL)`) — recomendo uma tabela de mapeamento `executivo_base → user_principal_name`.

---

## Telas

### A. Login
Card centralizado, 400px, `#fff`, borda `#e3e0d9`, radius 12px, padding 32px, sombra `0 1px 3px rgba(0,0,0,.05)`. Kicker "COMERCIAL AMPLIFICADO" (11px, 600, letter-spacing .12em, `#8a867e`, uppercase), título "Propostas" (22px/1.2, 700), subtítulo 13px/1.5 `#6f6c66`. Campos e-mail e senha (padding 10/11px, borda `#d9d5cd`, radius 7px, 13px), botão full-width `#16151a`/branco 600 13px, radius 7px. Erro em 12px `oklch(0.52 0.15 30)`. Rodapé pontilhado com atalhos de demo em mono 11.5px. `Enter` na senha submete.

### B. Minhas RPs (tela principal)
- **Header sticky** (`#fffefb`, borda inferior `#e3e0d9`, padding 11px 22px): título `PROPOSTAS · Comercial Amplificado`, nav de abas (pill ativa `#16151a`/branco, inativa transparente `#6f6c66`, padding 6/12px, radius 6px, 12px), à direita nome + papel + botão Sair.
- **Barra de filtros** (padding 12px 22px, `#fffefb`): busca (250px, placeholder "Buscar RP, anunciante ou CNPJ", filtra RP + anunciante + CNPJ), selects Praça / Status / Elegibilidade, e (só gerente) Executivo. À direita, resumo `N de M RPs · R$ X de tabela · elegíveis só com exibição após DD/MM`.
- **Layout**: grid `minmax(0,1fr) 336px` — lista + painel de detalhe sticky (`top:53px`, altura `calc(100vh - 53px)`, scroll próprio).
- **Tabela**: grid de 6 colunas `28px 72px minmax(110px,1fr) 44px 96px 104px`, gap 8px, padding 11px 16px, borda inferior `#eae7e0`. Cabeçalho sticky em `top:53px`, fundo `#efece6`, 9.5px 600 uppercase letter-spacing .06em `#7c786f`. Colunas: checkbox / RP (mono 12px 600) / Anunciante (12.5px, truncado, com sufixo cinza "· N linhas") / Praça / Valor de tabela (mono, à direita) / Status (badge). Linha aberta tem fundo `oklch(0.97 0.02 250)`, linha marcada `#fbfaf7`; RP não elegível em `#9b968d` com valor `—`. Limite de 120 linhas renderizadas.
- **Badges de status** (10px, radius 20px, padding 3/8px): Disponível `#fff`/borda `#ddd9d1`/`#6f6c66`; Em negociação fundo `oklch(0.97 0.02 250)` borda `oklch(0.85 0.06 250)` texto `oklch(0.42 0.13 250)`; Fechada Ganha idem em hue 150; Negócio Perdido `#f2f0eb`/`#ddd9d1`/`#6f6c66`; Não elegível hue 30.
- **Barra de seleção** (sticky bottom, `#16151a`, texto branco 12.5px): "N RPs Disponíveis · R$ X · proposta única [com N anunciantes]", botões "Alterar status" (outline branco) e "Gerar proposta" (fundo branco, texto escuro).
- **Painel de detalhe**: RP + badge, anunciante, CNPJ mono; 4 cards de metadados (Praça·tabela — mostra `RJ · Regional`; Portfólio; Executivo; Setor); caixa de inelegibilidade (borda `oklch(0.86 0.06 30)`, fundo `oklch(0.97 0.02 30)`) com os motivos; tabela de linhas `PROGRAMA | SEG | DT | TOTAL` com a chave `SIGLA_EXIB` em mono 10px cinza ao lado do nome; total de tabela; linha de info (última proposta ou "N datas · N combinações"); botões "Status" (outline) e "Gerar proposta" (escuro, desabilitado e cinza `#ddd9d1` quando não elegível); histórico.
- Estado vazio do painel: texto 12.5px/1.6 `#8a867e` explicando a seleção.

### C. Fila (modo de produtividade)
Card 680px centralizado. Cabeçalho "RP n de N na fila" + botões ← e "Pular →". Três passos com sublinhado ativo `#16151a`: **1 Revisar linhas** (tabela com checkbox por linha, permite excluir linhas da proposta; total recalcula), **2 Preço e desconto** (desconto %, validade em dias, aviso de alçada, resumo Tabela/Desconto/Líquido), **3 Gerar e enviar** (resumo + botões Excel e Outlook). Botão primário "Continuar →" / "Concluir e ir para a próxima →". A fila contém só RPs elegíveis com status `Disponível`.

### D. Funil (kanban)
Quatro colunas de largura igual, fundos: Disponível `#fffefb`, Em negociação `oklch(0.985 0.012 250)`, Fechada Ganha `oklch(0.985 0.014 150)`, Negócio Perdido `#f7f5f1`; divisórias `#e3e0d9`. Cabeçalho de coluna: título uppercase 10px + total compacto em mono. Cartão (`#fff`, borda `#e6e3dc`, radius 8px, padding 10px, `cursor:grab`): RP em mono 11.5px 600, praça, anunciante truncado, valor 11.5px 600 mono, nota opcional (motivo da perda / previsão / "proposta X%"). **Drag & drop** entre colunas altera o status; soltar em "Negócio Perdido" abre o modal pedindo o motivo. Clique no cartão volta para a aba RPs com aquela RP aberta. Máx. 40 cartões por coluna + "+N RPs". Precisa de alternativa acessível por teclado/menu na implementação.

### E. Gerência
4 KPIs (Disponível / Em negociação / Fechada ganha / Negócio perdido) em cards `#fffefb` borda `#e3e0d9` radius 10px padding 15px: label 10px uppercase, valor 21px 700 mono compactado (`R$ 1,2 MM`, `R$ 980k`), sub "N RPs". Abaixo, grid `1.35fr 1fr`: tabela **Desempenho por executivo** (`EXECUTIVO | RPs | EM NEGOC. | GANHO | CONV.`, ordenada por pipeline, top 25; conversão = ganhas / (ganhas + perdidas)) e painel **Aprovações de desconto acima de 20%** (RP, %, anunciante, executivo, líquido, botões Aprovar/Recusar; vazio = "Nada pendente.").

### F. Modais
- **Gerar proposta** (520px, radius 12px, sombra `0 18px 50px rgba(0,0,0,.22)`, overlay `rgba(20,19,24,.42)`): desconto (com "máx. 20") e validade em dias; **destinatário do e-mail digitado na hora** (não existe na base — na produção, considerar um cadastro de contatos por anunciante); aviso de alçada; resumo Tabela/Desconto/Líquido; botões "Baixar" Excel (mostra o nome do arquivo `Proposta_<rp>_<Anunciante>.xlsx` / `Proposta_NRPs.xlsx`), "Abrir Outlook com o template", link "Copiar corpo do e-mail" (vira "copiado ✓"); nota final explicando o anexo manual e que o status não muda.
- **Atualizar status** (470px): três botões de escolha (ativo = fundo `#16151a`), select de motivo só quando `Negócio Perdido`, valor final, previsão (date), observação (textarea 3 linhas), validação de motivo obrigatório, Cancelar/Salvar.
- **Toast**: fixo embaixo ao centro, `#16151a`, radius 8px, 12.5px, 2,6s.

---

## Estado e persistência

Protótipo (React class + `localStorage`):

- `sessao` → `ca_prop_sessao`: `{nome, email, gerente, executivo, papel}`
- `store` → `ca_prop_store`: por RP `{status, motivo, valorFinal, dataPrev, obs, hist[], ultimaProposta:{desc, validade, liquido, quando}}`
- `aprov` → `ca_prop_aprov`: `[{id, rp, anunciante, executivo, desconto, liquido, status: pendente|aprovado|recusado}]`
- UI: `aba`, `busca`, `fPraca`, `fStatus`, `fEleg`, `fExec`, `selecionadas[]`, `detalhe`, `mg` (modal gerar), `ms` (modal status), `filaIdx`, `filaPasso`, `filaExcl`, `filaDesc`, `filaVal`, `toast`.

Parâmetros expostos como props ajustáveis: `limiteDesconto` (20%), `validadeDias` (7), `margemDiasUteis` (2).

## Modelo de dados sugerido (BigQuery + app)

- `vw_rps_comercial_amplificado` (view): base comercial agregada por RP e por (Sigla, Exib, Secund, Modalidade) já com join na tabela de preço, múltiplo, unitário, nº de datas, valor, flags de elegibilidade e motivos. Materializar o preço como tabela versionada (`dim_preco_ca` com `vigencia_inicio/fim`) — a proposta precisa guardar o preço usado, não recalcular depois.
- `fato_status_rp`: `rp, status, motivo, valor_final, data_prevista, observacao, usuario, criado_em` (append-only; status atual = último registro).
- `fato_proposta`: `id, rps[], executivo, desconto, validade_dias, total_tabela, liquido, destinatario, arquivo, criado_em`.
- `fato_aprovacao_desconto`: `id, proposta_id, rp, desconto, status, aprovador, decidido_em`.

## Design tokens

**Cores**
| Uso | Valor |
|---|---|
| Fundo da app | `#f4f3ef` |
| Superfície / header | `#fffefb` |
| Superfície alternativa | `#fff` |
| Cabeçalho de tabela | `#efece6` / `#f4f2ed` |
| Linha marcada | `#fbfaf7` |
| Tinta principal | `#16151a` |
| Tinta secundária | `#6f6c66` |
| Tinta terciária | `#8a867e` |
| Tinta fraca / placeholder | `#a09b92` |
| Borda | `#e3e0d9` · sutil `#eae7e0` / `#f0ede7` · input `#d9d5cd` |
| Desabilitado | `#ddd9d1` (fundo) / `#918c83` (texto) |
| Acento (links, foco, seleção) | `oklch(0.52 0.13 250)` · hover `oklch(0.42 0.13 250)` |
| Sucesso / ganho | `oklch(0.42 0.12 150)` + fundo `oklch(0.97 0.03 150)` + borda `oklch(0.85 0.07 150)` |
| Alerta / alçada | `oklch(0.45 0.1 60)` + fundo `oklch(0.97 0.03 85)` + borda `oklch(0.86 0.07 75)` |
| Erro / não elegível | `oklch(0.45 0.14 30)` + fundo `oklch(0.97 0.02 30)` + borda `oklch(0.86 0.06 30)` |
| Overlay de modal | `rgba(20,19,24,.42)` |

**Tipografia** — Archivo (400/500/600/700) para UI; IBM Plex Mono (400/500) para números, RP e siglas. Escala: 21px/700 KPI · 22px/700 título de login · 16px/600 nome do cliente na fila · 15px/600 RP no detalhe · 13px/600 títulos de seção · 12,5px corpo · 12px dados de tabela · 11,5px secundário · 11px meta · 10px badge · 9–9,5px/600 cabeçalho de tabela (uppercase, letter-spacing .04–.06em).

**Espaçamento** 2/3/6/8/10/12/14/16/18/22/26px · **Radius** 5 (chip) / 6 (input, botão pequeno) / 7 (botão) / 8 (cartão, caixa) / 10–12 (card, modal) / 20 (badge pill) · **Sombras** `0 1px 3px rgba(0,0,0,.05)` card, `0 8px 26px rgba(0,0,0,.25)` toast, `0 18px 50px rgba(0,0,0,.22)` modal · **Foco** `outline: 2px solid oklch(0.52 0.13 250); outline-offset:-1px`.

## Screenshots

Capturas do protótipo em `screenshots/` (viewport ~910px de largura; o layout foi desenhado para telas maiores, onde a tabela e o painel de detalhe ficam mais folgados):

| Arquivo | Tela |
|---|---|
| `01-login.png` | Login com atalhos de demonstração |
| `02-minhas-rps.png` | Lista de RPs com filtros e painel de detalhe vazio |
| `03-detalhe-rp.png` | RP aberta: metadados, linhas com unitário × datas, total |
| `04-modal-gerar-proposta.png` | Modal de geração: desconto, validade, destinatário, Excel e Outlook |
| `05-fila-passo1.png` | Fila — passo 1, revisão das linhas |
| `06-fila-passo2.png` | Fila — passo 2, preço e desconto |
| `07-funil-kanban.png` | Funil com as quatro colunas de status |
| `08-gerencia.png` | Gerência: KPIs, ranking por executivo, aprovações |

## Assets

Nenhuma imagem na UI. Ícones são glifos de texto (`☐ ☑ ⊟ ✉ × ← →`) e o rótulo "XLS" — trocar por ícones da biblioteca do codebase. Fontes via Google Fonts. SheetJS (`xlsx 0.20.3`) por CDN só no protótipo — no produto, gerar o Excel no backend (openpyxl, ExcelJS etc.).

## Arquivos deste pacote

| Arquivo | O que é |
|---|---|
| `App Propostas Comercial Amplificado.dc.html` | Protótipo hi-fi completo (template + lógica no mesmo arquivo) |
| `Propostas Comercial Amplificado - Wireframes.dc.html` | Wireframes lo-fi das direções exploradas |
| `dados.js` | 408 RPs já agregadas e precificadas (`window.CA_DATA`), gerado a partir dos xlsx |
| `support.js` | Runtime do protótipo — descartável, não é parte do design |
| `fontes/Base Comercial Amplificado.xlsx` | Export do Power BI: 4.339 linhas, colunas Data Exib, Programa, Sigla, RP, Anunciante, CNPJ, CM, Título, Secund., Prod. Portfolio, Modalidade, Executivo, Data compra, Linha, Setor, Exib, Status |
| `fontes/Tabela de Precos Comercial Amplificado.xlsx` | Abas Base (76 programas), Regional (148, praças SP e RJ) e Exceção Siglas (26 combinações) |

Para abrir os protótipos: sirva a pasta por HTTP (`python3 -m http.server`) e abra o `.dc.html` — os arquivos `.js` são carregados como irmãos.

## Pendências para decidir com o time

1. Contato do cliente não existe na base — cadastro de contatos por anunciante ou digitação a cada proposta?
2. Anexo automático no e-mail exige Microsoft Graph (ou geração de `.msg`/`.eml`) — confirmar permissão no tenant.
3. Mapeamento do nome sujo da coluna `Executivo` para a identidade do SSO.
4. Vigência da tabela de preço e como a proposta congela o preço praticado.
5. RPs não elegíveis por prazo hoje simplesmente saem de jogo — vale um fluxo de exceção com aprovação?
