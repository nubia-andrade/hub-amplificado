import type { StatusComercial } from '@/lib/rps/rpComStatus';

interface BadgeStatusProps {
  status: StatusComercial;
  elegivel: boolean;
  motivos?: string[];
}

const CORES: Record<StatusComercial | 'Não elegível', { texto: string; fundo: string; borda: string }> = {
  Disponível: {
    texto: 'var(--cor-sucesso-texto)',
    fundo: 'var(--cor-sucesso-fundo)',
    borda: 'var(--cor-sucesso-borda)',
  },
  'Em negociação': {
    texto: 'var(--cor-neutro-texto)',
    fundo: 'var(--cor-neutro-fundo)',
    borda: 'var(--cor-neutro-borda)',
  },
  'Fechada Ganha': {
    texto: 'var(--cor-sucesso-texto)',
    fundo: 'var(--cor-sucesso-fundo)',
    borda: 'var(--cor-sucesso-borda)',
  },
  'Negócio Perdido': {
    texto: 'var(--cor-erro-texto)',
    fundo: 'var(--cor-erro-fundo)',
    borda: 'var(--cor-erro-borda)',
  },
  'Não elegível': {
    texto: 'var(--cor-esgotado-texto)',
    fundo: 'var(--cor-esgotado-fundo)',
    borda: 'var(--cor-esgotado-borda)',
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
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 'var(--raio-badge)',
        color: cor.texto,
        background: cor.fundo,
        border: `1px solid ${cor.borda}`,
        whiteSpace: 'nowrap',
        cursor: titulo ? 'help' : undefined,
      }}
    >
      {rotulo}
    </span>
  );
}
