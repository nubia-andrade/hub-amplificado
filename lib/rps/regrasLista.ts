import type { Papel } from '@/lib/data/carteira';
import type { RpComStatus, StatusComercial } from './rpComStatus';

export interface FiltrosRps {
  busca: string;
  praca: string;
  status: StatusComercial | '';
  elegibilidade: 'todas' | 'sim' | 'nao';
  executivo: string;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function filtrarRps(rps: RpComStatus[], filtros: FiltrosRps): RpComStatus[] {
  const busca = filtros.busca.trim().toLowerCase();

  return rps.filter((rp) => {
    if (busca) {
      const alvo = normalizar(busca);
      const combina =
        normalizar(rp.rp).includes(alvo) ||
        normalizar(rp.anunciante).includes(alvo) ||
        normalizar(rp.cnpj).includes(alvo);
      if (!combina) {
        return false;
      }
    }
    if (filtros.praca && rp.exib !== filtros.praca) {
      return false;
    }
    if (filtros.status && rp.status !== filtros.status) {
      return false;
    }
    if (filtros.elegibilidade === 'sim' && !rp.elegivel) {
      return false;
    }
    if (filtros.elegibilidade === 'nao' && rp.elegivel) {
      return false;
    }
    if (filtros.executivo && rp.executivo !== filtros.executivo) {
      return false;
    }
    return true;
  });
}

export function minhasRps(
  rps: RpComStatus[],
  papel: Papel,
  executivoRaw: string | null
): RpComStatus[] {
  if (papel === 'gerente') {
    return rps;
  }
  return rps.filter((rp) => rp.executivo === executivoRaw);
}

export function ehSelecionavel(rp: RpComStatus): boolean {
  return rp.elegivel && rp.status === 'Disponível';
}

export function anuncianteDaSelecao(rps: RpComStatus[], selecionadas: string[]): string | null {
  const primeiraSelecionada = rps.find((rp) => selecionadas.includes(rp.rp));
  return primeiraSelecionada?.anunciante ?? null;
}

export function ehSelecionavelParaProposta(rp: RpComStatus, anuncianteSelecao: string | null): boolean {
  return ehSelecionavel(rp) && (anuncianteSelecao === null || rp.anunciante === anuncianteSelecao);
}

export type EstadoSelecaoTodas = 'nenhuma' | 'parcial' | 'todas';

export function estadoSelecaoTodas(
  rps: RpComStatus[],
  selecionadas: string[],
  anuncianteSelecao: string | null = null
): EstadoSelecaoTodas {
  const selecionaveis = rps.filter((rp) => ehSelecionavelParaProposta(rp, anuncianteSelecao));
  if (selecionaveis.length === 0) {
    return 'nenhuma';
  }
  const marcadas = selecionaveis.filter((rp) => selecionadas.includes(rp.rp)).length;
  if (marcadas === 0) {
    return 'nenhuma';
  }
  if (marcadas === selecionaveis.length) {
    return 'todas';
  }
  return 'parcial';
}

export interface ResumoSelecao {
  quantidade: number;
  totalTabela: number;
}

export function resumoSelecao(rps: RpComStatus[], selecionadas: string[]): ResumoSelecao {
  const selecionadasRps = rps.filter((rp) => selecionadas.includes(rp.rp));
  return {
    quantidade: selecionadasRps.length,
    totalTabela: selecionadasRps.reduce((soma, rp) => soma + rp.valorTabela, 0),
  };
}
