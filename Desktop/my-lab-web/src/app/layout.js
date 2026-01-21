import GoogleAnalytics from "../components/GoogleAnalytics"; // 👈 추가
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar"; 
import ScrollToTop from "../components/ScrollToTop";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SMID Lab", 
  description: "Laboratory of Semiconductor Materials for Intelligent Devices",
};

// 2. 뷰포트 설정
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* [수정 1] body의 overflowX를 'clip'으로 변경
         'hidden'은 sticky를 고장낼 수 있지만, 'clip'은 최신 브라우저에서 안전하게 자릅니다.
      */}
      <body className={inter.className} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        overflowX: 'clip', // 👈 hidden 대신 clip 사용 (안전함)
        width: '100%'
      }}>
      <GoogleAnalytics trackingId="G-W80BRMHHYT" />
        
        <Navbar />

        {/* [수정 2] main 태그에서 overflowX 속성 삭제 (⭐⭐⭐ 제일 중요!)
          여기 overflow가 있으면 sticky가 절대 작동하지 않습니다.
        */}
        <main style={{ flex: 1, width: '100%', maxWidth: '100%' }}>
          {children}
        </main>

        <footer style={{ borderTop: '1px solid #eee', padding: '40px 20px', textAlign: 'center', backgroundColor: '#f9f9f9', color: '#666', marginTop: 'auto' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px', color: '#444' }}>SMID Lab</p>
          <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Laboratory of Semiconductor Materials for Intelligent Devices</p>
          <p style={{ fontSize: '0.8rem', color: '#999' }}>© {new Date().getFullYear()} SMID Lab. All rights reserved.</p>
        </footer>

        <ScrollToTop />
        
      </body>
    </html>
  );
}