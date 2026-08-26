import { lerSessao } from '@/lib/auth/session';

export default async function MinhasRPsPage() {
  const sessao = await lerSessao();

  return (
    <main style={{ padding: 24 }}>
      <p>
        Bem-vindo, {sessao?.nome} ({sessao?.papel}). A listagem de RPs entra na Fase 3.
      </p>
    </main>
  );
}
