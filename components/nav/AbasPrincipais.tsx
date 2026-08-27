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
    <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
      {ABAS.map((aba) => {
        const ativa = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={`aba-nav${ativa ? ' aba-nav-ativa' : ''}`}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--raio-rps-nav)',
              background: ativa ? 'var(--cor-marca)' : 'transparent',
              color: ativa ? '#ffffff' : 'var(--cor-rps-ink-tinta-4)',
              fontSize: 13,
              fontWeight: ativa ? 600 : 500,
              textDecoration: 'none',
            }}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </div>
  );
}
