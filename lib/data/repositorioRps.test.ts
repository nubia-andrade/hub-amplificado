import { describe, expect, it } from 'vitest';
import { criarRepositorioMock } from './repositorioRps';

describe('criarRepositorioMock', () => {
  const repositorio = criarRepositorioMock();

  it('carrega as 408 RPs do dados.js', () => {
    expect(repositorio.listarRps()).toHaveLength(408);
  });

  it('reflete a elegibilidade já calculada no dados.js: 349 elegíveis e 59 não elegíveis', () => {
    const rps = repositorio.listarRps();
    expect(rps.filter((rp) => rp.elegivel)).toHaveLength(349);
    expect(rps.filter((rp) => !rp.elegivel)).toHaveLength(59);
  });

  it('mapeia corretamente os campos da RP 702290 e da sua primeira linha', () => {
    const rp = repositorio.listarRps().find((r) => r.rp === '702290');
    expect(rp).toBeDefined();
    expect(rp?.anunciante).toBe('SAERJ');
    expect(rp?.cnpj).toBe('10.554.856/0001-62');
    expect(rp?.exib).toBe('RJ');
    expect(rp?.valorTabela).toBe(753984);

    const linha = rp?.linhas[0];
    expect(linha?.sigla).toBe('N20H');
    expect(linha?.chave).toBe('N20H_RJ');
    expect(linha?.programa).toBe('Novela III');
    expect(linha?.secund).toBe(60);
    expect(linha?.precoBase).toBe(4694.4);
    expect(linha?.unit).toBe(9388.8);
    expect(linha?.nDatas).toBe(22);
    expect(linha?.total).toBe(206553.6);
    expect(linha?.de).toBe('2026-09-01');
  });
});
