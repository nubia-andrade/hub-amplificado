import { describe, expect, it } from 'vitest';
import { criarRepositorioMock } from '@/lib/data/repositorioRps';
import { listarRpsComElegibilidade } from './motor';

describe('listarRpsComElegibilidade', () => {
  const repositorio = criarRepositorioMock();

  it('não altera a elegibilidade quando o corte de prazo é muito anterior a todas as datas da base (baseline do README: 349 elegíveis)', () => {
    const rps = listarRpsComElegibilidade(repositorio, new Date(2020, 0, 1), 0);
    expect(rps).toHaveLength(408);
    expect(rps.filter((rp) => rp.elegivel)).toHaveLength(349);
  });

  it('mantém a RP 702290 elegível quando o corte de prazo é anterior à sua primeira data de exibição (01/09/2026)', () => {
    const rps = listarRpsComElegibilidade(repositorio, new Date(2020, 0, 1), 0);
    const rp = rps.find((r) => r.rp === '702290');
    expect(rp?.elegivel).toBe(true);
  });

  it('torna a RP 702290 não elegível quando o corte de prazo é posterior à sua primeira data de exibição', () => {
    const rps = listarRpsComElegibilidade(repositorio, new Date(2030, 0, 1), 0);
    const rp = rps.find((r) => r.rp === '702290');
    expect(rp?.elegivel).toBe(false);
    expect(rp?.motivos.some((motivo) => motivo.includes('01/09/2026'))).toBe(true);
  });
});
