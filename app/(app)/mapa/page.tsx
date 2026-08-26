import { carregarMinhasRps } from '@/lib/rps/carregarMinhasRps';
import { criarRepositorioDatasExibicaoMock } from '@/lib/data/datasExibicao';
import { MapaInsercao } from '@/components/mapa/MapaInsercao';

export default async function MapaDeInsercaoPage() {
  const { rps } = await carregarMinhasRps();

  const repositorioDatas = criarRepositorioDatasExibicaoMock();
  const idsEscopados = new Set(rps.map((rp) => rp.rp));
  const datasExibicao = repositorioDatas
    .listarDatasExibicao()
    .filter((registro) => idsEscopados.has(registro.rp));

  return <MapaInsercao rps={rps} datasExibicao={datasExibicao} />;
}
