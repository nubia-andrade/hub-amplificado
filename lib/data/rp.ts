export interface LinhaRp {
  sigla: string;
  exib: string;
  chave: string;
  programa: string;
  modalidade: string;
  titulo?: string;
  secund: number;
  mult: number | null;
  precoBase: number | null;
  unit: number | null;
  nDatas: number;
  total: number | null;
  motivos: string[];
  de: string;
  ate: string;
}

export interface Rp {
  rp: string;
  anunciante: string;
  cnpj: string;
  executivo: string;
  setor: string;
  exib: string;
  portfolio: string;
  cm: string;
  linhas: LinhaRp[];
  nDatas: number;
  elegivel: boolean;
  motivos: string[];
  valorTabela: number;
}
