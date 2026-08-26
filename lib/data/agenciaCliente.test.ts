import { describe, expect, it, vi } from 'vitest';

vi.mock('./nhost', () => ({
  executarGraphQL: vi.fn(),
}));

import { executarGraphQL } from './nhost';
import { obterAgenciaCliente } from './agenciaCliente';
import { obterAgenciaMock } from './agenciaMock';

describe('obterAgenciaCliente', () => {
  it('retorna a agência quando o cliente está cadastrado e tem agência', async () => {
    vi.mocked(executarGraphQL).mockResolvedValue({
      clientes: [{ agencia: { nome: 'WMcCann' } }],
    });

    expect(await obterAgenciaCliente('SAERJ')).toEqual({ possuiAgencia: true, nomeAgencia: 'WMcCann' });
  });

  it('retorna sem agência quando o cliente está cadastrado mas não tem agência vinculada', async () => {
    vi.mocked(executarGraphQL).mockResolvedValue({
      clientes: [{ agencia: null }],
    });

    expect(await obterAgenciaCliente('SAERJ')).toEqual({ possuiAgencia: false, nomeAgencia: null });
  });

  it('cai no mock determinístico quando o cliente não está cadastrado no Nhost', async () => {
    vi.mocked(executarGraphQL).mockResolvedValue({ clientes: [] });

    const esperado = obterAgenciaMock('ClienteNuncaCadastrado');

    expect(await obterAgenciaCliente('ClienteNuncaCadastrado')).toEqual({
      possuiAgencia: esperado !== null,
      nomeAgencia: esperado,
    });
  });

  it('cai no mock determinístico quando a consulta ao Nhost falha', async () => {
    vi.mocked(executarGraphQL).mockRejectedValue(new Error('falha de rede'));

    const esperado = obterAgenciaMock('SAERJ');

    expect(await obterAgenciaCliente('SAERJ')).toEqual({
      possuiAgencia: esperado !== null,
      nomeAgencia: esperado,
    });
  });
});
