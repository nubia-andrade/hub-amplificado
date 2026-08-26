'use client';

import { useMemo, useState } from 'react';
import type { RpComStatus } from '@/lib/rps/rpComStatus';
import { formatarMoeda } from '@/lib/rps/formato';
import { obterAgenciaMock } from '@/lib/data/agenciaMock';

interface ModalGerarPropostaProps {
  rpsSelecionadas: RpComStatus[];
  aoFechar: () => void;
}

interface EstadoAgencia {
  possui: boolean;
  nome: string;
}

const ALCADA_MAXIMA = 20;

export function ModalGerarProposta({ rpsSelecionadas, aoFechar }: ModalGerarPropostaProps) {
  const cliente = rpsSelecionadas[0]?.anunciante ?? '';
  const [percentualDesconto, setPercentualDesconto] = useState(0);
  const [agencia, setAgencia] = useState<EstadoAgencia>(() => {
    const nomeMock = obterAgenciaMock(cliente);
    return { possui: nomeMock !== null, nome: nomeMock ?? '' };
  });
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const descontoInvalido = percentualDesconto < 0 || percentualDesconto > ALCADA_MAXIMA;

  const totalTabela = useMemo(
    () => rpsSelecionadas.reduce((soma, rp) => soma + rp.valorTabela, 0),
    [rpsSelecionadas]
  );

  async function gerarProposta() {
    if (descontoInvalido) return;
    setGerando(true);
    setErro(null);

    try {
      const resposta = await fetch('/api/proposta', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          rpIds: rpsSelecionadas.map((rp) => rp.rp),
          percentualDesconto,
          possuiAgencia: agencia.possui,
          nomeAgencia: agencia.nome,
        }),
      });

      if (!resposta.ok) {
        const corpo = (await resposta.json().catch(() => null)) as { erro?: string } | null;
        setErro(corpo?.erro ?? 'Não foi possível gerar a proposta.');
        return;
      }

      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proposta-${rpsSelecionadas.map((rp) => rp.rp).join('-')}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      aoFechar();
    } catch {
      setErro('Não foi possível gerar a proposta.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={aoFechar}
    >
      <div
        onClick={(evento) => evento.stopPropagation()}
        style={{
          background: 'var(--cor-superficie)',
          borderRadius: 'var(--raio-modal)',
          boxShadow: 'var(--sombra-modal)',
          padding: 24,
          width: 520,
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16 }}>Gerar proposta</h2>
        <p style={{ fontSize: 12.5, color: 'var(--cor-tinta-secundaria)', marginTop: 4 }}>
          {rpsSelecionadas.length} RPs · {formatarMoeda(totalTabela)} de tabela
        </p>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600 }} htmlFor="percentual-desconto">
            % de desconto (aplicado a todas as RPs selecionadas)
          </label>
          <input
            id="percentual-desconto"
            type="number"
            min={0}
            max={ALCADA_MAXIMA}
            step="0.5"
            value={percentualDesconto}
            onChange={(evento) => setPercentualDesconto(Number(evento.target.value))}
            style={{
              display: 'block',
              marginTop: 6,
              padding: '8px 10px',
              border: `1px solid ${descontoInvalido ? 'var(--cor-erro-borda)' : 'var(--cor-borda-input)'}`,
              borderRadius: 'var(--raio-input)',
              fontSize: 13,
              width: 120,
            }}
          />
          {descontoInvalido && (
            <p style={{ fontSize: 11.5, color: 'var(--cor-erro-texto)', marginTop: 4 }}>
              O desconto não pode passar de {ALCADA_MAXIMA}% (alçada do executivo).
            </p>
          )}
        </div>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--cor-borda-sutil)' }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, margin: 0 }}>Cliente: {cliente}</p>
          <p style={{ fontSize: 11.5, color: 'var(--cor-tinta-secundaria)', margin: '4px 0 0' }}>
            {rpsSelecionadas.map((rp) => rp.rp).join(' · ')}
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={agencia.possui}
              onChange={(evento) => setAgencia((atual) => ({ ...atual, possui: evento.target.checked }))}
            />
            Cliente possui agência (desconto adicional de 20%)
          </label>
          {agencia.possui && (
            <input
              value={agencia.nome}
              onChange={(evento) => setAgencia((atual) => ({ ...atual, nome: evento.target.value }))}
              placeholder="Nome da agência"
              style={{
                display: 'block',
                marginTop: 6,
                padding: '6px 8px',
                border: '1px solid var(--cor-borda-input)',
                borderRadius: 'var(--raio-input)',
                fontSize: 12.5,
                width: '100%',
              }}
            />
          )}
        </div>

        {erro && (
          <p style={{ fontSize: 12, color: 'var(--cor-erro-texto)', marginTop: 12 }}>{erro}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button
            type="button"
            onClick={aoFechar}
            style={{
              border: '1px solid var(--cor-borda-forte)',
              background: 'transparent',
              borderRadius: 'var(--raio-botao)',
              padding: '8px 16px',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={gerarProposta}
            disabled={descontoInvalido || gerando}
            style={{
              border: 'none',
              background: 'var(--gradiente-marca)',
              color: '#ffffff',
              borderRadius: 'var(--raio-botao)',
              padding: '8px 18px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: descontoInvalido || gerando ? 'not-allowed' : 'pointer',
              opacity: descontoInvalido || gerando ? 0.6 : 1,
            }}
          >
            {gerando ? 'Gerando…' : 'Confirmar e baixar'}
          </button>
        </div>
      </div>
    </div>
  );
}
