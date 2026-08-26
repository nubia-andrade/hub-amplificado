import type { Rp } from '@/lib/data/rp';

export function calcularDataCorte(hoje: Date, margemDiasUteis: number): Date {
  let corte = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
  let restantes = margemDiasUteis;

  while (restantes > 0) {
    corte = new Date(corte.getTime() + 24 * 60 * 60 * 1000);
    const diaDaSemana = corte.getUTCDay();
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
      restantes -= 1;
    }
  }

  return corte;
}

export function formatarDataISO(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function formatarDataBR(dataISO: string): string {
  return dataISO.split('-').reverse().join('/');
}

export function aplicarRegraPrazo(rp: Rp, corteISO: string): Rp {
  const primeira = rp.linhas.reduce<string | null>(
    (minima, linha) => (!minima || linha.de < minima ? linha.de : minima),
    null
  );
  if (!primeira) {
    return rp;
  }

  const algumaVencida = rp.linhas.some((linha) => linha.de <= corteISO);
  if (!algumaVencida) {
    return rp;
  }

  const motivo =
    'Datas de exibição a partir de ' +
    formatarDataBR(primeira) +
    ' — precisa ser posterior a ' +
    formatarDataBR(corteISO);

  return {
    ...rp,
    motivos: [...rp.motivos, motivo],
    elegivel: false,
  };
}
