/** @type {import('next').NextConfig} */
const nextConfig = {
  // 깐깐한 검사(ESLint)를 배포할 때는 무시하겠다는 뜻입니다.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;