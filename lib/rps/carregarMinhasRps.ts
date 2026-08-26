import { redirect } from 'next/navigation';
import { lerSessao, type Sessao } from '@/lib/auth/session';
import { criarRepositorioMock } from '@/lib/data/repositorioRps';
import { listarRpsComElegibilidade } from '@/lib/regras/motor';
import { paraRpComStatus } from './rpComStatus';
import type { RpComStatus } from './rpComStatus';
import { minhasRps } from './regrasLista';

const MARGEM_DIAS_UTEIS = 2;

export async function carregarMinhasRps(): Promise<{ sessao: Sessao; rps: RpComStatus[] }> {
  const sessao = await lerSessao();
  // Redundante com o guard do layout, mas necessário para o TypeScript estreitar
  // `sessao` para não-nulo abaixo (papel/executivoRaw são usados logo em seguida).
  if (!sessao) {
    redirect('/login');
  }

  const repositorio = criarRepositorioMock();
  const rpsComElegibilidade = listarRpsComElegibilidade(repositorio, new Date(), MARGEM_DIAS_UTEIS);
  const rpsComStatus = rpsComElegibilidade.map(paraRpComStatus);
  const rps = minhasRps(rpsComStatus, sessao.papel, sessao.executivoRaw);

  return { sessao, rps };
}
