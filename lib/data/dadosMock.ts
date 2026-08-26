import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Rp } from './rp';

interface CaData {
  rps: Rp[];
  executivos: (string | null)[];
  mult: Record<string, number>;
  excecoes: string[];
}

let cache: CaData | null = null;

export function carregarCaData(): CaData {
  if (cache) {
    return cache;
  }

  const caminho = join(process.cwd(), 'dados.js');
  const conteudo = readFileSync(caminho, 'utf-8');
  const casamento = conteudo.match(/^window\.CA_DATA=(\{.*\});?\s*$/s);
  if (!casamento) {
    throw new Error('dados.js não está no formato esperado (window.CA_DATA={...};)');
  }

  cache = JSON.parse(casamento[1]) as CaData;
  return cache;
}
