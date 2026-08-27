'use client';

export default function ErroMinhasRps({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          textAlign: 'center',
          background: '#ffffff',
          border: '1px solid var(--cor-rps-borda)',
          borderRadius: 'var(--raio-rps-card)',
          padding: 28,
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--cor-rps-tinta-principal)', margin: '0 0 6px' }}>
          Não foi possível carregar suas RPs
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--cor-rps-tinta-secundaria)', margin: '0 0 18px' }}>
          {error.message || 'Ocorreu um erro inesperado ao buscar sua carteira.'}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            height: 38,
            padding: '0 20px',
            border: 'none',
            borderRadius: 'var(--raio-rps-botao)',
            background: 'var(--cor-marca)',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
