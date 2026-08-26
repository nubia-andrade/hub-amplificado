import { describe, expect, it } from 'vitest';
import type { RpComStatus } from './rpComStatus';
import {
  estadoSelecaoTodas,
  ehSelecionavel,
  filtrarRps,
  minhasRps,
  resumoSelecao,
} from './regrasLista';

function criarRpDeTeste(overrides: Partial<RpComStatus> = {}): RpComStatus {
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
    valorTabela: 100,
    status: 'Disponível',
    ...overrides,
  };
}

describe('filtrarRps', () => {
  const rps = [
    criarRpDeTeste({ rp: '1', anunciante: 'SAERJ', cnpj: '10.554.856/0001-62', exib: 'RJ', status: 'Disponível', elegivel: true }),
    criarRpDeTeste({ rp: '2', anunciante: 'ELETROBRAS', cnpj: '00.001.180/0001-26', exib: 'NET', status: 'Em negociação', elegivel: true }),
    criarRpDeTeste({ rp: '3', anunciante: 'SAERJ', cnpj: '10.554.856/0001-62', exib: 'SP1', status: 'Disponível', elegivel: false, motivos: ['Sem preço'] }),
  ];

  it('filtra por texto de busca (RP, anunciante ou CNPJ)', () => {
    expect(filtrarRps(rps, { busca: 'SAERJ', praca: '', status: '', elegibilidade: 'todas', executivo: '' })).toHaveLength(2);
    expect(filtrarRps(rps, { busca: '10.554.856', praca: '', status: '', elegibilidade: 'todas', executivo: '' })).toHaveLength(2);
    expect(filtrarRps(rps, { busca: 'rp 2', praca: '', status: '', elegibilidade: 'todas', executivo: '' })).toHaveLength(0);
  });

  it('filtra por praça', () => {
    expect(filtrarRps(rps, { busca: '', praca: 'NET', status: '', elegibilidade: 'todas', executivo: '' })).toHaveLength(1);
  });

  it('filtra por status comercial', () => {
    expect(filtrarRps(rps, { busca: '', praca: '', status: 'Em negociação', elegibilidade: 'todas', executivo: '' })).toHaveLength(1);
  });

  it('filtra por elegibilidade', () => {
    expect(filtrarRps(rps, { busca: '', praca: '', status: '', elegibilidade: 'sim', executivo: '' })).toHaveLength(2);
    expect(filtrarRps(rps, { busca: '', praca: '', status: '', elegibilidade: 'nao', executivo: '' })).toHaveLength(1);
  });

  it('sem filtros ativos, retorna todas as RPs', () => {
    expect(filtrarRps(rps, { busca: '', praca: '', status: '', elegibilidade: 'todas', executivo: '' })).toHaveLength(3);
  });
});

describe('minhasRps', () => {
  const rps = [
    criarRpDeTeste({ rp: '1', executivo: 'Milena Dabul Stork(N)' }),
    criarRpDeTeste({ rp: '2', executivo: 'Fabio Couto (MV)' }),
  ];

  it('para papel executivo, retorna só as RPs cujo executivo bate com o executivoRaw', () => {
    expect(minhasRps(rps, 'executivo', 'Milena Dabul Stork(N)')).toEqual([rps[0]]);
  });

  it('para papel gerente, retorna todas as RPs independente do executivoRaw', () => {
    expect(minhasRps(rps, 'gerente', null)).toHaveLength(2);
  });
});

describe('ehSelecionavel', () => {
  it('é selecionável quando elegível e status Disponível', () => {
    expect(ehSelecionavel(criarRpDeTeste({ elegivel: true, status: 'Disponível' }))).toBe(true);
  });

  it('não é selecionável quando não elegível', () => {
    expect(ehSelecionavel(criarRpDeTeste({ elegivel: false, status: 'Disponível' }))).toBe(false);
  });

  it('não é selecionável quando o status não é Disponível', () => {
    expect(ehSelecionavel(criarRpDeTeste({ elegivel: true, status: 'Em negociação' }))).toBe(false);
  });
});

describe('estadoSelecaoTodas', () => {
  const rps = [
    criarRpDeTeste({ rp: '1', elegivel: true, status: 'Disponível' }),
    criarRpDeTeste({ rp: '2', elegivel: true, status: 'Disponível' }),
    criarRpDeTeste({ rp: '3', elegivel: false, status: 'Disponível' }),
  ];

  it('retorna "nenhuma" quando nada está marcado', () => {
    expect(estadoSelecaoTodas(rps, [])).toBe('nenhuma');
  });

  it('retorna "parcial" quando algumas selecionáveis estão marcadas', () => {
    expect(estadoSelecaoTodas(rps, ['1'])).toBe('parcial');
  });

  it('retorna "todas" quando todas as selecionáveis estão marcadas (RP não selecionável não conta)', () => {
    expect(estadoSelecaoTodas(rps, ['1', '2'])).toBe('todas');
  });
});

describe('resumoSelecao', () => {
  const rps = [
    criarRpDeTeste({ rp: '1', anunciante: 'SAERJ', valorTabela: 100 }),
    criarRpDeTeste({ rp: '2', anunciante: 'ELETROBRAS', valorTabela: 250 }),
  ];

  it('soma o valor de tabela e conta anunciantes distintos das RPs selecionadas', () => {
    const resumo = resumoSelecao(rps, ['1', '2']);
    expect(resumo.quantidade).toBe(2);
    expect(resumo.totalTabela).toBe(350);
    expect(resumo.anunciantesDistintos).toBe(2);
  });

  it('conta um único anunciante quando as RPs selecionadas são do mesmo cliente', () => {
    const mesmoAnunciante = [
      criarRpDeTeste({ rp: '1', anunciante: 'SAERJ', valorTabela: 100 }),
      criarRpDeTeste({ rp: '2', anunciante: 'SAERJ', valorTabela: 250 }),
    ];
    expect(resumoSelecao(mesmoAnunciante, ['1', '2']).anunciantesDistintos).toBe(1);
  });
});
