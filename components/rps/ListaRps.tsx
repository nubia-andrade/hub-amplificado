'use client';

import { useMemo, useState } from 'react';
import type { Sessao } from '@/lib/auth/session';
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import {
  ehSelecionavel,
  estadoSelecaoTodas,
  filtrarRps,
  resumoSelecao,
  type FiltrosRps,
} from '@/lib/rps/regrasLista';
import { BadgeStatus } from './BadgeStatus';
import { PainelDetalhe } from './PainelDetalhe';

interface ListaRpsProps {
  rps: RpComStatus[];
  sessao: Sessao;
}

const FILTROS_INICIAIS: FiltrosRps = {
  busca: '',
  praca: '',
  status: '',
  elegibilidade: 'todas',
  executivo: '',
};

function money(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
}

export function ListaRps({ rps, sessao }: ListaRpsProps) {
  const [filtros, setFiltros] = useState<FiltrosRps>(FILTROS_INICIAIS);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const pracas = useMemo(() => [...new Set(rps.map((rp) => rp.exib))].sort(), [rps]);
  const executivos = useMemo(() => [...new Set(rps.map((rp) => rp.executivo))].sort(), [rps]);
  const filtradas = useMemo(() => filtrarRps(rps, filtros), [rps, filtros]);
  const estadoTodas = estadoSelecaoTodas(filtradas, selecionadas);
  const resumo = resumoSelecao(rps, selecionadas);

  function alternarSelecao(rp: string) {
    setSelecionadas((atual) => (atual.includes(rp) ? atual.filter((id) => id !== rp) : [...atual, rp]));
  }

  function alternarTodas() {
    const selecionaveisFiltradas = filtradas.filter(ehSelecionavel).map((rp) => rp.rp);
    if (estadoTodas === 'todas') {
      setSelecionadas((atual) => atual.filter((id) => !selecionaveisFiltradas.includes(id)));
    } else {
      setSelecionadas((atual) => [...new Set([...atual, ...selecionaveisFiltradas])]);
    }
  }

  return (
    <div>
      <div
        style={{
          padding: '12px 22px',
          background: 'var(--cor-superficie)',
          borderBottom: '1px solid var(--cor-borda)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <input
          value={filtros.busca}
          onChange={(evento) => setFiltros({ ...filtros, busca: evento.target.value })}
          placeholder="Buscar RP, anunciante ou CNPJ"
          style={{
            width: 250,
            padding: '8px 10px',
            border: '1px solid var(--cor-borda-input)',
            borderRadius: 'var(--raio-input)',
            fontSize: 13,
          }}
        />
        <select
          value={filtros.praca}
          onChange={(evento) => setFiltros({ ...filtros, praca: evento.target.value })}
          style={{ padding: '8px 10px', border: '1px solid var(--cor-borda-input)', borderRadius: 'var(--raio-input)', fontSize: 13 }}
        >
          <option value="">Praça: todas</option>
          {pracas.map((praca) => (
            <option key={praca} value={praca}>
              {praca}
            </option>
          ))}
        </select>
        <select
          value={filtros.status}
          onChange={(evento) => setFiltros({ ...filtros, status: evento.target.value as FiltrosRps['status'] })}
          style={{ padding: '8px 10px', border: '1px solid var(--cor-borda-input)', borderRadius: 'var(--raio-input)', fontSize: 13 }}
        >
          <option value="">Status: todos</option>
          <option value="Disponível">Disponível</option>
          <option value="Em negociação">Em negociação</option>
          <option value="Fechada Ganha">Fechada Ganha</option>
          <option value="Negócio Perdido">Negócio Perdido</option>
        </select>
        <select
          value={filtros.elegibilidade}
          onChange={(evento) =>
            setFiltros({ ...filtros, elegibilidade: evento.target.value as FiltrosRps['elegibilidade'] })
          }
          style={{ padding: '8px 10px', border: '1px solid var(--cor-borda-input)', borderRadius: 'var(--raio-input)', fontSize: 13 }}
        >
          <option value="todas">Elegibilidade: toda</option>
          <option value="sim">Só elegíveis</option>
          <option value="nao">Só não elegíveis</option>
        </select>
        {sessao.papel === 'gerente' && (
          <select
            value={filtros.executivo}
            onChange={(evento) => setFiltros({ ...filtros, executivo: evento.target.value })}
            style={{ padding: '8px 10px', border: '1px solid var(--cor-borda-input)', borderRadius: 'var(--raio-input)', fontSize: 13 }}
          >
            <option value="">Executivo: todos</option>
            {executivos.map((executivo) => (
              <option key={executivo} value={executivo}>
                {executivo}
              </option>
            ))}
          </select>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--cor-tinta-secundaria)' }}>
          {filtradas.length} de {rps.length} RPs
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 336px' }}>
        <div>
          <div
            style={{
              position: 'sticky',
              top: 53,
              display: 'grid',
              gridTemplateColumns: '28px 72px minmax(110px,1fr) 44px 96px 104px',
              gap: 8,
              padding: '11px 16px',
              background: 'var(--cor-cabecalho-tabela)',
              fontSize: 9.5,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: 'var(--cor-tinta-terciaria)',
            }}
          >
            <input
              type="checkbox"
              ref={(elemento) => {
                if (elemento) elemento.indeterminate = estadoTodas === 'parcial';
              }}
              checked={estadoTodas === 'todas'}
              onChange={alternarTodas}
            />
            <span>RP</span>
            <span>Anunciante</span>
            <span>Praça</span>
            <span style={{ textAlign: 'right' }}>Tabela</span>
            <span>Status</span>
          </div>

          {filtradas.map((rp) => {
            const selecionavel = ehSelecionavel(rp);
            const aberta = detalheId === rp.rp;
            const marcada = selecionadas.includes(rp.rp);

            return (
              <div
                key={rp.rp}
                onClick={() => setDetalheId(rp.rp)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 72px minmax(110px,1fr) 44px 96px 104px',
                  gap: 8,
                  padding: '11px 16px',
                  borderBottom: '1px solid var(--cor-borda-sutil)',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: aberta ? 'var(--cor-linha-marcada)' : 'transparent',
                  color: rp.elegivel ? 'var(--cor-tinta-principal)' : 'var(--cor-tinta-terciaria)',
                }}
              >
                <input
                  type="checkbox"
                  disabled={!selecionavel}
                  checked={marcada}
                  onClick={(evento) => evento.stopPropagation()}
                  onChange={() => alternarSelecao(rp.rp)}
                />
                <span style={{ fontWeight: 600, fontSize: 12 }}>{rp.rp}</span>
                <span style={{ fontSize: 12.5 }}>
                  {rp.anunciante} <span style={{ color: 'var(--cor-tinta-terciaria)' }}>· {rp.linhas.length} linhas</span>
                </span>
                <span style={{ fontSize: 12 }}>{rp.exib}</span>
                <span style={{ fontSize: 12, textAlign: 'right' }}>{rp.elegivel ? money(rp.valorTabela) : '—'}</span>
                <BadgeStatus status={rp.status} elegivel={rp.elegivel} />
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: 'sticky',
            top: 53,
            height: 'calc(100vh - 53px)',
            overflowY: 'auto',
            borderLeft: '1px solid var(--cor-borda)',
            padding: 16,
          }}
        >
          {detalheId ? (
            (() => {
              const rpAberta = rps.find((rp) => rp.rp === detalheId);
              return rpAberta ? (
                <PainelDetalhe rp={rpAberta} />
              ) : (
                <p style={{ fontSize: 12.5, color: 'var(--cor-tinta-terciaria)' }}>RP não encontrada.</p>
              );
            })()
          ) : (
            <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--cor-tinta-terciaria)' }}>
              Selecione uma RP na lista para ver o detalhamento por programa, o valor unitário calculado
              e gerar uma proposta.
            </p>
          )}
        </div>
      </div>

      {selecionadas.length > 0 && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: 'var(--cor-marca)',
            color: '#fff',
            padding: '10px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12.5,
          }}
        >
          <span>
            {resumo.quantidade} RPs Disponíveis · {money(resumo.totalTabela)}
            {resumo.anunciantesDistintos > 1 ? ` · proposta única com ${resumo.anunciantesDistintos} anunciantes` : ''}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              disabled
              style={{
                border: '1px solid #fff',
                background: 'transparent',
                color: '#fff',
                borderRadius: 'var(--raio-botao)',
                padding: '7px 14px',
                fontSize: 12,
                opacity: 0.5,
                cursor: 'not-allowed',
              }}
            >
              Alterar status
            </button>
            <button
              type="button"
              disabled
              style={{
                border: 'none',
                background: '#fff',
                color: 'var(--cor-tinta-principal)',
                borderRadius: 'var(--raio-botao)',
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 600,
                opacity: 0.5,
                cursor: 'not-allowed',
              }}
            >
              Gerar proposta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
