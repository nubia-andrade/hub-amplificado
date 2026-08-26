import { lerSessao } from '@/lib/auth/session';
import { sair } from './actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao();

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
          <strong style={{ fontSize: 13 }}>PROPOSTAS · Comercial Amplificado</strong>
          <span
            style={{
              background: 'var(--cor-tinta-principal)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            Minhas RPs
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{sessao?.nome}</div>
            <div style={{ fontSize: 11, color: 'var(--cor-tinta-secundaria)' }}>
              {sessao?.papel === 'gerente' ? 'Gerente · visao de equipe' : 'Executivo comercial'}
            </div>
          </div>
          <form action={sair}>
            <button
              type="submit"
              style={{
                border: '1px solid var(--cor-borda)',
                background: 'transparent',
                borderRadius: 6,
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
