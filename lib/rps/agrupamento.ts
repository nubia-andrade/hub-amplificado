import type { RpComStatus } from './rpComStatus';
import { chaveMesDaRp, rotuloMes } from './formato';

export interface GrupoMes {
  chave: string;
  rotulo: string;
  rps: RpComStatus[];
  totalTabela: number | null;
}

export function agruparRpsPorMes(rps: RpComStatus[]): GrupoMes[] {
  const porChave = new Map<string, RpComStatus[]>();

  for (const rp of rps) {
    const chave = chaveMesDaRp(rp);
    const lista = porChave.get(chave) ?? [];
    lista.push(rp);
    porChave.set(chave, lista);
  }

  return [...porChave.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, rpsDoGrupo]) => {
      const elegiveisDoGrupo = rpsDoGrupo.filter((rp) => rp.elegivel);
      return {
        chave,
        rotulo: rotuloMes(chave),
        rps: rpsDoGrupo,
        totalTabela:
          elegiveisDoGrupo.length === 0
            ? null
            : elegiveisDoGrupo.reduce((soma, rp) => soma + rp.valorTabela, 0),
      };
    });
}
