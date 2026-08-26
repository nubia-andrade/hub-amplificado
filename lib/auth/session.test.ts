import { describe, expect, it } from 'vitest';
import { ehSessao } from './session';

describe('ehSessao', () => {
  it('aceita um objeto com o formato correto de sessão (executivo com executivoRaw)', () => {
    expect(
      ehSessao({
        nome: 'Fábio Couto',
        email: 'fabio.couto@empresa.com.br',
        papel: 'executivo',
        executivoRaw: 'Fabio Couto (MV)',
      }),
    ).toBe(true);
  });

  it('aceita um objeto de gerente com executivoRaw nulo', () => {
    expect(
      ehSessao({
        nome: 'Gerência Comercial',
        email: 'gerente@empresa.com.br',
        papel: 'gerente',
        executivoRaw: null,
      }),
    ).toBe(true);
  });

  it('rejeita objeto com campo obrigatório ausente', () => {
    expect(
      ehSessao({ email: 'fabio.couto@empresa.com.br', papel: 'executivo', executivoRaw: null }),
    ).toBe(false);
  });

  it('rejeita objeto com valor de papel inválido', () => {
    expect(
      ehSessao({
        nome: 'Fábio Couto',
        email: 'fabio.couto@empresa.com.br',
        papel: 'admin',
        executivoRaw: null,
      }),
    ).toBe(false);
  });

  it('rejeita executivoRaw que não é string nem null', () => {
    expect(
      ehSessao({
        nome: 'Fábio Couto',
        email: 'fabio.couto@empresa.com.br',
        papel: 'executivo',
        executivoRaw: 42,
      }),
    ).toBe(false);
  });

  it('rejeita valores que não são objetos', () => {
    expect(ehSessao(null)).toBe(false);
    expect(ehSessao('sessao')).toBe(false);
    expect(ehSessao(42)).toBe(false);
  });
});
