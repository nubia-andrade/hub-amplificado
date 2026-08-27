import type { RpComStatus } from '@/lib/rps/rpComStatus';
import { formatarMoeda } from '@/lib/rps/formato';

interface ResumoConsolidadoProps {
  rps: RpComStatus[];
}

export function ResumoConsolidado({ rps }: ResumoConsolidadoProps) {
  const totalTabela = rps.reduce((soma, rp) => soma + rp.valorTabela, 0);
  const totalDatas = rps.reduce((soma, rp) => soma + rp.nDatas, 0);
  const anunciantesDistintos = [...new Set(rps.map((rp) => rp.anunciante))];

  const linhas = rps.flatMap((rp) => rp.linhas.map((linha) => ({ rp: rp.rp, linha })));

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--cor-rps-borda)',
        borderRadius: 'var(--raio-rps-card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', padding: '16px 18px 14px', background: 'var(--cor-rps-ink)', color: '#ffffff' }}>
        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--gradiente-marca)' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{rps.length} RPs selecionadas</span>
          <span
            style={{
              fontFamily: 'var(--fonte-rps-mono)',
              fontSize: 10,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: 'var(--cor-rps-marca-suave)',
            }}
          >
            Proposta
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
          {anunciantesDistintos.map((anunciante) => (
            <span
              key={anunciante}
              style={{
                fontFamily: 'var(--fonte-rps-mono)',
                fontSize: 10.5,
                padding: '3px 8px',
                borderRadius: 'var(--raio-rps-chip)',
                background: 'var(--cor-rps-ink-chip)',
                color: 'var(--cor-rps-ink-tinta-1)',
              }}
            >
              {anunciante}
            </span>
          ))}
          <span style={{ fontSize: 11.5, color: 'var(--cor-rps-ink-tinta-3)' }}>{totalDatas.toLocaleString('pt-BR')} datas de exibição</span>
        </div>
      </div>

      <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--cor-rps-borda-interna)' }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--fonte-rps-mono)',
            fontSize: 9.5,
            textTransform: 'uppercase',
            color: 'var(--cor-rps-tinta-secundaria)',
          }}
        >
          Total de tabela
        </p>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-.7px', fontVariantNumeric: 'tabular-nums' }}>
          {formatarMoeda(totalTabela)}
        </p>
      </div>

      <div style={{ padding: '12px 18px 4px', display: 'flex', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--fonte-rps-mono)',
            fontSize: 9.5,
            textTransform: 'uppercase',
            color: 'var(--cor-rps-tinta-secundaria)',
          }}
        >
          Linhas por RP
        </span>
        <span style={{ fontFamily: 'var(--fonte-rps-mono)', fontSize: 9.5, color: 'var(--cor-rps-tinta-terciaria)' }}>
          unitário × datas
        </span>
      </div>

      <div style={{ maxHeight: 420, overflow: 'auto', padding: '6px 6px 10px' }}>
        {linhas.map(({ rp, linha }, indice) => (
          <div
            key={`${rp}-${indice}`}
            className="item-linha-proposta"
            style={{
              display: 'grid',
              gridTemplateColumns: '56px minmax(0,1fr) 62px 96px',
              gap: 6,
              padding: '9px 12px',
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: 'var(--fonte-rps-mono)', fontSize: 11, color: 'var(--cor-rps-tinta-secundaria)' }}>
              {rp}
            </span>
            <span
              style={{
                fontSize: 12.5,
                color: 'var(--cor-rps-tinta-principal)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {linha.programa}{' '}
              <span style={{ fontFamily: 'var(--fonte-rps-mono)', fontSize: 9.5, color: 'var(--cor-rps-tinta-terciaria)' }}>
                {linha.chave}
              </span>
            </span>
            <span
              style={{
                fontFamily: 'var(--fonte-rps-mono)',
                fontSize: 11,
                color: 'var(--cor-rps-tinta-corpo)',
                textAlign: 'right',
              }}
            >
              {linha.secund}″ {linha.nDatas}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 500, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
              {linha.total !== null ? formatarMoeda(linha.total) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
