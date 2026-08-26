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
