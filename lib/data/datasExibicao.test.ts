import { describe, expect, it } from 'vitest';
import { criarRepositorioDatasExibicaoMock } from './datasExibicao';

describe('criarRepositorioDatasExibicaoMock', () => {
  const repositorio = criarRepositorioDatasExibicaoMock();

  it('carrega as 4469 linhas de exibição da planilha bruta', () => {
    expect(repositorio.listarDatasExibicao()).toHaveLength(4469);
  });

  it('tem 110 linhas para a RP 702290 (5 siglas × 22 datas cada)', () => {
    const linhas = repositorio.listarDatasExibicao().filter((linha) => linha.rp === '702290');
    expect(linhas).toHaveLength(110);
  });

  it('inclui uma linha com sigla N20H, chave N20H_RJ, praça RJ e data 2026-09-01 para a RP 702290', () => {
    const linhas = repositorio.listarDatasExibicao().filter((linha) => linha.rp === '702290');
    expect(
      linhas.some(
        (linha) =>
          linha.sigla === 'N20H' && linha.chave === 'N20H_RJ' && linha.praca === 'RJ' && linha.data === '2026-09-01'
      )
    ).toBe(true);
  });

  it('todas as datas estão no formato ISO YYYY-MM-DD', () => {
    const linhas = repositorio.listarDatasExibicao();
    expect(linhas.every((linha) => /^\d{4}-\d{2}-\d{2}$/.test(linha.data))).toBe(true);
  });
});
