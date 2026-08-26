import { describe, expect, it } from 'vitest';
import { autenticar, buscarExecutivoPorEmail } from './carteira';

describe('buscarExecutivoPorEmail', () => {
  it('encontra executivo por e-mail, ignorando maiúsculas/minúsculas', () => {
    const executivo = buscarExecutivoPorEmail('MILENA.DABUL@empresa.com.br');
    expect(executivo?.nome).toBe('Milena Dabul Stork');
  });

  it('retorna undefined para e-mail fora da carteira', () => {
    expect(buscarExecutivoPorEmail('ninguem@empresa.com.br')).toBeUndefined();
  });
});

describe('autenticar', () => {
  it('autentica quando o e-mail está na carteira e a senha não é vazia', () => {
    const executivo = autenticar('fabio.couto@empresa.com.br', 'qualquer-coisa');
    expect(executivo?.email).toBe('fabio.couto@empresa.com.br');
  });

  it('rejeita quando a senha está vazia', () => {
    expect(autenticar('fabio.couto@empresa.com.br', '')).toBeNull();
  });

  it('rejeita quando a senha contém apenas espaços', () => {
    expect(autenticar('fabio.couto@empresa.com.br', '   ')).toBeNull();
  });

  it('rejeita e-mail que não está na carteira', () => {
    expect(autenticar('ninguem@empresa.com.br', 'x')).toBeNull();
  });

  it('distingue o papel de gerente', () => {
    expect(autenticar('gerente@empresa.com.br', 'x')?.papel).toBe('gerente');
  });
});
