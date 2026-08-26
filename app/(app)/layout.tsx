import { redirect } from 'next/navigation';
import { lerSessao } from '@/lib/auth/session';
import { sair } from './actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao();

  if (!sessao) {
    redirect('/login');
  }

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: 'var(--cor-superficie)',
          borderBottom: '1px solid var(--cor-borda)',
          padding: '11px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <strong style={{ fontSize: 13, fontWeight: 700, color: '#101820' }}>
            Hub Amplificado
          </strong>
          <span
            style={{
              background: 'var(--gradiente-marca)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 'var(--raio-botao)',
              fontSize: 12,
              fontWeight: 700,
              boxShadow: 'var(--sombra-botao)',
            }}
          >
            Minhas RPs
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{sessao.nome}</div>
            <div style={{ fontSize: 11, color: 'var(--cor-tinta-secundaria)' }}>
              {sessao.papel === 'gerente' ? 'Gerente · visão de equipe' : 'Executivo comercial'}
            </div>
          </div>
          <form action={sair}>
            <button
              type="submit"
              style={{
                border: '1px solid var(--cor-borda)',
                background: 'transparent',
                borderRadius: 'var(--raio-input)',
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
