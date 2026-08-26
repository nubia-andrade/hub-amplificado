export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
}

const MESES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

interface RpComDatas {
  linhas: Array<{ de: string; ate: string }>;
}

/**
 * Calcula o(s) mês(es) de exibição de uma RP a partir das datas de suas linhas.
 * Retorna "Mês/Ano" quando todas as datas caem no mesmo mês, ou
 * "MêsInicio–MêsFim/Ano" quando a RP cruza mais de um mês.
 */
export function mesDaRp(rp: RpComDatas): string {
  const datas = rp.linhas.flatMap((linha) => [linha.de, linha.ate]).filter(Boolean);
  if (datas.length === 0) {
    return '—';
  }

  const ordenadas = [...datas].sort();
  const primeira = ordenadas[0];
  const ultima = ordenadas[ordenadas.length - 1];

  const [anoInicio, mesInicio] = primeira.split('-');
  const [anoFim, mesFim] = ultima.split('-');

  const rotuloInicio = capitalizar(MESES_PT[Number(mesInicio) - 1]);

  if (anoInicio === anoFim && mesInicio === mesFim) {
    return `${rotuloInicio}/${anoInicio}`;
  }

  const rotuloFim = capitalizar(MESES_PT[Number(mesFim) - 1]);
  return `${rotuloInicio}–${rotuloFim}/${anoFim}`;
}
