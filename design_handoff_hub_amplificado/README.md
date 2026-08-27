# Handoff: Hub Amplificado — Tela "Minhas RPs" (redesign)

## Overview
Redesign da tela principal do **Hub Amplificado** (ferramenta comercial de TV): o executivo comercial vê sua carteira de RPs (Requisições de Publicidade), filtra, seleciona as RPs **Disponíveis** e gera uma proposta em PDF. O redesign resolve três problemas do estado atual: dados espremidos, ausência de divisões visuais e falta de apelo/hierarquia.

Mudanças estruturais em relação à tela antiga:
1. Faixa de **4 KPIs** no topo (Carteira, Disponíveis, Tabela disponível, Selecionado).
2. Tabela **agrupada por mês de veiculação**, com cabeçalho de grupo (rótulo, contagem, soma).
3. Linhas de 52px com duas linhas de texto (anunciante + nº de linhas), números tabulares alinhados à direita.
4. **Painel lateral de proposta** (sticky), com total e o detalhamento das linhas de programa das RPs selecionadas.
5. **Barra de ação fixa** no rodapé, repetindo total/contagem e as ações principais.

## About the Design Files
Os arquivos deste pacote são **referências de design feitas em HTML** — protótipos que mostram aparência e comportamento pretendidos, **não código de produção para copiar**. A tarefa é **recriar estes designs no ambiente do codebase alvo** (React, Vue, Blazor, Django templates, etc.) usando os padrões, componentes e bibliotecas já estabelecidos lá. Se ainda não existe ambiente, escolha o framework mais adequado e implemente ali.

O protótipo usa um runtime próprio (`<x-dc>`, `{{ holes }}`, `<sc-for>`) apenas por ser a ferramenta de design; **ignore essa sintaxe** e traduza para o mecanismo de template/loop do seu stack. Todos os estilos estão inline no protótipo por razões da ferramenta — no codebase, use CSS/Tailwind/CSS-modules conforme o padrão local.

## Fidelity
**High-fidelity (hifi).** Cores, tipografia, espaçamentos, raios e estados são finais e devem ser reproduzidos fielmente. Os dados são reais em forma, mas de exemplo — devem vir da API.

---

## Screens / Views

### 1. Minhas RPs (tela única)
**Purpose:** localizar RPs da carteira, entender quais estão elegíveis, selecionar as disponíveis e gerar a proposta.

**Layout (desktop ≥ 1040px):**
- Coluna vertical: `header` (60px, sticky, top 0, z-index 30) → área de conteúdo → barra de ação fixa (bottom 0, z-index 40).
- Área de conteúdo: `display:flex; flex-wrap:wrap; gap:20px; padding:20px 24px 84px; align-items:flex-start`.
  - `main`: `flex:1 1 620px; min-width:0`, coluna com `gap:14px`.
  - `aside`: `flex:0 1 400px; width:400px; position:sticky; top:80px`, coluna com `gap:12px`.
- Abaixo de ~1040px o `aside` desce para baixo do `main` (wrap natural do flex). O padding-bottom de 84px reserva espaço para a barra fixa.

---

#### 1.1 Header
- 60px de altura, `background #101820`, texto `#FFFFFF`, `padding: 0 28px`, `display:flex; align-items:center; gap:28px`.
- **Logo (esquerda):** coluna com `gap:5px` — texto "Hub Amplificado" 15px/700, `letter-spacing:-0.2px`, `line-height:1`; abaixo, barra de gradiente da marca 64×4px, `border-radius:2px`:
  `linear-gradient(90deg,#F50234 0%,#FF3B00 28%,#FF7A00 58%,#FFA00A 80%,#FFB612 100%)`
- **Nav:** `gap:4px`, `margin-left:8px`. Item ativo "Minhas RPs": `padding:7px 14px; border-radius:7px; background:#F50234; color:#FFFFFF; 13px/600`. Item inativo "Mapa de Inserção": mesma caixa, `color:#AEB6C0; 13px/500`; hover → `background:#1B2430; color:#FFFFFF`.
- **Direita:** bloco de usuário (nome "Milena Dabul Stork" 12.5px/600; cargo "Executivo comercial" 11px `#9AA4B0`; `line-height:1.3`, alinhado à direita) → avatar 32px circular `background:#242C37`, iniciais 11.5px/600 `#E8EBEE` → link "Sair" 12px `#9AA4B0`, `padding-left:12px`, `border-left:1px solid #242C37`, hover `#FFFFFF`. `gap:16px`.

#### 1.2 Faixa de KPIs
- `display:grid; grid-template-columns: repeat(auto-fit, minmax(min(100%,200px),1fr)); gap:1px; background:#E2E5E9; border:1px solid #E2E5E9; border-radius:12px; overflow:hidden` — o `gap:1px` sobre fundo cinza produz as divisórias hairline.
- Cada card: `background:#FFFFFF; padding:15px 18px 14px`, coluna `gap:5px`.
  - Rótulo: mono 9.5px, `letter-spacing:.13em`, `text-transform:uppercase`, `#77808C`.
  - Valor: 23px/600, `letter-spacing:-.6px`, `font-variant-numeric: tabular-nums`. Sufixos ("RPs", "de 16") em 12px/500 `#77808C`.
- Os quatro: **Carteira** `16 RPs` · **Disponíveis** `5 de 16` (valor em **verde `#0F8A5F`**) · **Tabela disponível** `R$ 1.143.321,60` · **Selecionado** (total dinâmico da seleção).

#### 1.3 Cartão da tabela
Container: `background:#FFFFFF; border:1px solid #E2E5E9; border-radius:12px; overflow:hidden`.

**Barra de filtros** — `padding:13px 16px; border-bottom:1px solid #E8EAEE; display:flex; gap:10px; flex-wrap:wrap; align-items:center`.
- Busca: `flex:1; min-width:230px`. Input 36px, `padding:0 12px 0 32px`, `border:1px solid #E2E5E9; border-radius:8px; background:#F8F9FA; font-size:13px`; placeholder "Buscar RP, anunciante ou CNPJ"; foco → `border-color:#0F8A5F; background:#FFF`. Ícone de lupa à esquerda (11px, `#A09A8D` no protótipo é um placeholder — usar o ícone de busca do design system).
- Três `select` de 36px, `border:1px solid #E2E5E9; border-radius:8px; background:#F8F9FA; font-size:12.5px; color:#333A44`: "Praça: todas", "Status: todos", "Elegibilidade: toda".
- Contador à direita: mono 11px `#77808C`, formato `visíveis / total` (ex. `16 / 16`).

**Wrapper de rolagem** — `overflow-x:auto`; cabeçalho, cabeçalhos de grupo e linhas todos com `min-width:860px`, para que em telas estreitas a tabela role horizontalmente em vez de colapsar.

**Grid de colunas** (cabeçalho e linhas usam exatamente o mesmo):
`44px 92px minmax(160px,1fr) 66px 128px 156px 118px` → checkbox · RP · Anunciante · Praça · Mês · Tabela (dir.) · Status (dir.). `padding: 0 16px`.

**Cabeçalho** — 38px, `background:#F4F5F7`, `border-bottom:1px solid #E2E5E9`; textos mono 9.5px, `letter-spacing:.12em`, uppercase, `#77808C`. Primeira célula é o checkbox "selecionar todos".

**Cabeçalho de grupo (por mês)** — `padding:9px 16px; background:#F8F9FA; border-top e border-bottom 1px solid #E8EAEE; display:flex; gap:10px; align-items:center`:
ponto 5px `#C3C9D1` → rótulo do mês 11.5px/600 `#333A44` → contagem mono 10px `#8B93A0` ("7 RPs") → régua `flex:1; height:1px; background:#E8EAEE` → soma do grupo mono 10.5px `#5B636E`, tabular (ou o texto "sem tabela" quando nenhuma RP do grupo tem valor).
Ordem dos grupos no mock: Setembro/2026, Agosto/2026, Outubro/2026 (ordenar por mês de veiculação).

**Linha de RP** — 52px, `border-bottom:1px solid #EEF0F3`, `cursor:pointer`, `position:relative`.
- Barra de estado: `position:absolute; left:0; top:0; bottom:0; width:3px` — `#0F8A5F` quando selecionada, transparente quando não.
- Fundo: `#FFFFFF` normal · `#F2FAF6` selecionada · hover `#F4F6F8`.
- Checkbox: 16×16, `border-radius:4px`, `border:1.5px solid`. Não selecionada e elegível → borda `#AAB1BB`, fundo `#FFF`. Selecionada → borda e fundo `#0F8A5F`, marca "✓" branca 11px. **Não elegível** → borda `#E2E5E9`, fundo `#F4F5F7`, sem interação.
- RP: mono 12.5px/500. Anunciante: 13px/500 + `text-overflow:ellipsis`, com sublinha "N linhas" 11px `#8B93A0`. **Cor do texto:** `#101820` se elegível, `#8B93A0` se não elegível.
- Praça: chip mono 10px, `letter-spacing:.06em`, `padding:3px 7px`, `border-radius:5px`, `background:#EEF0F3`, `color:#5B636E`.
- Mês: 12.5px `#5B636E`.
- Tabela: 13px/500, tabular, alinhado à direita; `#101820` quando há valor, `#C3C9D1` e o caractere "—" quando não há.
- Status: pill `padding:4px 10px 4px 8px; border-radius:999px; border:1px solid; font-size:11px/600`, com ponto de 5px à esquerda.
  - **Disponível** → fundo `#E6F6EF`, borda `#BFE6D5`, texto `#0B6B4A`, ponto `#0F8A5F`.
  - **Não elegível** → fundo `#F4F5F7`, borda `#E2E5E9`, texto `#77808C`, ponto `#C3C9D1`.

#### 1.4 Painel de proposta (aside)
Cartão: `background:#FFFFFF; border:1px solid #E2E5E9; border-radius:12px; overflow:hidden`.
- **Topo escuro:** `padding:16px 18px 14px; background:#101820; color:#FFFFFF; position:relative`; faixa de gradiente da marca de 4px colada no topo (mesmo gradiente do header, `left:0;right:0;top:0`).
  - Linha 1: "{n} RPs selecionadas" 15px/600 à esquerda; "PROPOSTA" mono 10px, `letter-spacing:.1em`, uppercase, `#FF5B7D` à direita.
  - Linha 2 (`margin-top:9px`, `gap:8px`): chip do anunciante mono 10.5px `padding:3px 8px; border-radius:5px; background:#1E2732; color:#D6DBE1`; texto "{n} datas de exibição" 11.5px `#9AA4B0`.
- **Total:** `padding:14px 18px 10px; border-bottom:1px solid #E8EAEE`. Rótulo mono 9.5px uppercase `#77808C` "TOTAL DE TABELA"; valor 26px/600, `letter-spacing:-.7px`, tabular.
- **Cabeçalho da lista:** `padding:12px 18px 4px`, `space-between` — "LINHAS POR RP" mono 9.5px uppercase `#77808C`; "unitário × datas" mono 9.5px `#AAB1BB`.
- **Lista de linhas:** `max-height:420px; overflow:auto; padding:6px 6px 10px`. Cada item: `display:grid; grid-template-columns:56px minmax(0,1fr) 62px 96px; gap:6px; padding:9px 12px; border-radius:8px`; hover `background:#F4F6F8`.
  - Col 1 — RP: mono 11px `#77808C`.
  - Col 2 — programa 12.5px `#101820` com ellipsis + código mono 9.5px `#AAB1BB` (ex. `N20H_RJ`).
  - Col 3 — segundagem: mono 11px `#5B636E`, alinhado à direita (ex. `60" 22`).
  - Col 4 — total da linha: 12.5px/500, tabular, à direita.
- **Nota abaixo do cartão:** `padding:12px 16px; border:1px dashed #CCD2DA; border-radius:12px; font-size:11.5px; line-height:1.5; color:#77808C`. Texto: "Somente RPs **Disponíveis** entram na proposta. RPs não elegíveis permanecem visíveis para consulta." — "Disponíveis" em `#0B6B4A`/600.

#### 1.5 Barra de ação fixa
`position:fixed; left:0; right:0; bottom:0; z-index:40; padding:12px 24px; background:#101820; color:#FFFFFF; display:flex; align-items:center; gap:16px`.
- Esquerda (`gap:12px`, `align-items:baseline`): "{n} RPs disponíveis" 13px/600 · divisória 1×14px `#242C37` · total 14px/600 tabular · "{n} datas" 11.5px `#9AA4B0`.
- Direita: **"Alterar status"** — 38px, `padding:0 16px`, `border:1px solid #2C3542`, fundo transparente, `color:#E8EBEE`, 13px/500, hover `background:#1B2430`. **"Gerar proposta"** — 38px, `padding:0 20px`, `border-radius:8px`, `background:#F50234`, `color:#FFFFFF`, 13px/600, hover `background:#FF2A55`.

---

## Interactions & Behavior
- **Clique na linha** alterna a seleção da RP. RPs **não elegíveis não são selecionáveis** — o clique é ignorado (sem toast); o checkbox desabilitado e o texto acinzentado comunicam o motivo. Recomendação de implementação: `aria-disabled` + tooltip explicando o motivo da inelegibilidade.
- **Checkbox do cabeçalho** = selecionar/limpar todas as RPs elegíveis. Estado indeterminado (marca "–") quando há seleção parcial; "✓" quando todas as elegíveis estão marcadas.
- **KPI "Selecionado"**, **total do painel**, **contagem e total da barra fixa** e a **lista de linhas** derivam todos da seleção — reagem no mesmo tick.
- **Lista de linhas** mostra apenas as linhas de programa cujas RPs estão selecionadas, na ordem em que vêm da API (no mock: valor decrescente dentro de cada RP).
- **Filtros e busca** no protótipo são visuais (não implementados). Comportamento esperado: filtragem client-side sobre a carteira carregada, com debounce de ~200ms na busca; busca casa RP, nome do anunciante e CNPJ; o contador `visíveis / total` reflete o resultado; grupos de mês vazios são omitidos.
- **"Gerar proposta"** desabilitado quando a seleção é vazia (opacidade 0.45, `cursor:not-allowed`); dispara a geração do PDF (template já existente) e deve mostrar estado de loading no botão.
- **"Alterar status"** abre ação em lote sobre a seleção (fora do escopo deste mock).
- **Transições:** apenas `background-color .12s ease` nos estados de hover/seleção. Nada de animações elaboradas — é uma ferramenta de trabalho.
- **Responsivo:** `aside` faz wrap para baixo do `main` abaixo de ~1040px; tabela rola horizontalmente abaixo de 860px de largura útil; KPIs quebram em 2 colunas e depois 1.
- **Estados a implementar (ausentes no mock):** loading (skeleton nas linhas), carteira vazia, erro de carregamento, resultado de filtro vazio.

## State Management
- `selectedRpIds: string[]` — única fonte de verdade da seleção. Mock inicia com `["702290","702291","702289","702288"]`; em produção deve iniciar **vazio**.
- `query: string`, `filters: { praca, status, elegibilidade }` — controlam a lista visível.
- Derivados (computados, não armazenados): `groups` (RPs agrupadas por mês + soma), `selectedTotal` (soma dos totais das linhas das RPs selecionadas), `selectedLines`, `selectedDates`, estado do checkbox "todos".
- **Dados necessários da API:** carteira de RPs (`id`, `anunciante`, `cnpj`, `qtdLinhas`, `praca`, `mesVeiculacao`, `valorTabela|null`, `elegivel`, `motivoInelegibilidade`) e as linhas de cada RP (`rpId`, `programa`, `codigo`, `segundagem`, `datas`, `valorUnitario`, `valorTotal`).
- **Formatação de moeda:** `Intl.NumberFormat('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})` prefixado por `R$ `; valor nulo renderiza `—`. Nunca formatar no backend.

## Design Tokens

**Marca**
| Token | Valor |
|---|---|
| brand/red | `#F50234` |
| brand/red-hover | `#FF2A55` |
| brand/red-soft (sobre escuro) | `#FF5B7D` |
| ink (fundo escuro) | `#101820` |
| white | `#FFFFFF` |
| brand/gradient | `linear-gradient(90deg,#F50234 0%,#FF3B00 28%,#FF7A00 58%,#FFA00A 80%,#FFB612 100%)` |

**Semânticas — disponibilidade (verde, deliberadamente separado do vermelho da marca)**
| Token | Valor |
|---|---|
| available/base | `#0F8A5F` |
| available/text | `#0B6B4A` |
| available/bg | `#E6F6EF` |
| available/border | `#BFE6D5` |
| available/row-bg | `#F2FAF6` |

**Neutros**
`#F3F4F6` fundo da página · `#FFFFFF` superfície · `#F8F9FA` superfície suave (inputs, cabeçalho de grupo) · `#F4F5F7` superfície de cabeçalho/desabilitada · `#F4F6F8` hover · `#EEF0F3` chip/divisória de linha · `#E8EAEE` borda interna · `#E2E5E9` borda de container · `#CCD2DA` borda tracejada · `#C3C9D1` texto/ponto desabilitado · `#AAB1BB` texto terciário · `#8B93A0` texto desabilitado · `#77808C` texto secundário/rótulos · `#5B636E` texto de corpo suave · `#333A44` texto forte · `#101820` texto primário.

**Neutros sobre escuro:** `#242C37` (avatar, divisória) · `#1E2732` (chip) · `#1B2430` (hover) · `#2C3542` (borda de botão) · `#D6DBE1` · `#E8EBEE` · `#9AA4B0` · `#AEB6C0`.

**Tipografia**
- Família principal: **Globotipo Corporativa Textos** (fallback: `"Globotipo Corporativa", "Globotipo", "Helvetica Neue", Helvetica, Arial, sans-serif`). ⚠️ O arquivo da fonte **não está neste pacote** — usar a licença/CDN interna da Globo. O mock renderiza com fallback.
- Família mono (rótulos técnicos, IDs, códigos, segundagem, somas): no mock, **IBM Plex Mono**; **substituir pela mono do design system Globo** se existir. Se não existir, manter IBM Plex Mono ou usar `ui-monospace`.
- Escala usada: 26/600 (total do painel) · 23/600 (KPI) · 15/700 (logo) · 15/600 (título do painel) · 14/600 (total da barra) · 13/600 · 13/500 · 12.5/500 · 12.5/400 · 11.5/600 · 11.5/400 · 11/400 · mono 11 / 10.5 / 10 / 9.5.
- `font-variant-numeric: tabular-nums` em **todo** número monetário ou de contagem em coluna.
- `letter-spacing`: `-.7px` em 26px, `-.6px` em 23px, `-.2px` em 15px, `.13em` em rótulos mono uppercase, `.12em` no cabeçalho da tabela.

**Espaçamento** — escala de 4px; valores em uso: 1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28.
**Raios** — 2 (barra de gradiente) · 4 (checkbox) · 5 (chip mono) · 7 (nav) · 8 (input, select, botão, item de lista) · 12 (card) · 999 (pill de status).
**Sombras** — **nenhuma**. A separação é feita por borda hairline `#E2E5E9` e mudança de superfície. Manter assim.

## Assets
- **Gradiente da marca:** CSS puro (token acima), sem imagem.
- **Fonte Globotipo Corporativa Textos:** não incluída — obter internamente.
- **Ícones:** o mock usa apenas um círculo CSS como placeholder da lupa. Usar o icon set do codebase (lupa, chevron do select, check do checkbox).
- **Logo Globo / Comercial Amplificado:** não incluída — o header usa lockup tipográfico + barra de gradiente. Substituir pelo SVG oficial se o padrão do produto exigir.
- **Dados:** todos os valores no mock (RPs 702290…, SAERJ, programas, valores) são exemplos reais em forma; vêm da API em produção.

## Files
- `Hub Amplificado.dc.html` — o protótipo hifi completo, interativo (seleção funcionando). Abre direto no navegador junto de `support.js`.
- `support.js` — runtime da ferramenta de design. **Não portar**; existe só para o protótipo rodar.
- `screenshots/` — capturas de referência (desktop e viewport estreito); ver `screenshots/README.md`.

## Definition of done
- [ ] Tela recriada com os tokens acima, agrupamento por mês e as três zonas (KPIs, tabela, painel + barra fixa).
- [ ] Vermelho `#F50234` usado **apenas** para marca e ação primária; verde `#0F8A5F` **apenas** para disponibilidade. Nunca vermelho como cor de seleção/sucesso.
- [ ] RPs não elegíveis visíveis mas não selecionáveis, com motivo acessível.
- [ ] Todos os totais derivados da seleção, formatados em pt-BR.
- [ ] Loading, vazio, erro e resultado-de-filtro-vazio implementados.
- [ ] Navegação por teclado: linhas focáveis, Espaço alterna a seleção, foco visível (anel 2px `#0F8A5F`).
- [ ] Contraste AA verificado em todos os pares texto/fundo listados.
