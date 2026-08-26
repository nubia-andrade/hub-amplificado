import type { Rp } from './rp';
import { carregarCaData } from './dadosMock';

export interface RepositorioRps {
  listarRps(): Rp[];
}

export function criarRepositorioMock(): RepositorioRps {
  return {
    listarRps() {
      return carregarCaData().rps;
    },
  };
}
