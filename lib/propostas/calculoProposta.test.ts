import { describe, expect, it } from 'vitest';
import type { Rp } from '@/lib/data/rp';
import {
  calcularTotalImpressoes,
  calcularValorBrutoNegociado,
  calcularValorLiquido,
  montarLinhasProposta,
} from './calculoProposta';

describe('calcularValorBrutoNegociado', () => {
  it('aplica o desconto do executivo sobre o valor de tabela', () => {
    expect(calcularValorBrutoNegociado(24336, 10)).toBeCloseTo(21902.4, 2);
  });

  it('sem desconto, retorna o próprio valor de tabela', () => {
    expect(calcularValorBrutoNegociado(24336, 0)).toBeCloseTo(24336, 2);
  });
});

describe('calcularValorLiquido', () => {
  it('aplica 20% de desconto de agência quando possuiAgencia é true', () => {
    expect(calcularValorLiquido(21902.4, true)).toBeCloseTo(17521.92, 2);
  });

  it('não aplica desconto quando possuiAgencia é false', () => {
    expect(calcularValorLiquido(21902.4, false)).toBeCloseTo(21902.4, 2);
  });
});

describe('calcularTotalImpressoes', () => {
  it('multiplica o valor de Proposta CA pela quantidade de inserções', () => {
    expect(calcularTotalImpressoes(41600, 13)).toBe(540800);
  });
});

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

describe('montarLinhasProposta', () => {
  it('monta uma linha por LinhaRp com todos os valores calculados', () => {
    const rp = criarRpDeTeste({
      linhas: [
        {
          sigla: 'MAVO',
          exib: 'RJ',
          chave: 'MAVO_RJ',
          programa: 'Mais Você',
          modalidade: 'COMERCIAL BREAK',
          secund: 15,
          mult: 0.75,
          precoBase: 2496,
          unit: 1872,
          nDatas: 13,
          total: 24336,
          motivos: [],
          de: '2026-09-01',
          ate: '2026-09-30',
        },
      ],
    });

    const { linhas, total } = montarLinhasProposta(rp, 10, true, { MAVO_RJ: 41600 });

    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toEqual({
      sigla: 'MAVO',
      programa: 'Mais Você',
      secundagem: 15,
      local: 'RJ',
      precoInsercao: 1872,
      totalInsercoes: 13,
      totalImpressoes: 540800,
      valorTabela: 24336,
      percentualDesconto: 10,
      valorBrutoNegociado: 21902.4,
      valorLiquido: 17521.92,
    });
    expect(total).toEqual({
      totalInsercoes: 13,
      totalImpressoes: 540800,
      valorTabela: 24336,
      percentualDesconto: 10,
      valorBrutoNegociado: 21902.4,
      valorLiquido: 17521.92,
    });
  });

  it('usa 0 quando a chave da linha não está na tabela de Proposta CA', () => {
    const rp = criarRpDeTeste({
      linhas: [
        {
          sigla: 'XYZW',
          exib: 'RJ',
          chave: 'XYZW_RJ',
          programa: 'Programa Sem Preço',
          modalidade: 'COMERCIAL BREAK',
          secund: 30,
          mult: 1,
          precoBase: 100,
          unit: 100,
          nDatas: 2,
          total: 200,
          motivos: [],
          de: '2026-09-01',
          ate: '2026-09-30',
        },
      ],
    });

    const { linhas } = montarLinhasProposta(rp, 0, false, {});

    expect(linhas[0].totalImpressoes).toBe(0);
  });
});
