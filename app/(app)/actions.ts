'use server';

import { redirect } from 'next/navigation';
import { encerrarSessao } from '@/lib/auth/session';

export async function sair() {
  await encerrarSessao();
  redirect('/login');
}
