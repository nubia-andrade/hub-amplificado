import { NextRequest, NextResponse } from 'next/server';
import { NOME_COOKIE_SESSAO } from '@/lib/auth/constants';

export function middleware(request: NextRequest) {
  const temSessao = request.cookies.has(NOME_COOKIE_SESSAO);

  if (!temSessao) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/rps/:path*'],
};
