import { redirect } from 'next/navigation';
import { lerSessao } from '@/lib/auth/session';
import { AbasPrincipais } from '@/components/nav/AbasPrincipais';
import { sair } from './actions';

function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

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
          zIndex: 30,
          height: 60,
          background: 'var(--cor-rps-ink)',
          color: '#ffffff',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <strong style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px', lineHeight: 1 }}>
              Hub Amplificado
            </strong>
            <span style={{ width: 64, height: 4, borderRadius: 2, background: 'var(--gradiente-marca)' }} />
          </div>
          <AbasPrincipais />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
          <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{sessao.nome}</div>
            <div style={{ fontSize: 11, color: 'var(--cor-rps-ink-tinta-3)' }}>
              {sessao.papel === 'gerente' ? 'Gerente · visão de equipe' : 'Executivo comercial'}
            </div>
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--cor-rps-ink-avatar)',
              color: 'var(--cor-rps-ink-tinta-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11.5,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {obterIniciais(sessao.nome)}
          </div>
          <form action={sair}>
            <button
              type="submit"
              className="link-sair"
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--cor-rps-ink-tinta-3)',
                fontSize: 12,
                cursor: 'pointer',
                paddingLeft: 12,
                borderLeft: '1px solid var(--cor-rps-ink-avatar)',
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
