// ✅ "use client" 제거 → 서버 컴포넌트로 동작
// ✅ react-ga4 라이브러리 제거 → next/script 공식 방식 사용
// ✅ strategy="afterInteractive" → 페이지 로딩 성능에 영향 없음
// ✅ App Router에서 페이지 이동 자동 추적 (usePathname 불필요)

import Script from "next/script";

export default function GoogleAnalytics({ trackingId }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${trackingId}');
        `}
      </Script>
    </>
  );
}