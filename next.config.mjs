/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Content-Security-Policy는 proxy.js에서 설정합니다 (여기서 중복 설정하지 마세요).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Referrer 정책 (개인정보 보호)
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // MIME 스니핑 방지
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // 클릭재킹 방지 (CSP frame-ancestors와 중복이지만 구형 브라우저용으로 유지)
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
