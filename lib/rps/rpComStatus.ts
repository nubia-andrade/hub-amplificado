import type { Rp } from '@/lib/data/rp';

export type StatusComercial = 'Disponível' | 'Em negociação' | 'Fechada Ganha' | 'Negócio Perdido';

export interface RpComStatus extends Rp {
  status: StatusComercial;
}

export function paraRpComStatus(rp: Rp): RpComStatus {
  return { ...rp, status: 'Disponível' };
}
