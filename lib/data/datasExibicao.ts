import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';

interface LinhaBruta {
  'Data Exib': string;
  Sigla: string;
  RP: string;
  Exib: string;
}

export interface DataExibicao {
  rp: string;
  sigla: string;
  chave: string;
  data: string;
}

let cache: DataExibicao[] | null = null;

function paraIso(dataBr: string): string {
  const [dia, mes, anoCurto] = dataBr.split('/');
  const ano = `20${anoCurto}`;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

export function carregarDatasExibicao(): DataExibicao[] {
  if (cache) {
    return cache;
  }

  const caminho = join(process.cwd(), 'fontes', 'Base Comercial Amplificado.xlsx');
  const buffer = readFileSync(caminho);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const planilha = workbook.Sheets[workbook.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<LinhaBruta>(planilha, { raw: false });

  cache = linhas.map((linha) => ({
    rp: String(linha.RP),
    sigla: linha.Sigla,
    chave: `${linha.Sigla}_${linha.Exib}`,
    data: paraIso(linha['Data Exib']),
  }));

  return cache;
}

export interface RepositorioDatasExibicao {
  listarDatasExibicao(): DataExibicao[];
}

export function criarRepositorioDatasExibicaoMock(): RepositorioDatasExibicao {
  return {
    listarDatasExibicao() {
      return carregarDatasExibicao();
    },
  };
}
