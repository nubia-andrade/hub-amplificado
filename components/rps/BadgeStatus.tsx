import type { StatusComercial } from '@/lib/rps/rpComStatus';

interface BadgeStatusProps {
  status: StatusComercial;
  elegivel: boolean;
  motivos?: string[];
}

const CORES: Record<StatusComercial | 'Não elegível', { texto: string; fundo: string; borda: string; ponto: string }> = {
  Disponível: {
    texto: 'var(--cor-rps-disponivel-texto)',
    fundo: 'var(--cor-rps-disponivel-fundo)',
    borda: 'var(--cor-rps-disponivel-borda)',
    ponto: 'var(--cor-rps-disponivel-base)',
  },
  'Em negociação': {
    texto: 'var(--cor-neutro-texto)',
    fundo: 'var(--cor-neutro-fundo)',
    borda: 'var(--cor-neutro-borda)',
    ponto: 'var(--cor-neutro-borda)',
  },
  'Fechada Ganha': {
    texto: 'var(--cor-rps-disponivel-texto)',
    fundo: 'var(--cor-rps-disponivel-fundo)',
    borda: 'var(--cor-rps-disponivel-borda)',
    ponto: 'var(--cor-rps-disponivel-base)',
  },
  'Negócio Perdido': {
    texto: 'var(--cor-erro-texto)',
    fundo: 'var(--cor-erro-fundo)',
    borda: 'var(--cor-erro-borda)',
    ponto: 'var(--cor-erro-borda)',
  },
  'Não elegível': {
    texto: 'var(--cor-rps-nao-elegivel-texto)',
    fundo: 'var(--cor-rps-nao-elegivel-fundo)',
    borda: 'var(--cor-rps-nao-elegivel-borda)',
    ponto: 'var(--cor-rps-nao-elegivel-ponto)',
  },
};

export function BadgeStatus({ status, elegivel, motivos }: BadgeStatusProps) {
  const rotulo = elegivel ? status : 'Não elegível';
  const cor = CORES[rotulo];
  const titulo = !elegivel && motivos && motivos.length > 0 ? motivos.join('; ') : undefined;

  return (
    <span
      title={titulo}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        padding: '4px 10px 4px 8px',
        borderRadius: 'var(--raio-badge)',
        color: cor.texto,
        background: cor.fundo,
        border: `1px solid ${cor.borda}`,
        whiteSpace: 'nowrap',
        cursor: titulo ? 'help' : undefined,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cor.ponto, flexShrink: 0 }} />
      {rotulo}
    </span>
  );
}
