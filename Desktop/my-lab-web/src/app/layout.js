import { Inter } from "next/font/google";
import Navbar from "../components/Navbar"; 
import ScrollToTop from "../components/ScrollToTop";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SMID Lab", 
  description: "Laboratory of Semiconductor Materials for Intelligent Devices",
};

// 2. 뷰포트 설정 (아이폰 노치 대응 'cover' 추가)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // 👈 [추가] 아이폰 노치 영역까지 배경색 채우기
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* body에 overflowX: 'hidden'을 주어 가로 스크롤 원천 차단 */}
      <body className={inter.className} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        overflowX: 'hidden', // 👈 [중요] 가로 스크롤 방지
        width: '100%'        // 👈 [중요] 폭을 100%로 고정
      }}>
        
        <Navbar />

        <main style={{ flex: 1, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
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