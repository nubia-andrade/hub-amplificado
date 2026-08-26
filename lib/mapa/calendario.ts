import type { DataExibicao } from '@/lib/data/datasExibicao';
import type { RpComStatus } from '@/lib/rps/rpComStatus';

export interface EntradaDia {
  sigla: string;
  elegivel: boolean;
}

export type MapaPorDia = Record<string, EntradaDia[]>;

export function agruparDatasPorDia(rps: RpComStatus[], datasExibicao: DataExibicao[]): MapaPorDia {
  const elegibilidadePorRp = new Map(rps.map((rp) => [rp.rp, rp.elegivel]));
  const mapa: MapaPorDia = {};

  for (const registro of datasExibicao) {
    const elegivel = elegibilidadePorRp.get(registro.rp);
    if (elegivel === undefined) {
      continue;
    }

    const entradas = mapa[registro.data] ?? (mapa[registro.data] = []);
    const existente = entradas.find((entrada) => entrada.sigla === registro.sigla);
    if (existente) {
      existente.elegivel = existente.elegivel && elegivel;
    } else {
      entradas.push({ sigla: registro.sigla, elegivel });
    }
  }

  for (const dia of Object.keys(mapa)) {
    mapa[dia].sort((a, b) => {
      if (a.elegivel !== b.elegivel) {
        return a.elegivel ? -1 : 1;
      }
      return a.sigla.localeCompare(b.sigla, 'pt-BR');
    });
  }

  return mapa;
}

export interface MesAno {
  ano: number;
  mes: number;
}

export function primeiroMesComDatas(rps: RpComStatus[], datasExibicao: DataExibicao[]): MesAno | null {
  const rpIds = new Set(rps.map((rp) => rp.rp));
  const datas = datasExibicao.filter((registro) => rpIds.has(registro.rp)).map((registro) => registro.data);

  if (datas.length === 0) {
    return null;
  }

  const primeira = [...datas].sort()[0];
  const [ano, mes] = primeira.split('-');
  return { ano: Number(ano), mes: Number(mes) };
}

export function ultimoMesComDatas(rps: RpComStatus[], datasExibicao: DataExibicao[]): MesAno | null {
  const rpIds = new Set(rps.map((rp) => rp.rp));
  const datas = datasExibicao.filter((registro) => rpIds.has(registro.rp)).map((registro) => registro.data);

  if (datas.length === 0) {
    return null;
  }

  const ultima = [...datas].sort().at(-1)!;
  const [ano, mes] = ultima.split('-');
  return { ano: Number(ano), mes: Number(mes) };
}

export function construirGradeDoMes(ano: number, mes: number): (string | null)[][] {
  const primeiroDia = new Date(Date.UTC(ano, mes - 1, 1));
  const diaDaSemanaInicio = primeiroDia.getUTCDay();
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();

  const celulas: (string | null)[] = [];
  for (let i = 0; i < diaDaSemanaInicio; i++) {
    celulas.push(null);
  }
  for (let dia = 1; dia <= diasNoMes; dia++) {
    celulas.push(`${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`);
  }
  while (celulas.length % 7 !== 0) {
    celulas.push(null);
  }

  const semanas: (string | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) {
    semanas.push(celulas.slice(i, i + 7));
  }
  return semanas;
}
