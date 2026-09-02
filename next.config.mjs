/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint 무시 설정
  eslint: {
    ignoreDuringBuilds: true,
  },

  // R2에 올린 이미지를 next/image로 표시하기 위한 허용 도메인 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-d01d2f0a6f224159a4981cb55c90fad3.r2.dev',
      },
    ],
  },

  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // 1. 개인정보 보호 (Referrer 정책)
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 2. Content-Security-Policy (CSP)는 middleware.js로 이동했습니다.
          // 여기서 중복 설정하면 에러가 발생할 수 있으므로 제거함.
          
          // 3. MIME 스니핑 방지
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // 4. 클릭재킹 방지
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // 5. XSS 보호 (이번에 추가된 항목) ▼
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
