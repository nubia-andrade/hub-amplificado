import { describe, expect, it } from 'vitest';
import { autenticar, buscarExecutivoPorEmail } from './carteira';

describe('buscarExecutivoPorEmail', () => {
  it('encontra executivo por e-mail, ignorando maiusculas/minusculas', () => {
    const executivo = buscarExecutivoPorEmail('MILENA.DABUL@empresa.com.br');
    expect(executivo?.nome).toBe('Milena Dabul Stork');
  });

  it('retorna undefined para e-mail fora da carteira', () => {
    expect(buscarExecutivoPorEmail('ninguem@empresa.com.br')).toBeUndefined();
  });
});

describe('autenticar', () => {
  it('autentica quando o e-mail esta na carteira e a senha nao e vazia', () => {
    const executivo = autenticar('fabio.couto@empresa.com.br', 'qualquer-coisa');
    expect(executivo?.email).toBe('fabio.couto@empresa.com.br');
  });

  it('rejeita quando a senha esta vazia', () => {
    expect(autenticar('fabio.couto@empresa.com.br', '')).toBeNull();
  });

  it('rejeita e-mail que nao esta na carteira', () => {
    expect(autenticar('ninguem@empresa.com.br', 'x')).toBeNull();
  });

  it('distingue o papel de gerente', () => {
    expect(autenticar('gerente@empresa.com.br', 'x')?.papel).toBe('gerente');
  });
});
