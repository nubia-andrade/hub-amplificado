import type { RpComStatus } from '@/lib/rps/rpComStatus';
import { formatarMoeda } from '@/lib/rps/formato';

interface ResumoConsolidadoProps {
  rps: RpComStatus[];
}

const RODAPE_LABEL: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  color: 'var(--cor-tinta-terciaria)',
  margin: '0 0 4px',
};

export function ResumoConsolidado({ rps }: ResumoConsolidadoProps) {
  const totalTabela = rps.reduce((soma, rp) => soma + rp.valorTabela, 0);
  const totalDatas = rps.reduce((soma, rp) => soma + rp.nDatas, 0);
  const anunciantesDistintos = [...new Set(rps.map((rp) => rp.anunciante))];

  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>{rps.length} RPs selecionadas</h2>
      <p style={{ fontSize: 12.5, color: 'var(--cor-tinta-secundaria)', margin: '0 0 14px' }}>
        {anunciantesDistintos.length === 1 ? anunciantesDistintos[0] : `${anunciantesDistintos.length} clientes distintos`}
      </p>

      <p style={RODAPE_LABEL}>Linhas por RP · unitário × datas</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, marginBottom: 10 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--cor-tinta-terciaria)', fontSize: 9.5, textTransform: 'uppercase' }}>
            <th style={{ fontWeight: 600, paddingBottom: 4 }}>RP</th>
            <th style={{ fontWeight: 600, paddingBottom: 4 }}>Programa</th>
            <th style={{ fontWeight: 600, paddingBottom: 4 }}>Seg</th>
            <th style={{ fontWeight: 600, paddingBottom: 4 }}>Dt</th>
            <th style={{ fontWeight: 600, paddingBottom: 4, textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rps.flatMap((rp) =>
            rp.linhas.map((linha, indice) => (
              <tr key={`${rp.rp}-${indice}`} style={{ borderTop: '1px solid var(--cor-borda-sutil)' }}>
                <td style={{ padding: '6px 0', fontWeight: 600 }}>{rp.rp}</td>
                <td style={{ padding: '6px 0' }}>
                  {linha.programa}{' '}
                  <span style={{ fontSize: 10, color: 'var(--cor-tinta-terciaria)' }}>{linha.chave}</span>
                </td>
                <td style={{ padding: '6px 0' }}>{linha.secund}″</td>
                <td style={{ padding: '6px 0' }}>{linha.nDatas}</td>
                <td style={{ padding: '6px 0', textAlign: 'right' }}>
                  {linha.total !== null ? formatarMoeda(linha.total) : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
        <span>Total de tabela</span>
        <span>{formatarMoeda(totalTabela)}</span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--cor-tinta-terciaria)' }}>
        {totalDatas} datas de exibição no total
      </p>
    </div>
  );
}
