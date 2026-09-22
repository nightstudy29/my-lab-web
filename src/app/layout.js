import GoogleAnalytics from "../components/GoogleAnalytics";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"; // ✅ Footer 컴포넌트 분리
import ScrollToTop from "../components/ScrollToTop";
import "./globals.css";

// 라틴 문자는 Inter, 한글은 브라우저 기본 한글 폰트로 폴백됩니다.
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SMID Lab",
  description: "Laboratory of Semiconductor Materials for Intelligent Devices",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // ✅ userScalable: false 제거 → 접근성 개선
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className} style={{
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        overflowX: 'clip',
        width: '100%'
      }}>
        <GoogleAnalytics trackingId="G-W80BRMHHYT" />
        
        <Navbar />

        <main style={{ flex: 1, width: '100%', maxWidth: '100%' }}>
          {children}
        </main>

        {/* ✅ Footer를 별도 컴포넌트로 분리 */}
        <Footer />

        <ScrollToTop />
        
      </body>
    </html>
  );
}