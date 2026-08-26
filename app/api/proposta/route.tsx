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

  let corpo: CorpoRequisicao;
  try {
    corpo = (await request.json()) as CorpoRequisicao;
  } catch {
    return erro('Corpo da requisição inválido.', 400);
  }

  if (!Array.isArray(corpo.rpIds) || corpo.rpIds.length === 0) {
    return erro('Selecione ao menos uma RP.', 400);
  }
  if (corpo.rpIds.length > 50) {
    return erro('Selecione no máximo 50 RPs por vez.', 400);
  }
  if (
    typeof corpo.percentualDesconto !== 'number' ||
    corpo.percentualDesconto < 0 ||
    corpo.percentualDesconto > ALCADA_MAXIMA
  ) {
    return erro(`Desconto deve estar entre 0% e ${ALCADA_MAXIMA}% (alçada do executivo).`, 400);
  }

  const rpIdsUnicos = [...new Set(corpo.rpIds)];

  const repositorio = criarRepositorioMock();
  const rpsComElegibilidade = listarRpsComElegibilidade(repositorio, new Date(), MARGEM_DIAS_UTEIS);
  const rpsComStatus = rpsComElegibilidade.map(paraRpComStatus);
  const rpsDaCarteira = minhasRps(rpsComStatus, sessao.papel, sessao.executivoRaw);
  const rpsSelecionaveis = rpsDaCarteira.filter(ehSelecionavel);

  const rpsEscolhidas = rpIdsUnicos.map((id) => rpsSelecionaveis.find((rp) => rp.rp === id));
  if (rpsEscolhidas.some((rp) => rp === undefined)) {
    return erro('Uma ou mais RPs selecionadas não estão disponíveis para você.', 400);
  }

  const propostaCaPorChave = obterPropostaCaPorChave();
  const dataGeracao = new Intl.DateTimeFormat('pt-BR').format(new Date());

  const paginas: PaginaProposta[] = [];
  for (const rp of rpsEscolhidas) {
    const configuracaoAgencia = corpo.agencias?.[rp!.rp];
    const agenciaMock = obterAgenciaMock(rp!.rp);
    const possuiAgencia =
      configuracaoAgencia === undefined ? Boolean(agenciaMock) : configuracaoAgencia.possui === true;
    const nomeAgencia = possuiAgencia ? (configuracaoAgencia?.nome || agenciaMock) : null;

    if (possuiAgencia && !nomeAgencia) {
      return erro(`Informe o nome da agência para a RP ${rp!.rp}.`, 400);
    }

    const { linhas, total } = montarLinhasProposta(rp!, corpo.percentualDesconto, possuiAgencia, propostaCaPorChave);

    paginas.push({
      rp: rp!.rp,
      cliente: rp!.anunciante,
      executivo: rp!.executivo,
      agencia: nomeAgencia,
      mesAno: mesDaRp(rp!),
      linhas,
      total,
    });
  }

  const buffer = await renderToBuffer(<PropostaDocumento paginas={paginas} dataGeracao={dataGeracao} />);

  return new Response(buffer, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="proposta-${rpIdsUnicos.join('-')}.pdf"`,
    },
  });
}
