'use server';

import { redirect } from 'next/navigation';
import { autenticar } from '@/lib/data/carteira';
import { criarSessao } from '@/lib/auth/session';

export interface EstadoLogin {
  erro?: string;
}

export async function entrar(_estado: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = String(formData.get('email') ?? '').trim();
  const senha = String(formData.get('senha') ?? '');

  const executivo = autenticar(email, senha);
  if (!executivo) {
    return { erro: 'E-mail ou senha inválidos.' };
  }

  await criarSessao(executivo);
  redirect('/rps');
}
