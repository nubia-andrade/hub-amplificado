import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';

// Usa fs/path (Node) e a biblioteca xlsx — nunca importar este módulo a partir de um componente 'use client'.

const NORMALIZACAO_PRACA: Record<string, string> = {
  SP: 'SP1',
};

function normalizarPraca(praca: string): string {
  return NORMALIZACAO_PRACA[praca] ?? praca;
}

function extrairLinhasDaAba(linhas: unknown[][]): Array<{ sigla: string; praca: string; propostaCa: number }> {
  const indiceCabecalho = linhas.findIndex((linha) => linha[0] === 'PGM');
  if (indiceCabecalho === -1) {
    return [];
  }

  return linhas
    .slice(indiceCabecalho + 1)
    .filter((linha): linha is unknown[] => typeof linha[0] === 'string' && linha[0].trim() !== '')
    .map((linha) => ({
      sigla: String(linha[0]),
      praca: normalizarPraca(String(linha[2])),
      propostaCa: Number(String(linha[6]).replace(/,/g, '')),
    }));
}

let cache: Record<string, number> | null = null;

export function obterPropostaCaPorChave(): Record<string, number> {
  if (cache) {
    return cache;
  }

  const caminho = join(process.cwd(), 'fontes', 'Tabela de Precos Comercial Amplificado.xlsx');
  const buffer = readFileSync(caminho);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const linhasBase = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets['Base'], { header: 1, raw: false });
  const linhasRegional = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets['Regional'], { header: 1, raw: false });

  const registros = [...extrairLinhasDaAba(linhasBase), ...extrairLinhasDaAba(linhasRegional)];

  cache = {};
  for (const registro of registros) {
    cache[`${registro.sigla}_${registro.praca}`] = registro.propostaCa;
  }
  return cache;
}
