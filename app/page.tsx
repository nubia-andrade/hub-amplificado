import { redirect } from 'next/navigation';
import { lerSessao } from '@/lib/auth/session';

export default async function RootPage() {
  const sessao = await lerSessao();
  redirect(sessao ? '/rps' : '/login');
}
