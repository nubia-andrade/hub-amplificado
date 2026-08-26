import { NextRequest, NextResponse } from 'next/server';
import { NOME_COOKIE_SESSAO } from '@/lib/auth/constants';

const ROTAS_PROTEGIDAS = ['/rps'];

export function middleware(request: NextRequest) {
  const temSessao = request.cookies.has(NOME_COOKIE_SESSAO);
  const protegida = ROTAS_PROTEGIDAS.some((rota) => request.nextUrl.pathname.startsWith(rota));

  if (protegida && !temSessao) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/rps/:path*'],
};
