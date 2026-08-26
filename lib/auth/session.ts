import { cookies } from 'next/headers';
import type { ExecutivoCarteira, Papel } from '@/lib/data/carteira';
import { NOME_COOKIE_SESSAO } from './constants';

export interface Sessao {
  nome: string;
  email: string;
  papel: Papel;
}

export async function criarSessao(executivo: ExecutivoCarteira): Promise<void> {
  const sessao: Sessao = { nome: executivo.nome, email: executivo.email, papel: executivo.papel };
  (await cookies()).set(NOME_COOKIE_SESSAO, JSON.stringify(sessao), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

export async function lerSessao(): Promise<Sessao | null> {
  const valor = (await cookies()).get(NOME_COOKIE_SESSAO)?.value;
  if (!valor) return null;
  try {
    return JSON.parse(valor) as Sessao;
  } catch {
    return null;
  }
}

export async function encerrarSessao(): Promise<void> {
  (await cookies()).delete(NOME_COOKIE_SESSAO);
}
