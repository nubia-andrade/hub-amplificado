export const MULTIPLOS_SEGUNDAGEM: Readonly<Record<number, number>> = {
  6: 0.4,
  10: 0.45,
  15: 0.75,
  30: 1,
  45: 1.5,
  60: 2,
};

export function calcularValorUnitario(precoBase: number, segundagem: number): number | null {
  const multiplo = MULTIPLOS_SEGUNDAGEM[segundagem];
  if (multiplo === undefined) {
    return null;
  }
  return precoBase * multiplo;
}

export function calcularValorLinha(precoBase: number, segundagem: number, nDatas: number): number | null {
  const unitario = calcularValorUnitario(precoBase, segundagem);
  if (unitario === null) {
    return null;
  }
  return unitario * nDatas;
}
