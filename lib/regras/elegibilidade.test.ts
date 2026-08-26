import { describe, expect, it } from 'vitest';
import type { Rp } from '@/lib/data/rp';
import { aplicarRegraPrazo, calcularDataCorte, formatarDataISO } from './elegibilidade';

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

describe('calcularDataCorte', () => {
  it('pula sábado e domingo ao contar dias úteis (sexta 28/08/2026 + 2 dias úteis = terça 01/09/2026)', () => {
    const hoje = new Date(2026, 7, 28); // sexta-feira
    const corte = calcularDataCorte(hoje, 2);
    expect(formatarDataISO(corte)).toBe('2026-09-01');
  });

  it('com margem zero, o corte é o próprio dia informado', () => {
    const hoje = new Date(2020, 0, 1);
    expect(formatarDataISO(calcularDataCorte(hoje, 0))).toBe('2020-01-01');
  });
});

describe('aplicarRegraPrazo', () => {
  it('mantém elegível uma RP cujas datas são todas posteriores ao corte', () => {
    const rp = criarRpDeTeste({
      linhas: [
        {
          sigla: 'X', exib: 'RJ', chave: 'X_RJ', programa: 'P', modalidade: 'M',
          secund: 30, mult: 1, precoBase: 100, unit: 100, nDatas: 1, total: 100,
          motivos: [], de: '2026-09-02', ate: '2026-09-02',
        },
      ],
    });
    const resultado = aplicarRegraPrazo(rp, '2026-09-01');
    expect(resultado.elegivel).toBe(true);
    expect(resultado.motivos).toEqual([]);
  });

  it('torna não elegível uma RP com alguma data de exibição no corte ou antes', () => {
    const rp = criarRpDeTeste({
      linhas: [
        {
          sigla: 'X', exib: 'RJ', chave: 'X_RJ', programa: 'P', modalidade: 'M',
          secund: 30, mult: 1, precoBase: 100, unit: 100, nDatas: 1, total: 100,
          motivos: [], de: '2026-09-01', ate: '2026-09-01',
        },
      ],
    });
    const resultado = aplicarRegraPrazo(rp, '2026-09-01');
    expect(resultado.elegivel).toBe(false);
    expect(resultado.motivos).toHaveLength(1);
    expect(resultado.motivos[0]).toContain('01/09/2026');
  });

  it('preserva motivos de inelegibilidade já existentes ao adicionar o motivo de prazo', () => {
    const rp = criarRpDeTeste({
      elegivel: false,
      motivos: ['Sem preço para X_RJ'],
      linhas: [
        {
          sigla: 'X', exib: 'RJ', chave: 'X_RJ', programa: 'P', modalidade: 'M',
          secund: 30, mult: 1, precoBase: null, unit: null, nDatas: 1, total: null,
          motivos: ['Sem preço para X_RJ'], de: '2026-09-01', ate: '2026-09-01',
        },
      ],
    });
    const resultado = aplicarRegraPrazo(rp, '2026-09-01');
    expect(resultado.motivos).toEqual(['Sem preço para X_RJ', expect.stringContaining('01/09/2026')]);
    expect(resultado.elegivel).toBe(false);
  });

  it('não altera uma RP sem linhas', () => {
    const rp = criarRpDeTeste({ linhas: [] });
    const resultado = aplicarRegraPrazo(rp, '2026-09-01');
    expect(resultado).toEqual(rp);
  });
});
