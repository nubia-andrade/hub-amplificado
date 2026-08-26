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
