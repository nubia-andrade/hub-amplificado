'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ABAS = [
  { href: '/rps', rotulo: 'Minhas RPs' },
  { href: '/mapa', rotulo: 'Mapa de Inserção' },
];

export function AbasPrincipais() {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {ABAS.map((aba) => {
        const ativa = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            style={{
              background: ativa ? 'var(--gradiente-marca)' : 'transparent',
              color: ativa ? 'var(--cor-superficie)' : 'var(--cor-tinta-secundaria)',
              padding: '6px 14px',
              borderRadius: 'var(--raio-botao)',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: ativa ? 'var(--sombra-botao)' : 'none',
            }}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </div>
  );
}
