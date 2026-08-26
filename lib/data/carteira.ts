export type Papel = 'executivo' | 'gerente';

export interface ExecutivoCarteira {
  nome: string;
  email: string;
  papel: Papel;
  executivoRaw: string | null;
}

const CARTEIRA: ExecutivoCarteira[] = [
  {
    nome: 'Milena Dabul Stork',
    email: 'milena.dabul@empresa.com.br',
    papel: 'executivo',
    executivoRaw: 'Milena Dabul Stork(N)',
  },
  {
    nome: 'Fábio Couto',
    email: 'fabio.couto@empresa.com.br',
    papel: 'executivo',
    executivoRaw: 'Fabio Couto (MV)',
  },
  {
    nome: 'Karina Martinelli',
    email: 'karina.martinelli@empresa.com.br',
    papel: 'executivo',
    executivoRaw: 'Karina Martinelli',
  },
  {
    nome: 'Gerência Comercial',
    email: 'gerente@empresa.com.br',
    papel: 'gerente',
    executivoRaw: null,
  },
];

export function buscarExecutivoPorEmail(email: string): ExecutivoCarteira | undefined {
  const alvo = email.toLowerCase();
  return CARTEIRA.find((e) => e.email.toLowerCase() === alvo);
}

export function listarCarteira(): ExecutivoCarteira[] {
  return [...CARTEIRA];
}

export function autenticar(email: string, senha: string): ExecutivoCarteira | null {
  const senhaLimpa = senha.trim();
  if (!senhaLimpa) return null;
  return buscarExecutivoPorEmail(email) ?? null;
}
