import { redirect } from 'next/navigation';
import { lerSessao } from '@/lib/auth/session';

export default async function MinhasRPsPage() {
  const sessao = await lerSessao();
  if (!sessao) {
    redirect('/login');
  }

  return (
    <main style={{ padding: 24 }}>
      <p>
        Bem-vindo, {sessao?.nome} ({sessao?.papel}).
      </p>
    </main>
  );
}
