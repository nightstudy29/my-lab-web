import { NextResponse } from 'next/server';

export function middleware(request) {
  // 1. 매 요청마다 랜덤한 Nonce(암호) 생성
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // 2. CSP 정책 설정
  // - script-src: Next.js App Router 하이드레이션 때문에 unsafe-inline/unsafe-eval 유지
  // - connect-src: Supabase API 통신 허용 (이게 없으면 이론상 fetch가 막혀야 정상)
  // - img-src: Cloudflare R2에 올린 이미지(뉴스 사진 등) 허용
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline';
    connect-src 'self' https://www.google-analytics.com https://iagkjazyhvahkeifxduq.supabase.co;
    img-src 'self' blob: data: https://www.google-analytics.com https://pub-d01d2f0a6f224159a4981cb55c90fad3.r2.dev;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  // 3. 헤더에 설정 적용
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 브라우저에게 전달할 응답 헤더 설정
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};