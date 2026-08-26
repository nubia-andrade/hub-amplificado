import type { Rp } from '@/lib/data/rp';
import type { RepositorioRps } from '@/lib/data/repositorioRps';
import { aplicarRegraPrazo, calcularDataCorte, formatarDataISO } from './elegibilidade';

export function listarRpsComElegibilidade(
  repositorio: RepositorioRps,
  hoje: Date,
  margemDiasUteis: number
): Rp[] {
  const corteISO = formatarDataISO(calcularDataCorte(hoje, margemDiasUteis));
  return repositorio.listarRps().map((rp) => aplicarRegraPrazo(rp, corteISO));
}
