import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/session', () => ({
  lerSessao: vi.fn(),
}));
vi.mock('@/lib/data/agenciaCliente', () => ({
  obterAgenciaCliente: vi.fn(),
}));

import { lerSessao } from '@/lib/auth/session';
import { obterAgenciaCliente } from '@/lib/data/agenciaCliente';
import { GET } from './route';

function requisicao(url: string): Request {
  return new Request(url);
}

describe('GET /api/agencia', () => {
  it('retorna 401 sem sessão', async () => {
    vi.mocked(lerSessao).mockResolvedValue(null);

    const resposta = await GET(requisicao('http://localhost/api/agencia?cliente=SAERJ'));

    expect(resposta.status).toBe(401);
  });

  it('retorna 400 sem o parâmetro cliente', async () => {
    vi.mocked(lerSessao).mockResolvedValue({
      nome: 'Karina Martinelli',
      email: 'karina@teste.com',
      papel: 'executivo',
      executivoRaw: 'Karina Martinelli',
    });

    const resposta = await GET(requisicao('http://localhost/api/agencia'));

    expect(resposta.status).toBe(400);
  });

  it('retorna a agência do cliente', async () => {
    vi.mocked(lerSessao).mockResolvedValue({
      nome: 'Karina Martinelli',
      email: 'karina@teste.com',
      papel: 'executivo',
      executivoRaw: 'Karina Martinelli',
    });
    vi.mocked(obterAgenciaCliente).mockResolvedValue({ possuiAgencia: true, nomeAgencia: 'WMcCann' });

    const resposta = await GET(requisicao('http://localhost/api/agencia?cliente=SAERJ'));

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ possuiAgencia: true, nomeAgencia: 'WMcCann' });
    expect(obterAgenciaCliente).toHaveBeenCalledWith('SAERJ');
  });
});
