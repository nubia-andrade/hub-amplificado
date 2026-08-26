const NOMES_AGENCIA = ['WMcCann', 'Ogilvy Brasil', 'DPZ&T', 'Africa Criação', 'AlmapBBDO'];

/**
 * Mock determinístico de agência por RP, até a base trazer uma coluna
 * real de Agência. ~30% das RPs recebem uma agência; as demais, null.
 */
export function obterAgenciaMock(rpId: string): string | null {
  const hash = [...rpId].reduce((soma, caractere) => soma + caractere.charCodeAt(0), 0);
  if (hash % 10 < 3) {
    return NOMES_AGENCIA[hash % NOMES_AGENCIA.length];
  }
  return null;
}
