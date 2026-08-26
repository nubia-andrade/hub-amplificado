import { describe, expect, it } from 'vitest';
import { obterPropostaCaPorChave } from './tabelaPrecos';

describe('obterPropostaCaPorChave', () => {
  const propostaCaPorChave = obterPropostaCaPorChave();

  it('inclui um programa nacional (aba Base, praça NET)', () => {
    expect(propostaCaPorChave['ALTA_NET']).toBe(182080);
  });

  it('inclui um programa regional no RJ (aba Regional)', () => {
    expect(propostaCaPorChave['BPRA_RJ']).toBe(63760);
  });

  it('normaliza a praça SP da aba Regional para SP1', () => {
    expect(propostaCaPorChave['BPRA_SP1']).toBe(58320);
    expect(propostaCaPorChave['BPRA_SP']).toBeUndefined();
  });
});
