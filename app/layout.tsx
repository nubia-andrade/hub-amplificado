import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const globotipoCorporativa = localFont({
  src: [
    {
      path: '../assets/fonts/GlobotipoCorporativa-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/GlobotipoCorporativa-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--fonte-titulo',
});

const globotipoCorporativaTextos = localFont({
  src: [
    {
      path: '../assets/fonts/GlobotipoCorporativaTextos-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/GlobotipoCorporativaTextos-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--fonte-corpo',
});

export const metadata: Metadata = {
  title: 'Hub Amplificado',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${globotipoCorporativa.variable} ${globotipoCorporativaTextos.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
