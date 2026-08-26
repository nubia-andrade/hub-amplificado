import { describe, expect, it } from 'vitest';
import { obterAgenciaMock } from './agenciaMock';

describe('obterAgenciaMock', () => {
  it('é determinístico para o mesmo id de RP', () => {
    expect(obterAgenciaMock('702290')).toBe(obterAgenciaMock('702290'));
  });

  it('retorna null para uma RP sem agência mockada', () => {
    expect(obterAgenciaMock('702290')).toBeNull();
  });

  it('retorna um nome de agência para uma RP com agência mockada', () => {
    expect(obterAgenciaMock('999999')).toBe('DPZ&T');
  });

  it('retorna nomes diferentes conforme o id', () => {
    expect(obterAgenciaMock('2')).toBe('WMcCann');
    expect(obterAgenciaMock('3')).toBe('Ogilvy Brasil');
  });
});
