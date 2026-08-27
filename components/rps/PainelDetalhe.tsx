import type { RpComStatus } from '@/lib/rps/rpComStatus';
import { formatarMoeda, mesDaRp } from '@/lib/rps/formato';
import { BadgeStatus } from './BadgeStatus';

interface PainelDetalheProps {
  rp: RpComStatus;
}

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--cor-superficie-suave)',
  border: '1px solid var(--cor-borda)',
  borderRadius: 'var(--raio-cartao)',
  padding: 10,
};

const RODAPE_LABEL: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  color: 'var(--cor-tinta-terciaria)',
  margin: '0 0 4px',
};

export function PainelDetalhe({ rp }: PainelDetalheProps) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>RP {rp.rp}</h2>
        <BadgeStatus status={rp.status} elegivel={rp.elegivel} motivos={rp.motivos} />
      </div>
      <p style={{ fontSize: 13, margin: '0 0 2px' }}>{rp.anunciante}</p>
      <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--cor-tinta-secundaria)', margin: '0 0 14px' }}>
        {rp.cnpj}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div style={CARD_STYLE}>
          <p style={RODAPE_LABEL}>Praça</p>
          <p style={{ fontSize: 12.5, margin: 0 }}>{rp.exib}</p>
        </div>
        <div style={CARD_STYLE}>
          <p style={RODAPE_LABEL}>Mês</p>
          <p style={{ fontSize: 12.5, margin: 0 }}>{mesDaRp(rp)}</p>
        </div>
        <div style={CARD_STYLE}>
          <p style={RODAPE_LABEL}>Portfólio</p>
          <p style={{ fontSize: 12.5, margin: 0 }}>{rp.portfolio}</p>
        </div>
        <div style={CARD_STYLE}>
          <p style={RODAPE_LABEL}>Executivo</p>
          <p style={{ fontSize: 12.5, margin: 0 }}>{rp.executivo}</p>
        </div>
        <div style={CARD_STYLE}>
          <p style={RODAPE_LABEL}>Setor</p>
          <p style={{ fontSize: 12.5, margin: 0 }}>{rp.setor}</p>
        </div>
      </div>

      {!rp.elegivel && (
        <div
          style={{
            border: '1px solid var(--cor-erro-borda)',
            background: 'var(--cor-erro-fundo)',
            borderRadius: 'var(--raio-cartao)',
            padding: 10,
            marginBottom: 14,
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--cor-erro-texto)', margin: '0 0 6px' }}>
            Não elegível
          </p>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: 'var(--cor-erro-texto)' }}>
            {rp.motivos.map((motivo, indice) => (
              <li key={indice}>{motivo}</li>
            ))}
          </ul>
        </div>
      )}

      <p style={RODAPE_LABEL}>Linhas · unitário × datas</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, marginBottom: 10 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--cor-tinta-terciaria)', fontSize: 9.5, textTransform: 'uppercase' }}>
            <th style={{ fontWeight: 600, paddingBottom: 4 }}>Programa</th>
            <th style={{ fontWeight: 600, paddingBottom: 4 }}>Seg</th>
            <th style={{ fontWeight: 600, paddingBottom: 4 }}>Dt</th>
            <th style={{ fontWeight: 600, paddingBottom: 4, textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rp.linhas.map((linha, indice) => (
            <tr key={indice} style={{ borderTop: '1px solid var(--cor-borda-sutil)' }}>
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
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
        <span>Total de tabela</span>
        <span>{rp.elegivel ? formatarMoeda(rp.valorTabela) : '—'}</span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--cor-tinta-terciaria)', marginBottom: 16 }}>
        {rp.nDatas} datas de exibição · {rp.linhas.length} combinações programa/segundagem
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          disabled
          style={{
            flex: 1,
            padding: 9,
            border: '1px solid var(--cor-borda-forte)',
            background: 'transparent',
            borderRadius: 'var(--raio-botao)',
            fontSize: 12,
            fontWeight: 600,
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        >
          Status
        </button>
        <button
          type="button"
          disabled
          style={{
            flex: 1.4,
            padding: 9,
            border: 'none',
            background: rp.elegivel ? 'var(--cor-marca)' : 'var(--cor-desabilitado-fundo)',
            color: rp.elegivel ? 'var(--cor-superficie)' : 'var(--cor-desabilitado-texto)',
            borderRadius: 'var(--raio-botao)',
            fontSize: 12,
            fontWeight: 600,
            opacity: 0.6,
            cursor: 'not-allowed',
          }}
        >
          Gerar proposta
        </button>
      </div>

      <p style={RODAPE_LABEL}>Histórico</p>
      <p style={{ fontSize: 11.5, color: 'var(--cor-tinta-terciaria)' }}>
        Nenhum evento registrado ainda — a atualização de status entra na Fase 4.
      </p>
    </div>
  );
}
