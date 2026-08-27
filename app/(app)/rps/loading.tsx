function LinhaEsqueleto() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 92px minmax(160px,1fr) 66px 128px 156px 118px',
        height: 52,
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid var(--cor-rps-borda-sutil)',
      }}
    >
      {Array.from({ length: 7 }).map((_, indice) => (
        <span
          key={indice}
          style={{
            height: 12,
            width: indice === 2 ? '70%' : '50%',
            borderRadius: 4,
            background: 'var(--cor-rps-borda-sutil)',
          }}
        />
      ))}
    </div>
  );
}

export default function CarregandoMinhasRps() {
  return (
    <div style={{ background: 'var(--cor-rps-pagina)', minHeight: 'calc(100vh - 60px)', padding: '20px 24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: 1,
          background: 'var(--cor-rps-borda)',
          border: '1px solid var(--cor-rps-borda)',
          borderRadius: 'var(--raio-rps-card)',
          overflow: 'hidden',
          marginBottom: 14,
        }}
      >
        {Array.from({ length: 4 }).map((_, indice) => (
          <div key={indice} style={{ background: '#ffffff', padding: '15px 18px 14px' }}>
            <span style={{ display: 'block', height: 10, width: 80, borderRadius: 4, background: 'var(--cor-rps-borda-sutil)', marginBottom: 8 }} />
            <span style={{ display: 'block', height: 20, width: 100, borderRadius: 4, background: 'var(--cor-rps-borda-sutil)' }} />
          </div>
        ))}
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--cor-rps-borda)', borderRadius: 'var(--raio-rps-card)', overflow: 'hidden' }}>
        {Array.from({ length: 8 }).map((_, indice) => (
          <LinhaEsqueleto key={indice} />
        ))}
      </div>
    </div>
  );
}
