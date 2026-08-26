import { redirect } from 'next/navigation';
import { lerSessao } from '@/lib/auth/session';
import { criarRepositorioMock } from '@/lib/data/repositorioRps';
import { listarRpsComElegibilidade } from '@/lib/regras/motor';
import { paraRpComStatus } from '@/lib/rps/rpComStatus';
import { minhasRps } from '@/lib/rps/regrasLista';
import { ListaRps } from '@/components/rps/ListaRps';

const MARGEM_DIAS_UTEIS = 2;

export default async function MinhasRPsPage() {
  const sessao = await lerSessao();
  if (!sessao) {
    redirect('/login');
  }

  const repositorio = criarRepositorioMock();
  const rpsComElegibilidade = listarRpsComElegibilidade(repositorio, new Date(), MARGEM_DIAS_UTEIS);
  const rpsComStatus = rpsComElegibilidade.map(paraRpComStatus);
  const rps = minhasRps(rpsComStatus, sessao.papel, sessao.executivoRaw);

  return <ListaRps rps={rps} sessao={sessao} />;
}
