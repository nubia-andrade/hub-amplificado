import { formatarMoeda } from '@/lib/rps/formato';

interface FaixaKpisProps {
  carteiraTotal: number;
  disponiveisContagem: number;
  tabelaDisponivel: number;
  selecionadoTotal: number;
}

function CardKpi({
  rotulo,
  valor,
  sufixo,
  corValor,
}: {
  rotulo: string;
  valor: string;
  sufixo?: string;
  corValor?: string;
}) {
  return (
    <div style={{ background: 'var(--cor-superficie)', padding: '15px 18px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--fonte-rps-mono)',
          fontSize: 9.5,
          letterSpacing: '.13em',
          textTransform: 'uppercase',
          color: 'var(--cor-rps-tinta-secundaria)',
        }}
      >
        {rotulo}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 23,
          fontWeight: 600,
          letterSpacing: '-.6px',
          fontVariantNumeric: 'tabular-nums',
          color: corValor ?? 'var(--cor-rps-tinta-principal)',
        }}
      >
        {valor}
        {sufixo && (
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--cor-rps-tinta-secundaria)', marginLeft: 4 }}>
            {sufixo}
          </span>
        )}
      </p>
    </div>
  );
}

export function FaixaKpis({ carteiraTotal, disponiveisContagem, tabelaDisponivel, selecionadoTotal }: FaixaKpisProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        gap: 1,
        background: 'var(--cor-rps-borda)',
        border: '1px solid var(--cor-rps-borda)',
        borderRadius: 'var(--raio-rps-card)',
        overflow: 'hidden',
      }}
    >
      <CardKpi rotulo="Carteira" valor={String(carteiraTotal)} sufixo="RPs" />
      <CardKpi
        rotulo="Disponíveis"
        valor={String(disponiveisContagem)}
        sufixo={`de ${carteiraTotal}`}
        corValor="var(--cor-rps-disponivel-base)"
      />
      <CardKpi rotulo="Tabela disponível" valor={formatarMoeda(tabelaDisponivel)} />
      <CardKpi rotulo="Selecionado" valor={formatarMoeda(selecionadoTotal)} />
    </div>
  );
}
