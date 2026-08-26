'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Sessao } from '@/lib/auth/session';
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import { formatarMoeda, mesDaRp } from '@/lib/rps/formato';
import {
  ehSelecionavel,
  estadoSelecaoTodas,
  filtrarRps,
  resumoSelecao,
  type FiltrosRps,
} from '@/lib/rps/regrasLista';
import { BadgeStatus } from './BadgeStatus';
import { ModalGerarProposta } from './ModalGerarProposta';
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

export function ListaRps({ rps, sessao }: ListaRpsProps) {
  const [filtros, setFiltros] = useState<FiltrosRps>(FILTROS_INICIAIS);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [modalPropostaAberto, setModalPropostaAberto] = useState(false);
  const checkboxCabecalhoRef = useRef<HTMLInputElement>(null);

  const pracas = useMemo(() => [...new Set(rps.map((rp) => rp.exib))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [rps]);
  const executivos = useMemo(
    () => [...new Set(rps.map((rp) => rp.executivo))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [rps]
  );
  const filtradas = useMemo(() => filtrarRps(rps, filtros), [rps, filtros]);
  const estadoTodas = estadoSelecaoTodas(filtradas, selecionadas);
  const resumo = resumoSelecao(rps, selecionadas);
  const filtradasExibidas = filtradas.slice(0, 120);

  useEffect(() => {
    if (checkboxCabecalhoRef.current) {
      checkboxCabecalhoRef.current.indeterminate = estadoTodas === 'parcial';
    }
  }, [estadoTodas]);

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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 400px',
          gap: 16,
          alignItems: 'start',
          padding: '16px 22px',
        }}
      >
        <div
          style={{
            border: '1px solid var(--cor-borda)',
            borderRadius: 'var(--raio-card)',
            background: 'var(--cor-superficie)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 53,
              display: 'grid',
              gridTemplateColumns: '28px 72px minmax(90px,1fr) 44px 70px 96px 104px',
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
              ref={checkboxCabecalhoRef}
              checked={estadoTodas === 'todas'}
              onChange={alternarTodas}
            />
            <span>RP</span>
            <span>Anunciante</span>
            <span>Praça</span>
            <span>Mês</span>
            <span style={{ textAlign: 'right' }}>Tabela</span>
            <span>Status</span>
          </div>

          {filtradasExibidas.map((rp) => {
            const selecionavel = ehSelecionavel(rp);
            const aberta = detalheId === rp.rp;
            const marcada = selecionadas.includes(rp.rp);

            return (
              <div
                key={rp.rp}
                onClick={() => setDetalheId(rp.rp)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 72px minmax(90px,1fr) 44px 70px 96px 104px',
                  gap: 8,
                  padding: '11px 16px',
                  borderBottom: '1px solid var(--cor-borda-sutil)',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: aberta ? 'var(--cor-linha-marcada)' : marcada ? 'var(--cor-superficie-suave)' : 'transparent',
                  color: rp.elegivel ? 'var(--cor-tinta-principal)' : 'var(--cor-tinta-terciaria)',
                }}
              >
                <input
                  type="checkbox"
                  disabled={!selecionavel}
                  checked={marcada}
                  title={selecionavel ? undefined : 'Só RPs elegíveis e com status Disponível podem ser selecionadas.'}
                  onClick={(evento) => evento.stopPropagation()}
                  onChange={() => alternarSelecao(rp.rp)}
                />
                <span style={{ fontWeight: 600, fontSize: 12 }}>{rp.rp}</span>
                <span style={{ fontSize: 12.5 }}>
                  {rp.anunciante} <span style={{ color: 'var(--cor-tinta-terciaria)' }}>· {rp.linhas.length} linhas</span>
                </span>
                <span style={{ fontSize: 12 }}>{rp.exib}</span>
                <span style={{ fontSize: 11.5, color: 'var(--cor-tinta-secundaria)' }}>{mesDaRp(rp)}</span>
                <span style={{ fontSize: 12, textAlign: 'right' }}>{rp.elegivel ? formatarMoeda(rp.valorTabela) : '—'}</span>
                <BadgeStatus status={rp.status} elegivel={rp.elegivel} />
              </div>
            );
          })}
          {filtradas.length > 120 && (
            <p style={{ fontSize: 11, color: 'var(--cor-tinta-terciaria)', padding: '8px 16px' }}>
              + {filtradas.length - 120} RPs não exibidas — refine a busca ou os filtros.
            </p>
          )}
        </div>

        <div
          style={{
            position: 'sticky',
            top: 53,
            height: 'calc(100vh - 85px)',
            overflowY: 'auto',
            border: '1px solid var(--cor-borda)',
            borderRadius: 'var(--raio-card)',
            background: 'var(--cor-superficie)',
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
            color: 'var(--cor-superficie)',
            padding: '10px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12.5,
          }}
        >
          <span>
            {resumo.quantidade} RPs Disponíveis · {formatarMoeda(resumo.totalTabela)}
            {resumo.anunciantesDistintos > 1 ? ` · proposta única com ${resumo.anunciantesDistintos} anunciantes` : ''}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              disabled
              style={{
                border: '1px solid var(--cor-superficie)',
                background: 'transparent',
                color: 'var(--cor-superficie)',
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
              onClick={() => setModalPropostaAberto(true)}
              style={{
                border: 'none',
                background: 'var(--cor-superficie)',
                color: 'var(--cor-tinta-principal)',
                borderRadius: 'var(--raio-botao)',
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Gerar proposta
            </button>
          </div>
        </div>
      )}

      {modalPropostaAberto && (
        <ModalGerarProposta
          rpsSelecionadas={rps.filter((rp) => selecionadas.includes(rp.rp))}
          aoFechar={() => setModalPropostaAberto(false)}
        />
      )}
    </div>
  );
}
