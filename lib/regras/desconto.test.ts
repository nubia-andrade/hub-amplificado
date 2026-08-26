import { describe, expect, it } from 'vitest';
import { avaliarDesconto, calcularLiquido } from './desconto';

describe('avaliarDesconto', () => {
  it('considera dentro da alçada um desconto de até 20% (limite padrão)', () => {
    expect(avaliarDesconto(20).dentroDaAlcada).toBe(true);
    expect(avaliarDesconto(0).dentroDaAlcada).toBe(true);
  });

  it('considera fora da alçada um desconto acima de 20%', () => {
    expect(avaliarDesconto(21).dentroDaAlcada).toBe(false);
  });

  it('aceita um limite de alçada customizado (parametrizável)', () => {
    expect(avaliarDesconto(25, 30).dentroDaAlcada).toBe(true);
    expect(avaliarDesconto(35, 30).dentroDaAlcada).toBe(false);
  });
});

describe('calcularLiquido', () => {
  it('aplica o percentual de desconto sobre o valor de tabela', () => {
    expect(calcularLiquido(753984, 0)).toBe(753984);
    expect(calcularLiquido(1000, 10)).toBe(900);
    expect(calcularLiquido(206553.6, 20)).toBeCloseTo(165242.88, 2);
  });
});
