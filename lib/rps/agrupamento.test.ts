import { describe, expect, it } from 'vitest';
import type { LinhaRp } from '@/lib/data/rp';
import type { RpComStatus } from './rpComStatus';
import { agruparRpsPorMes } from './agrupamento';

function criarLinhaDeTeste(overrides: Partial<LinhaRp> = {}): LinhaRp {
  return {
    sigla: 'N20H',
    exib: 'RJ',
    chave: 'N20H_RJ',
    programa: 'Novela III',
    modalidade: 'COMERCIAL BREAK',
    secund: 60,
    mult: 2,
    precoBase: 100,
    unit: 200,
    nDatas: 22,
    total: 4400,
    motivos: [],
    de: '2026-09-01',
    ate: '2026-09-30',
    ...overrides,
  };
}

function criarRpDeTeste(overrides: Partial<RpComStatus> = {}): RpComStatus {
  return {
    rp: '1',
    anunciante: 'Anunciante Teste',
    cnpj: '00.000.000/0000-00',
    executivo: 'Executivo Teste',
    setor: 'Setor Teste',
    exib: 'RJ',
    portfolio: 'PORTFOLIO TESTE',
    cm: '000000',
    linhas: [criarLinhaDeTeste()],
    nDatas: 22,
    elegivel: true,
    motivos: [],
    valorTabela: 1000,
    status: 'Disponível',
    ...overrides,
  };
}

describe('agruparRpsPorMes', () => {
  it('agrupa RPs pelo mês da primeira data de exibição, em ordem cronológica', () => {
    const rps = [
      criarRpDeTeste({ rp: '1', linhas: [criarLinhaDeTeste({ de: '2026-10-01', ate: '2026-10-31' })] }),
      criarRpDeTeste({ rp: '2', linhas: [criarLinhaDeTeste({ de: '2026-09-01', ate: '2026-09-30' })] }),
    ];

    const grupos = agruparRpsPorMes(rps);

    expect(grupos.map((g) => g.chave)).toEqual(['2026-09', '2026-10']);
    expect(grupos[0].rotulo).toBe('Setembro/2026');
    expect(grupos[0].rps.map((rp) => rp.rp)).toEqual(['2']);
  });

  it('soma o valorTabela só das RPs elegíveis do grupo', () => {
    const rps = [
      criarRpDeTeste({ rp: '1', elegivel: true, valorTabela: 500 }),
      criarRpDeTeste({ rp: '2', elegivel: false, valorTabela: 999 }),
    ];

    const grupos = agruparRpsPorMes(rps);

    expect(grupos[0].totalTabela).toBe(500);
  });

  it('retorna totalTabela null quando nenhuma RP do grupo é elegível', () => {
    const rps = [criarRpDeTeste({ elegivel: false, valorTabela: 999 })];

    const grupos = agruparRpsPorMes(rps);

    expect(grupos[0].totalTabela).toBeNull();
  });

  it('agrupa RP sem linhas no grupo "Sem data", por último', () => {
    const rps = [
      criarRpDeTeste({ rp: '1', linhas: [] }),
      criarRpDeTeste({ rp: '2', linhas: [criarLinhaDeTeste({ de: '2026-09-01', ate: '2026-09-30' })] }),
    ];

    const grupos = agruparRpsPorMes(rps);

    expect(grupos.map((g) => g.rotulo)).toEqual(['Setembro/2026', 'Sem data']);
  });
});
