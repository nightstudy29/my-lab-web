/** @type {import('next').NextConfig} */
const nextConfig = {
  // 깐깐한 검사(ESLint)를 배포할 때는 무시하겠다는 뜻입니다.
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 보안 헤더 설정을 추가합니다.
  async headers() {
    return [
      {
        // 모든 경로(/:path*)에 이 설정을 적용합니다.
        source: '/:path*',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;