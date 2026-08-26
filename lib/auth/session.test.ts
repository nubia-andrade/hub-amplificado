import { describe, expect, it } from 'vitest';
import { ehSessao } from './session';

describe('ehSessao', () => {
  it('aceita um objeto com o formato correto de sessão', () => {
    expect(ehSessao({ nome: 'Fábio Couto', email: 'fabio.couto@empresa.com.br', papel: 'executivo' })).toBe(
      true,
    );
  });

  it('rejeita objeto com campo obrigatório ausente', () => {
    expect(ehSessao({ email: 'fabio.couto@empresa.com.br', papel: 'executivo' })).toBe(false);
  });

  it('rejeita objeto com valor de papel inválido', () => {
    expect(
      ehSessao({ nome: 'Fábio Couto', email: 'fabio.couto@empresa.com.br', papel: 'admin' }),
    ).toBe(false);
  });

  it('rejeita valores que não são objetos', () => {
    expect(ehSessao(null)).toBe(false);
    expect(ehSessao('sessao')).toBe(false);
    expect(ehSessao(42)).toBe(false);
  });
});
