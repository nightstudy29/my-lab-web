import { Inter } from "next/font/google";
import Navbar from "../components/Navbar"; // 방금 만든 Navbar 불러오기
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 1. 메타데이터 (제목, 설명)
export const metadata = {
  title: "SMID Lab", 
  description: "Laboratory of Semiconductor Materials for Intelligent Devices",
};

// 2. ★ 핵심: 모바일 뷰포트 설정 (이게 있어야 모바일 크기에 딱 맞음)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* Navbar 컴포넌트 사용 */}
        <Navbar />

        {/* 페이지 본문 */}
        <main style={{ flex: 1, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          {children}
        </main>

        {/* 하단 푸터 */}
        <footer style={{ borderTop: '1px solid #eee', padding: '40px 20px', textAlign: 'center', backgroundColor: '#f9f9f9', color: '#666', marginTop: 'auto' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px', color: '#444' }}>SMID Lab</p>
          <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Laboratory of Semiconductor Materials for Intelligent Devices</p>
          <p style={{ fontSize: '0.8rem', color: '#999' }}>© {new Date().getFullYear()} SMID Lab. All rights reserved.</p>
        </footer>

      </body>
    </html>
  );
}