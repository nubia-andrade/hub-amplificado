export type Papel = 'executivo' | 'gerente';

export interface ExecutivoCarteira {
  nome: string;
  email: string;
  papel: Papel;
}

const CARTEIRA: ExecutivoCarteira[] = [
  { nome: 'Milena Dabul Stork', email: 'milena.dabul@empresa.com.br', papel: 'executivo' },
  { nome: 'Fabio Couto', email: 'fabio.couto@empresa.com.br', papel: 'executivo' },
  { nome: 'Karina Martinelli', email: 'karina.martinelli@empresa.com.br', papel: 'executivo' },
  { nome: 'Gerencia Comercial', email: 'gerente@empresa.com.br', papel: 'gerente' },
];

export function buscarExecutivoPorEmail(email: string): ExecutivoCarteira | undefined {
  const alvo = email.toLowerCase();
  return CARTEIRA.find((e) => e.email.toLowerCase() === alvo);
}

export function autenticar(email: string, senha: string): ExecutivoCarteira | null {
  if (!senha) return null;
  return buscarExecutivoPorEmail(email) ?? null;
}
