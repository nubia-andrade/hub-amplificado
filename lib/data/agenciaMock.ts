const NOMES_AGENCIA = ['WMcCann', 'Ogilvy Brasil', 'DPZ&T', 'Africa Criação', 'AlmapBBDO'];

/**
 * Mock determinístico de agência por cliente, até a base trazer uma coluna
 * real de Agência. ~30% dos clientes recebem uma agência; os demais, null.
 */
export function obterAgenciaMock(chave: string): string | null {
  const hash = [...chave].reduce((soma, caractere) => soma + caractere.charCodeAt(0), 0);
  if (hash % 10 < 3) {
    return NOMES_AGENCIA[hash % NOMES_AGENCIA.length];
  }
  return null;
}
