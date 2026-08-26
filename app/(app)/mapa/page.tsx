import { redirect } from 'next/navigation';
import { lerSessao } from '@/lib/auth/session';
import { criarRepositorioMock } from '@/lib/data/repositorioRps';
import { listarRpsComElegibilidade } from '@/lib/regras/motor';
import { paraRpComStatus } from '@/lib/rps/rpComStatus';
import { minhasRps } from '@/lib/rps/regrasLista';
import { criarRepositorioDatasExibicaoMock } from '@/lib/data/datasExibicao';
import { MapaInsercao } from '@/components/mapa/MapaInsercao';

const MARGEM_DIAS_UTEIS = 2;

export default async function MapaDeInsercaoPage() {
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

  const repositorioDatas = criarRepositorioDatasExibicaoMock();
  const datasExibicao = repositorioDatas.listarDatasExibicao();

  return <MapaInsercao rps={rps} datasExibicao={datasExibicao} />;
}
