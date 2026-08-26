export interface AvaliacaoDesconto {
  dentroDaAlcada: boolean;
  percentualLimite: number;
}

export function avaliarDesconto(percentualDesconto: number, percentualLimite = 20): AvaliacaoDesconto {
  return {
    dentroDaAlcada: percentualDesconto <= percentualLimite,
    percentualLimite,
  };
}

export function calcularLiquido(valorTabela: number, percentualDesconto: number): number {
  return valorTabela * (1 - percentualDesconto / 100);
}
