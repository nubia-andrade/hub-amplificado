import { carregarMinhasRps } from '@/lib/rps/carregarMinhasRps';
import { ListaRps } from '@/components/rps/ListaRps';

export default async function MinhasRPsPage() {
  const { sessao, rps } = await carregarMinhasRps();
  return <ListaRps rps={rps} sessao={sessao} />;
}
