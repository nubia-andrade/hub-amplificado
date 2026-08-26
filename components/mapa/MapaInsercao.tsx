'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import type { DataExibicao } from '@/lib/data/datasExibicao';
import {
  agruparDatasPorDia,
  construirGradeDoMes,
  primeiroMesComDatas,
  ultimoMesComDatas,
  type MesAno,
} from '@/lib/mapa/calendario';

function paraIndice(mesAno: MesAno): number {
  return mesAno.ano * 12 + mesAno.mes;
}

interface MapaInsercaoProps {
  rps: RpComStatus[];
  datasExibicao: DataExibicao[];
}

const NOMES_MES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MAX_SIGLAS_VISIVEIS = 4;

export function MapaInsercao({ rps, datasExibicao }: MapaInsercaoProps) {
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [anoMes, setAnoMes] = useState<MesAno | null>(null);

  const anunciantes = useMemo(
    () => [...new Set(rps.map((rp) => rp.anunciante))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [rps]
  );

  const rpsDoCliente = useMemo(
    () => rps.filter((rp) => rp.anunciante === clienteSelecionado),
    [rps, clienteSelecionado]
  );

  const primeiroMes = useMemo(
    () => primeiroMesComDatas(rpsDoCliente, datasExibicao),
    [rpsDoCliente, datasExibicao]
  );
  const ultimoMes = useMemo(
    () => ultimoMesComDatas(rpsDoCliente, datasExibicao),
    [rpsDoCliente, datasExibicao]
  );

  useEffect(() => {
    if (!clienteSelecionado) {
      setAnoMes(null);
      return;
    }
    setAnoMes(primeiroMesComDatas(rpsDoCliente, datasExibicao));
  }, [clienteSelecionado, rpsDoCliente, datasExibicao]);

  const mapaPorDia = useMemo(
    () => agruparDatasPorDia(rpsDoCliente, datasExibicao),
    [rpsDoCliente, datasExibicao]
  );

  const grade = useMemo(() => (anoMes ? construirGradeDoMes(anoMes.ano, anoMes.mes) : []), [anoMes]);

  function irParaMesAnterior() {
    setAnoMes((atual) => {
      if (!atual) return atual;
      return atual.mes === 1 ? { ano: atual.ano - 1, mes: 12 } : { ano: atual.ano, mes: atual.mes - 1 };
    });
  }

  function irParaProximoMes() {
    setAnoMes((atual) => {
      if (!atual) return atual;
      return atual.mes === 12 ? { ano: atual.ano + 1, mes: 1 } : { ano: atual.ano, mes: atual.mes + 1 };
    });
  }

  return (
    <div style={{ padding: '16px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <label style={{ fontSize: 12.5, fontWeight: 600 }} htmlFor="cliente">
          Cliente
        </label>
        <select
          id="cliente"
          value={clienteSelecionado}
          onChange={(evento) => setClienteSelecionado(evento.target.value)}
          style={{
            padding: '8px 10px',
            border: '1px solid var(--cor-borda-input)',
            borderRadius: 'var(--raio-input)',
            fontSize: 13,
            minWidth: 240,
          }}
        >
          <option value="">Selecione um cliente</option>
          {anunciantes.map((anunciante) => (
            <option key={anunciante} value={anunciante}>
              {anunciante}
            </option>
          ))}
        </select>
      </div>

      {!clienteSelecionado && (
        <p style={{ fontSize: 12.5, color: 'var(--cor-tinta-terciaria)' }}>
          Selecione um cliente para ver o mapa de inserção.
        </p>
      )}

      {clienteSelecionado && !anoMes && (
        <p style={{ fontSize: 12.5, color: 'var(--cor-tinta-terciaria)' }}>
          Nenhuma data de exibição encontrada para este cliente.
        </p>
      )}

      {clienteSelecionado && anoMes && (
        <div
          style={{
            border: '1px solid var(--cor-borda)',
            borderRadius: 'var(--raio-card)',
            background: 'var(--cor-superficie)',
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
            <button
              type="button"
              onClick={irParaMesAnterior}
              disabled={!primeiroMes || paraIndice(anoMes) <= paraIndice(primeiroMes)}
              style={{
                border: '1px solid var(--cor-borda-forte)',
                background: 'transparent',
                borderRadius: 'var(--raio-input)',
                padding: '4px 10px',
                cursor: !primeiroMes || paraIndice(anoMes) <= paraIndice(primeiroMes) ? 'not-allowed' : 'pointer',
                opacity: !primeiroMes || paraIndice(anoMes) <= paraIndice(primeiroMes) ? 0.4 : 1,
              }}
            >
              ←
            </button>
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              {NOMES_MES[anoMes.mes - 1]} {anoMes.ano}
            </span>
            <button
              type="button"
              onClick={irParaProximoMes}
              disabled={!ultimoMes || paraIndice(anoMes) >= paraIndice(ultimoMes)}
              style={{
                border: '1px solid var(--cor-borda-forte)',
                background: 'transparent',
                borderRadius: 'var(--raio-input)',
                padding: '4px 10px',
                cursor: !ultimoMes || paraIndice(anoMes) >= paraIndice(ultimoMes) ? 'not-allowed' : 'pointer',
                opacity: !ultimoMes || paraIndice(anoMes) >= paraIndice(ultimoMes) ? 0.4 : 1,
              }}
            >
              →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--cor-tinta-terciaria)', textAlign: 'center' }}>
                {dia}
              </div>
            ))}
          </div>

          {grade.map((semana, indiceSemana) => (
            <div key={indiceSemana} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
              {semana.map((diaIso, indiceDia) => {
                if (!diaIso) {
                  return <div key={indiceDia} />;
                }
                const entradas = mapaPorDia[diaIso] ?? [];
                const visiveis = entradas.slice(0, MAX_SIGLAS_VISIVEIS);
                const restantes = entradas.length - visiveis.length;

                return (
                  <div
                    key={diaIso}
                    style={{
                      minHeight: 64,
                      border: '1px solid var(--cor-borda-sutil)',
                      borderRadius: 'var(--raio-input)',
                      padding: 4,
                    }}
                  >
                    <div style={{ fontSize: 10, color: 'var(--cor-tinta-terciaria)', marginBottom: 3 }}>
                      {Number(diaIso.slice(-2))}
                    </div>
                    {visiveis.map((entrada, indiceEntrada) => (
                      <div
                        key={`${entrada.sigla}-${indiceEntrada}`}
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          padding: '1px 4px',
                          marginBottom: 2,
                          borderRadius: 'var(--raio-chip)',
                          color: entrada.elegivel ? 'var(--cor-sucesso-texto)' : 'var(--cor-esgotado-texto)',
                          background: entrada.elegivel ? 'var(--cor-sucesso-fundo)' : 'var(--cor-esgotado-fundo)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {entrada.sigla}
                      </div>
                    ))}
                    {restantes > 0 && (
                      <div style={{ fontSize: 9, color: 'var(--cor-tinta-terciaria)' }}>+{restantes}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
