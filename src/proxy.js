// src/proxy.js  (Next.js 16부터 middleware.js → proxy.js 로 이름이 바뀐 파일 컨벤션)
//
// 모든 페이지 응답에 Content-Security-Policy 헤더를 붙입니다.
// /api 경로는 matcher에서 제외되어 있습니다 (API 인증은 src/lib/auth.js의 requireAdmin이 담당).

import { NextResponse } from 'next/server';

export function proxy(request) {
  // CSP 정책 설정
  // - script-src: Next.js App Router 하이드레이션 때문에 unsafe-inline/unsafe-eval 유지
  //   (nonce는 Next.js 자체 인라인 스크립트에 제대로 전파되지 않아 하이드레이션이
  //    깨지는 문제가 있어 제거했습니다 — nonce가 있으면 unsafe-inline이 완전히
  //    무시되는 CSP 스펙 때문입니다.)
  // - connect-src: Supabase API, Google Apps Script(휴가관리/가입승인), Google Sheets(회원 CSV),
  //   Cloudflare R2 S3 API(관리자 패널의 presigned URL 직접 업로드 PUT) 허용
  // - img-src: Cloudflare R2에 올린 이미지(뉴스 사진 등) 허용. OTP QR은 서버가 data: URL로 생성.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline';
    connect-src 'self' https://www.google-analytics.com https://iagkjazyhvahkeifxduq.supabase.co https://script.google.com https://docs.google.com https://script.googleusercontent.com https://*.googleusercontent.com https://*.r2.cloudflarestorage.com;
    img-src 'self' blob: data: https://www.google-analytics.com https://pub-d01d2f0a6f224159a4981cb55c90fad3.r2.dev;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

// 적용될 경로 설정
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
