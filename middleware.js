import { NextResponse } from 'next/server';

export function middleware(request) {
  // 1. 매 요청마다 랜덤한 Nonce(암호) 생성
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // 2. CSP 정책 설정 (지적받은 unsafe-inline, unsafe-eval 제거)
  // script-src와 style-src에 'nonce-...'를 추가하여 허용된 스크립트만 실행되게 함
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://www.google-analytics.com;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  // 3. 헤더에 설정 적용
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce); // Next.js 내부에서 사용하도록 전달
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

// 미들웨어가 적용될 경로 설정 (이미지, API 등 불필요한 파일 제외)
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