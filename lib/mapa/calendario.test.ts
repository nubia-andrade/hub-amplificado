import { describe, expect, it } from 'vitest';
import type { Rp } from '@/lib/data/rp';
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import type { DataExibicao } from '@/lib/data/datasExibicao';
import { agruparDatasPorDia, construirGradeDoMes, primeiroMesComDatas, ultimoMesComDatas } from './calendario';

function criarRpDeTeste(overrides: Partial<Rp> = {}): RpComStatus {
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
    status: 'Disponível',
    ...overrides,
  };
}

describe('agruparDatasPorDia', () => {
  it('agrupa siglas por dia, marcando elegivel a partir da RP correspondente', () => {
    const rps = [criarRpDeTeste({ rp: '1', elegivel: true }), criarRpDeTeste({ rp: '2', elegivel: false })];
    const datas: DataExibicao[] = [
      { rp: '1', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-09-01' },
      { rp: '2', sigla: 'DEF', chave: 'DEF_RJ', data: '2026-09-01' },
    ];

    const mapa = agruparDatasPorDia(rps, datas);

    expect(mapa['2026-09-01']).toEqual(
      expect.arrayContaining([
        { sigla: 'ABC', elegivel: true },
        { sigla: 'DEF', elegivel: false },
      ])
    );
  });

  it('ignora datas de RPs fora da lista informada', () => {
    const rps = [criarRpDeTeste({ rp: '1', elegivel: true })];
    const datas: DataExibicao[] = [{ rp: '999', sigla: 'XYZ', chave: 'XYZ_RJ', data: '2026-09-01' }];

    const mapa = agruparDatasPorDia(rps, datas);

    expect(mapa['2026-09-01']).toBeUndefined();
  });

  it('mescla a mesma sigla no mesmo dia com AND de elegibilidade (elegível só se todas as ocorrências forem elegíveis)', () => {
    const rps = [criarRpDeTeste({ rp: '1', elegivel: false }), criarRpDeTeste({ rp: '2', elegivel: true })];
    const datas: DataExibicao[] = [
      { rp: '1', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-09-01' },
      { rp: '2', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-09-01' },
    ];

    const mapa = agruparDatasPorDia(rps, datas);

    expect(mapa['2026-09-01']).toEqual([{ sigla: 'ABC', elegivel: false }]);
  });

  it('mantém elegivel true quando todas as ocorrências da mesma sigla no mesmo dia são elegíveis', () => {
    const rps = [criarRpDeTeste({ rp: '1', elegivel: true }), criarRpDeTeste({ rp: '2', elegivel: true })];
    const datas: DataExibicao[] = [
      { rp: '1', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-09-01' },
      { rp: '2', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-09-01' },
    ];

    const mapa = agruparDatasPorDia(rps, datas);

    expect(mapa['2026-09-01']).toEqual([{ sigla: 'ABC', elegivel: true }]);
  });
});

describe('primeiroMesComDatas', () => {
  it('retorna o ano/mês da data mais antiga entre as RPs informadas', () => {
    const rps = [criarRpDeTeste({ rp: '1' })];
    const datas: DataExibicao[] = [
      { rp: '1', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-10-15' },
      { rp: '1', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-09-01' },
    ];

    expect(primeiroMesComDatas(rps, datas)).toEqual({ ano: 2026, mes: 9 });
  });

  it('retorna null quando não há datas para as RPs informadas', () => {
    const rps = [criarRpDeTeste({ rp: '1' })];
    expect(primeiroMesComDatas(rps, [])).toBeNull();
  });
});

describe('ultimoMesComDatas', () => {
  it('retorna o ano/mês da data mais recente entre as RPs informadas', () => {
    const rps = [criarRpDeTeste({ rp: '1' })];
    const datas: DataExibicao[] = [
      { rp: '1', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-10-15' },
      { rp: '1', sigla: 'ABC', chave: 'ABC_RJ', data: '2026-09-01' },
    ];

    expect(ultimoMesComDatas(rps, datas)).toEqual({ ano: 2026, mes: 10 });
  });

  it('retorna null quando não há datas para as RPs informadas', () => {
    const rps = [criarRpDeTeste({ rp: '1' })];
    expect(ultimoMesComDatas(rps, [])).toBeNull();
  });
});

describe('construirGradeDoMes', () => {
  it('monta setembro/2026 em 5 semanas, com 1º de setembro (terça) na posição correta', () => {
    const grade = construirGradeDoMes(2026, 9);

    expect(grade).toHaveLength(5);
    expect(grade[0]).toEqual([null, null, '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05']);
    expect(grade[4]).toEqual(['2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', null, null, null]);
  });
});
