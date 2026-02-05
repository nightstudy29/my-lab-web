import { NextResponse } from 'next/server';

export function middleware(request) {
  // 1. 매 요청마다 랜덤한 Nonce(암호) 생성
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // 2. CSP 정책 설정
  const cspHeader = `
    default-src 'self';
    
    // [수정 1] script-src에 'unsafe-inline'과 'unsafe-eval' 복구
    // Next.js가 정상 작동하려면(특히 App Router) 이 옵션들이 필요합니다.
    // nonce가 있어도 일부 하이드레이션 코드 때문에 unsafe-inline이 없으면 화면이 멈춥니다.
    script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com;
    
    style-src 'self' 'unsafe-inline';
    
    // [수정 2] connect-src 추가 (로그인 통신 허용)
    // 이게 없어서 로그인이 막혔던 겁니다. API 서버가 따로 있다면 그 주소도 뒤에 적어줘야 합니다.
    connect-src 'self' https://www.google-analytics.com; 
    
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