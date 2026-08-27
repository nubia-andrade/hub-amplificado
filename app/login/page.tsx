'use client';

import { useActionState } from 'react';
import { entrar, type EstadoLogin } from './actions';
import { listarCarteira } from '@/lib/data/carteira';

const estadoInicial: EstadoLogin = {};
const ATALHOS = listarCarteira();

export default function LoginPage() {
  const [estado, acao, pendente] = useActionState(entrar, estadoInicial);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div
        style={{
          width: 400,
          background: 'var(--cor-superficie-alt)',
          border: '1px solid var(--cor-borda)',
          borderRadius: 'var(--raio-modal)',
          padding: 32,
          boxShadow: 'var(--sombra-card)',
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '.12em',
            color: 'var(--cor-tinta-terciaria)',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          COMERCIAL AMPLIFICADO
        </p>
        <h1
          className="texto-gradiente-marca"
          style={{ fontSize: 24, lineHeight: 1.2, fontWeight: 800, margin: '4px 0 8px' }}
        >
          Propostas
        </h1>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--cor-tinta-secundaria)',
            margin: '0 0 20px',
          }}
        >
          Acesse para ver suas RPs, gerar propostas e atualizar o status comercial.
        </p>

        <form action={acao}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="nome.sobrenome@empresa.com.br"
            style={{
              width: '100%',
              padding: '10px 11px',
              border: '1px solid var(--cor-borda-input)',
              borderRadius: 'var(--raio-botao)',
              fontSize: 13,
              marginBottom: 14,
            }}
          />

          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }} htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            style={{
              width: '100%',
              padding: '10px 11px',
              border: '1px solid var(--cor-borda-input)',
              borderRadius: 'var(--raio-botao)',
              fontSize: 13,
              marginBottom: 14,
            }}
          />

          {estado.erro && (
            <p style={{ fontSize: 12, color: 'var(--cor-erro-texto)', margin: '0 0 14px' }}>
              {estado.erro}
            </p>
          )}

          <button
            type="submit"
            disabled={pendente}
            style={{
              width: '100%',
              padding: '11px',
              background: 'var(--cor-marca)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              border: 'none',
              borderRadius: 'var(--raio-botao)',
              boxShadow: 'var(--sombra-botao)',
              cursor: pendente ? 'default' : 'pointer',
            }}
          >
            {pendente ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <hr style={{ margin: '20px 0', borderTop: '1px dashed var(--cor-borda)' }} />
        <p
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            color: 'var(--cor-tinta-terciaria)',
            margin: '0 0 8px',
          }}
        >
          Ambiente de demonstração — qualquer senha
        </p>
        {ATALHOS.map((a) => (
          <p
            key={a.email}
            style={{ fontSize: 11.5, margin: '4px 0' }}
          >
            {a.email} · {a.nome}
          </p>
        ))}
      </div>
    </main>
  );
}
