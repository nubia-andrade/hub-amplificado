import type { Rp } from '@/lib/data/rp';

export interface LinhaProposta {
  sigla: string;
  programa: string;
  secundagem: number;
  local: string;
  precoInsercao: number;
  totalInsercoes: number;
  totalImpressoes: number;
  valorTabela: number;
  percentualDesconto: number;
  valorBrutoNegociado: number;
  valorLiquido: number;
}

export interface TotalProposta {
  totalInsercoes: number;
  totalImpressoes: number;
  valorTabela: number;
  percentualDesconto: number;
  valorBrutoNegociado: number;
  valorLiquido: number;
}

export function calcularValorBrutoNegociado(valorTabela: number, percentualDesconto: number): number {
  return valorTabela * (1 - percentualDesconto / 100);
}

export function calcularValorLiquido(valorBrutoNegociado: number, possuiAgencia: boolean): number {
  return possuiAgencia ? valorBrutoNegociado * 0.8 : valorBrutoNegociado;
}

export function calcularTotalImpressoes(propostaCa: number, nDatas: number): number {
  return propostaCa * nDatas;
}

export function montarLinhasProposta(
  rp: Rp,
  percentualDesconto: number,
  possuiAgencia: boolean,
  propostaCaPorChave: Record<string, number>
): { linhas: LinhaProposta[]; total: TotalProposta } {
  const linhas: LinhaProposta[] = rp.linhas.map((linha) => {
    const valorTabela = linha.total ?? 0;
    const valorBrutoNegociado = calcularValorBrutoNegociado(valorTabela, percentualDesconto);
    const valorLiquido = calcularValorLiquido(valorBrutoNegociado, possuiAgencia);
    const propostaCa = propostaCaPorChave[linha.chave] ?? 0;

    return {
      sigla: linha.sigla,
      programa: linha.programa,
      secundagem: linha.secund,
      local: linha.exib,
      precoInsercao: linha.unit ?? 0,
      totalInsercoes: linha.nDatas,
      totalImpressoes: calcularTotalImpressoes(propostaCa, linha.nDatas),
      valorTabela,
      percentualDesconto,
      valorBrutoNegociado: Math.round(valorBrutoNegociado * 100) / 100,
      valorLiquido: Math.round(valorLiquido * 100) / 100,
    };
  });

  const total: TotalProposta = linhas.reduce(
    (acumulado, linha) => ({
      totalInsercoes: acumulado.totalInsercoes + linha.totalInsercoes,
      totalImpressoes: acumulado.totalImpressoes + linha.totalImpressoes,
      valorTabela: acumulado.valorTabela + linha.valorTabela,
      percentualDesconto,
      valorBrutoNegociado: acumulado.valorBrutoNegociado + linha.valorBrutoNegociado,
      valorLiquido: acumulado.valorLiquido + linha.valorLiquido,
    }),
    {
      totalInsercoes: 0,
      totalImpressoes: 0,
      valorTabela: 0,
      percentualDesconto,
      valorBrutoNegociado: 0,
      valorLiquido: 0,
    }
  );

  return { linhas, total };
}
