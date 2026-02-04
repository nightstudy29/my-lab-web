/** @type {import('next').NextConfig} */
const nextConfig = {
  // 깐깐한 검사(ESLint)를 배포할 때는 무시하겠다는 뜻입니다.
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 보안 헤더 설정을 추가합니다.
  async headers() {
    // CSP 정책 정의 (구글 애널리틱스 등 허용)
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://www.google-analytics.com;
      font-src 'self' data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        // 모든 경로(/:path*)에 아래 헤더들을 적용합니다.
        source: '/:path*',
        headers: [
          // 1. 개인정보 보호 (Referrer 정책)
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 2. XSS 방지 (콘텐츠 보안 정책)
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          // 3. MIME 스니핑 방지
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // 4. 클릭재킹 방지 (이번에 추가된 항목) ▼
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

export default nextConfig;