'use client';

import { useMemo, useState } from 'react';
import type { Sessao } from '@/lib/auth/session';
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import { formatarMoeda, mesDaRp } from '@/lib/rps/formato';
import {
  anuncianteDaSelecao,
  ehSelecionavel,
  ehSelecionavelParaProposta,
  estadoSelecaoTodas,
  filtrarRps,
  resumoSelecao,
  type FiltrosRps,
} from '@/lib/rps/regrasLista';
import { agruparRpsPorMes } from '@/lib/rps/agrupamento';
import { BadgeStatus } from './BadgeStatus';
import { CaixaSelecao } from './CaixaSelecao';
import { FaixaKpis } from './FaixaKpis';
import { ModalGerarProposta } from './ModalGerarProposta';
import { PainelDetalhe } from './PainelDetalhe';
import { ResumoConsolidado } from './ResumoConsolidado';

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

const COLUNAS_TABELA = '44px 92px minmax(160px,1fr) 66px 128px 156px 118px';

const ESTILO_INPUT_FILTRO: React.CSSProperties = {
  height: 36,
  padding: '0 12px',
  border: '1px solid var(--cor-rps-borda)',
  borderRadius: 'var(--raio-rps-input)',
  background: 'var(--cor-rps-superficie-suave)',
  fontSize: 12.5,
  color: 'var(--cor-rps-tinta-forte)',
};

export function ListaRps({ rps, sessao }: ListaRpsProps) {
  const [filtros, setFiltros] = useState<FiltrosRps>(FILTROS_INICIAIS);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [modalPropostaAberto, setModalPropostaAberto] = useState(false);

  const pracas = useMemo(() => [...new Set(rps.map((rp) => rp.exib))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [rps]);
  const executivos = useMemo(
    () => [...new Set(rps.map((rp) => rp.executivo))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [rps]
  );
  const filtradas = useMemo(() => filtrarRps(rps, filtros), [rps, filtros]);
  const anuncianteSelecao = useMemo(() => anuncianteDaSelecao(rps, selecionadas), [rps, selecionadas]);
  const estadoTodas = estadoSelecaoTodas(filtradas, selecionadas, anuncianteSelecao);
  const resumo = resumoSelecao(rps, selecionadas);
  const grupos = useMemo(() => agruparRpsPorMes(filtradas), [filtradas]);

  const disponiveis = useMemo(() => rps.filter(ehSelecionavel), [rps]);
  const tabelaDisponivel = useMemo(() => disponiveis.reduce((soma, rp) => soma + rp.valorTabela, 0), [disponiveis]);
  const rpsSelecionadas = useMemo(() => rps.filter((rp) => selecionadas.includes(rp.rp)), [rps, selecionadas]);

  function alternarSelecao(rp: string) {
    setSelecionadas((atual) => (atual.includes(rp) ? atual.filter((id) => id !== rp) : [...atual, rp]));
  }

  function alternarTodas() {
    const selecionaveisFiltradas = filtradas
      .filter((rp) => ehSelecionavelParaProposta(rp, anuncianteSelecao))
      .map((rp) => rp.rp);
    if (estadoTodas === 'todas') {
      setSelecionadas((atual) => atual.filter((id) => !selecionaveisFiltradas.includes(id)));
    } else {
      setSelecionadas((atual) => [...new Set([...atual, ...selecionaveisFiltradas])]);
    }
  }

  return (
    <div style={{ background: 'var(--cor-rps-pagina)', minHeight: 'calc(100vh - 60px)' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'flex-start',
          padding: '20px 24px 84px',
        }}
      >
        <main style={{ flex: '1 1 620px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FaixaKpis
            carteiraTotal={rps.length}
            disponiveisContagem={disponiveis.length}
            tabelaDisponivel={tabelaDisponivel}
            selecionadoTotal={resumo.totalTabela}
          />

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--cor-rps-borda)',
              borderRadius: 'var(--raio-rps-card)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '13px 16px',
                borderBottom: '1px solid var(--cor-rps-borda-interna)',
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <input
                value={filtros.busca}
                onChange={(evento) => setFiltros({ ...filtros, busca: evento.target.value })}
                placeholder="Buscar RP, anunciante ou CNPJ"
                style={{ ...ESTILO_INPUT_FILTRO, flex: 1, minWidth: 230 }}
              />
              <select
                value={filtros.praca}
                onChange={(evento) => setFiltros({ ...filtros, praca: evento.target.value })}
                style={ESTILO_INPUT_FILTRO}
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
                style={ESTILO_INPUT_FILTRO}
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
                style={ESTILO_INPUT_FILTRO}
              >
                <option value="todas">Elegibilidade: toda</option>
                <option value="sim">Só elegíveis</option>
                <option value="nao">Só não elegíveis</option>
              </select>
              {sessao.papel === 'gerente' && (
                <select
                  value={filtros.executivo}
                  onChange={(evento) => setFiltros({ ...filtros, executivo: evento.target.value })}
                  style={ESTILO_INPUT_FILTRO}
                >
                  <option value="">Executivo: todos</option>
                  {executivos.map((executivo) => (
                    <option key={executivo} value={executivo}>
                      {executivo}
                    </option>
                  ))}
                </select>
              )}
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--fonte-rps-mono)',
                  fontSize: 11,
                  color: 'var(--cor-rps-tinta-secundaria)',
                }}
              >
                {filtradas.length} / {rps.length}
              </span>
            </div>

            {rps.length === 0 ? (
              <p style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12.5, color: 'var(--cor-rps-tinta-secundaria)' }}>
                Nenhuma RP na sua carteira no momento.
              </p>
            ) : filtradas.length === 0 ? (
              <p style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12.5, color: 'var(--cor-rps-tinta-secundaria)' }}>
                Nenhuma RP encontrada para os filtros atuais.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: 860 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: COLUNAS_TABELA,
                      height: 38,
                      alignItems: 'center',
                      padding: '0 16px',
                      background: 'var(--cor-rps-cabecalho-tabela)',
                      borderBottom: '1px solid var(--cor-rps-borda)',
                      fontFamily: 'var(--fonte-rps-mono)',
                      fontSize: 9.5,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      color: 'var(--cor-rps-tinta-secundaria)',
                    }}
                  >
                    <CaixaSelecao
                      checked={estadoTodas === 'todas'}
                      indeterminado={estadoTodas === 'parcial'}
                      onChange={alternarTodas}
                    />
                    <span>RP</span>
                    <span>Anunciante</span>
                    <span>Praça</span>
                    <span>Mês</span>
                    <span style={{ textAlign: 'right' }}>Tabela</span>
                    <span style={{ textAlign: 'right' }}>Status</span>
                  </div>

                  {grupos.map((grupo) => (
                    <div key={grupo.chave}>
                      <div
                        style={{
                          padding: '9px 16px',
                          background: 'var(--cor-rps-superficie-suave)',
                          borderTop: '1px solid var(--cor-rps-borda-interna)',
                          borderBottom: '1px solid var(--cor-rps-borda-interna)',
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cor-rps-tinta-fraca)' }} />
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--cor-rps-tinta-forte)' }}>
                          {grupo.rotulo}
                        </span>
                        <span style={{ fontFamily: 'var(--fonte-rps-mono)', fontSize: 10, color: 'var(--cor-rps-tinta-desabilitada)' }}>
                          {grupo.rps.length} RPs
                        </span>
                        <span style={{ flex: 1, height: 1, background: 'var(--cor-rps-borda-interna)' }} />
                        <span
                          style={{
                            fontFamily: 'var(--fonte-rps-mono)',
                            fontSize: 10.5,
                            color: 'var(--cor-rps-tinta-corpo)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {grupo.totalTabela !== null ? formatarMoeda(grupo.totalTabela) : 'sem tabela'}
                        </span>
                      </div>

                      {grupo.rps.map((rp) => {
                        const selecionavel = ehSelecionavelParaProposta(rp, anuncianteSelecao);
                        const aberta = detalheId === rp.rp;
                        const marcada = selecionadas.includes(rp.rp);
                        const motivoIndisponivel = !ehSelecionavel(rp)
                          ? 'Só RPs elegíveis e com status Disponível podem ser selecionadas.'
                          : 'Só é possível selecionar RPs do mesmo cliente numa proposta.';

                        return (
                          <div
                            key={rp.rp}
                            onClick={() => setDetalheId(rp.rp)}
                            className={`linha-rp${marcada ? ' linha-rp-selecionada' : ''}`}
                            style={{
                              position: 'relative',
                              display: 'grid',
                              gridTemplateColumns: COLUNAS_TABELA,
                              height: 52,
                              alignItems: 'center',
                              padding: '0 16px',
                              borderBottom: '1px solid var(--cor-rps-borda-sutil)',
                              cursor: 'pointer',
                              background: aberta ? 'var(--cor-rps-hover-linha)' : marcada ? 'var(--cor-rps-disponivel-linha-fundo)' : '#ffffff',
                            }}
                          >
                            <span
                              aria-hidden
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: 3,
                                background: marcada ? 'var(--cor-rps-disponivel-base)' : 'transparent',
                              }}
                            />
                            <CaixaSelecao
                              checked={marcada}
                              disabled={!selecionavel}
                              titulo={selecionavel ? undefined : motivoIndisponivel}
                              aoClicar={(evento) => evento.stopPropagation()}
                              onChange={() => alternarSelecao(rp.rp)}
                            />
                            <span
                              style={{
                                fontFamily: 'var(--fonte-rps-mono)',
                                fontSize: 12.5,
                                fontWeight: 500,
                                color: rp.elegivel ? 'var(--cor-rps-tinta-principal)' : 'var(--cor-rps-tinta-desabilitada)',
                              }}
                            >
                              {rp.rp}
                            </span>
                            <span style={{ minWidth: 0 }}>
                              <span
                                style={{
                                  display: 'block',
                                  fontSize: 13,
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  color: rp.elegivel ? 'var(--cor-rps-tinta-principal)' : 'var(--cor-rps-tinta-desabilitada)',
                                }}
                              >
                                {rp.anunciante}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--cor-rps-tinta-terciaria)' }}>
                                {rp.linhas.length} linhas
                              </span>
                            </span>
                            <span>
                              <span
                                style={{
                                  fontFamily: 'var(--fonte-rps-mono)',
                                  fontSize: 10,
                                  letterSpacing: '.06em',
                                  padding: '3px 7px',
                                  borderRadius: 'var(--raio-rps-chip)',
                                  background: 'var(--cor-rps-borda-sutil)',
                                  color: 'var(--cor-rps-tinta-corpo)',
                                }}
                              >
                                {rp.exib}
                              </span>
                            </span>
                            <span style={{ fontSize: 12.5, color: 'var(--cor-rps-tinta-corpo)' }}>{mesDaRp(rp)}</span>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                textAlign: 'right',
                                fontVariantNumeric: 'tabular-nums',
                                color: rp.elegivel ? 'var(--cor-rps-tinta-principal)' : 'var(--cor-rps-tinta-fraca)',
                              }}
                            >
                              {rp.elegivel ? formatarMoeda(rp.valorTabela) : '—'}
                            </span>
                            <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <BadgeStatus status={rp.status} elegivel={rp.elegivel} motivos={rp.motivos} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        <aside style={{ flex: '0 1 400px', width: 400, position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selecionadas.length >= 2 ? (
            <ResumoConsolidado rps={rpsSelecionadas} />
          ) : detalheId ? (
            (() => {
              const rpAberta = rps.find((rp) => rp.rp === detalheId);
              return rpAberta ? (
                <PainelDetalhe rp={rpAberta} />
              ) : (
                <p style={{ fontSize: 12.5, color: 'var(--cor-rps-tinta-secundaria)' }}>RP não encontrada.</p>
              );
            })()
          ) : (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--cor-rps-borda)',
                borderRadius: 'var(--raio-rps-card)',
                padding: 16,
              }}
            >
              <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--cor-rps-tinta-secundaria)', margin: 0 }}>
                Selecione uma RP na lista para ver o detalhamento por programa, o valor unitário calculado e
                gerar uma proposta.
              </p>
            </div>
          )}

          <div
            style={{
              padding: '12px 16px',
              border: '1px dashed var(--cor-rps-borda-tracejada)',
              borderRadius: 'var(--raio-rps-card)',
              fontSize: 11.5,
              lineHeight: 1.5,
              color: 'var(--cor-rps-tinta-secundaria)',
            }}
          >
            Somente RPs <strong style={{ color: 'var(--cor-rps-disponivel-texto)', fontWeight: 600 }}>Disponíveis</strong>{' '}
            entram na proposta. RPs não elegíveis permanecem visíveis para consulta.
          </div>
        </aside>
      </div>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          padding: '12px 24px',
          background: 'var(--cor-rps-ink)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{resumo.quantidade} RPs selecionadas</span>
          <span style={{ width: 1, height: 14, background: 'var(--cor-rps-ink-avatar)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {formatarMoeda(resumo.totalTabela)}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--cor-rps-ink-tinta-3)' }}>
            {rpsSelecionadas.reduce((soma, rp) => soma + rp.nDatas, 0).toLocaleString('pt-BR')} datas
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button
            type="button"
            disabled
            className="botao-rps-secundario"
            style={{
              height: 38,
              padding: '0 16px',
              border: '1px solid var(--cor-rps-ink-borda-botao)',
              background: 'transparent',
              borderRadius: 'var(--raio-rps-botao)',
              color: 'var(--cor-rps-ink-tinta-2)',
              fontSize: 13,
              fontWeight: 500,
              opacity: 0.5,
              cursor: 'not-allowed',
            }}
          >
            Alterar status
          </button>
          <button
            type="button"
            onClick={() => setModalPropostaAberto(true)}
            disabled={selecionadas.length === 0}
            className="botao-rps-primario"
            style={{
              height: 38,
              padding: '0 20px',
              border: 'none',
              borderRadius: 'var(--raio-rps-botao)',
              background: 'var(--cor-marca)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              opacity: selecionadas.length === 0 ? 0.45 : 1,
              cursor: selecionadas.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Gerar proposta
          </button>
        </div>
      </div>

      {modalPropostaAberto && (
        <ModalGerarProposta
          rpsSelecionadas={rpsSelecionadas}
          aoFechar={() => setModalPropostaAberto(false)}
        />
      )}
    </div>
  );
}
