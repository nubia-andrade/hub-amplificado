'use client';

import { useEffect, useRef } from 'react';

interface CaixaSelecaoProps {
  checked: boolean;
  indeterminado?: boolean;
  disabled?: boolean;
  titulo?: string;
  rotulo: string;
  onChange: () => void;
  aoClicar?: (evento: React.MouseEvent) => void;
}

export function CaixaSelecao({ checked, indeterminado, disabled, titulo, rotulo, onChange, aoClicar }: CaixaSelecaoProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminado) && !checked;
    }
  }, [indeterminado, checked]);

  const marcado = checked || indeterminado;

  return (
    <span style={{ position: 'relative', width: 16, height: 16, display: 'inline-block', flexShrink: 0 }} title={titulo}>
      <input
        ref={ref}
        type="checkbox"
        className="caixa-selecao"
        checked={checked}
        disabled={disabled}
        aria-disabled={disabled}
        aria-label={rotulo}
        onClick={aoClicar}
        onChange={onChange}
        style={{
          position: 'absolute',
          inset: 0,
          width: 16,
          height: 16,
          margin: 0,
          opacity: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: 16,
          height: 16,
          borderRadius: 4,
          border: `1.5px solid ${
            disabled
              ? 'var(--cor-rps-nao-elegivel-borda)'
              : marcado
                ? 'var(--cor-rps-disponivel-base)'
                : 'var(--cor-rps-tinta-terciaria)'
          }`,
          background: disabled
            ? 'var(--cor-rps-nao-elegivel-fundo)'
            : marcado
              ? 'var(--cor-rps-disponivel-base)'
              : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {!checked && indeterminado && <span style={{ width: 8, height: 1.6, background: '#ffffff' }} />}
      </span>
    </span>
  );
}
