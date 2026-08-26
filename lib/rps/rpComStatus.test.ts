import { describe, expect, it } from 'vitest';
import type { Rp } from '@/lib/data/rp';
import { paraRpComStatus } from './rpComStatus';

function criarRpDeTeste(overrides: Partial<Rp> = {}): Rp {
  return {
    rp: '999999',
    anunciante: 'Anunciante Teste',
    cnpj: '00.000.000/0000-00',
    executivo: 'Executivo Teste',
    setor: 'Setor Teste',
    exib: 'RJ',
    portfolio: 'PORTFOLIO TESTE',
    cm: '000000',
    linhas: [],
    nDatas: 0,
    elegivel: true,
    motivos: [],
    valorTabela: 0,
    ...overrides,
  };
}

describe('paraRpComStatus', () => {
  it('atribui status "Disponível" por padrão, já que não há persistência de status ainda', () => {
    const rp = criarRpDeTeste();
    expect(paraRpComStatus(rp).status).toBe('Disponível');
  });

  it('preserva todos os campos originais da RP', () => {
    const rp = criarRpDeTeste({ rp: '702290', anunciante: 'SAERJ', valorTabela: 753984 });
    const resultado = paraRpComStatus(rp);
    expect(resultado.rp).toBe('702290');
    expect(resultado.anunciante).toBe('SAERJ');
    expect(resultado.valorTabela).toBe(753984);
  });
});
