import { lerSessao } from '@/lib/auth/session';
import { obterAgenciaCliente } from '@/lib/data/agenciaCliente';

function erro(mensagem: string, status: number): Response {
  return Response.json({ erro: mensagem }, { status });
}

export async function GET(request: Request): Promise<Response> {
  const sessao = await lerSessao();
  if (!sessao) {
    return erro('Sessão não encontrada.', 401);
  }

  const cliente = new URL(request.url).searchParams.get('cliente');
  if (!cliente) {
    return erro('Parâmetro "cliente" é obrigatório.', 400);
  }

  const agenciaCliente = await obterAgenciaCliente(cliente);
  return Response.json(agenciaCliente);
}
