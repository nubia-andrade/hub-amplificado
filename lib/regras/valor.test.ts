import { describe, expect, it } from 'vitest';
import { calcularValorLinha, calcularValorUnitario, MULTIPLOS_SEGUNDAGEM } from './valor';

describe('MULTIPLOS_SEGUNDAGEM', () => {
  it('tem os seis múltiplos definidos no README', () => {
    expect(MULTIPLOS_SEGUNDAGEM).toEqual({ 6: 0.4, 10: 0.45, 15: 0.75, 30: 1, 45: 1.5, 60: 2 });
  });
});

describe('calcularValorUnitario', () => {
  it('multiplica o preço base pelo múltiplo da segundagem (caso real: RP 702290, Novela III)', () => {
    expect(calcularValorUnitario(4694.4, 60)).toBeCloseTo(9388.8, 2);
  });

  it('retorna null para segundagem fora dos coeficientes (0", 5", 90")', () => {
    expect(calcularValorUnitario(1000, 0)).toBeNull();
    expect(calcularValorUnitario(1000, 5)).toBeNull();
    expect(calcularValorUnitario(1000, 90)).toBeNull();
  });
});

describe('calcularValorLinha', () => {
  it('multiplica o valor unitário pelo número de datas distintas (caso real: RP 702290, Novela III)', () => {
    expect(calcularValorLinha(4694.4, 60, 22)).toBeCloseTo(206553.6, 2);
  });

  it('retorna null quando a segundagem é inválida, independente do número de datas', () => {
    expect(calcularValorLinha(1000, 90, 10)).toBeNull();
  });
});
