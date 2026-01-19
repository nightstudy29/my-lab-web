import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 1. 브라우저 탭에 표시될 이름과 설명 수정
export const metadata = {
  title: "SMID Lab", 
  description: "Laboratory of Semiconductor Materials for Intelligent Devices",
};

export default function RootLayout({ children }) {
  // 메뉴 스타일
  const linkStyle = {
    textDecoration: 'none',
    color: '#555',
    fontWeight: '500',
    fontSize: '1rem',
    transition: 'color 0.2s',
  };

  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, padding: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* 상단 네비게이션 바 */}
        <header style={{ borderBottom: '1px solid #eee', padding: '20px 0', backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* 2. 로고 영역: 텍스트로 로고 느낌 내기 */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', lineHeight: '1.2' }} title="Laboratory of Semiconductor Materials for Intelligent Devices">
              <div style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                <span style={{ color: '#004094' }}>SMID</span> {/* 진한 파란색 포인트 */}
                <span style={{ color: '#333' }}> Lab</span>
              </div>
              {/* 작은 글씨로 풀네임 살짝 보여주기 (선택사항 - 지저분하면 이 줄 삭제 가능) */}
              <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: '400', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Semiconductor Materials for Intelligent Devices
              </span>
            </Link>

            {/* 메뉴 링크들 */}
            <nav style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
              <Link href="/" style={linkStyle}>Home</Link>
              <Link href="/research" style={linkStyle}>Research</Link>
              <Link href="/members" style={linkStyle}>Members</Link>
              <Link href="/publications" style={linkStyle}>Publications</Link>
              <Link href="/equipment" style={linkStyle}>Equipment</Link>
              <Link href="/news" style={linkStyle}>News</Link>
              <Link href="/contact" style={linkStyle}>Contact</Link>
            </nav>
          </div>
        </header>

        {/* 페이지 본문 */}
        <main style={{ flex: 1 }}>
          {children}
        </main>

        {/* 하단 푸터 */}
        <footer style={{ borderTop: '1px solid #eee', padding: '40px 20px', textAlign: 'center', backgroundColor: '#f9f9f9', color: '#666' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px', color: '#444' }}>SMID Lab</p>
          <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Laboratory of Semiconductor Materials for Intelligent Devices</p>
          <p style={{ fontSize: '0.8rem', color: '#999' }}>© {new Date().getFullYear()} SMID Lab. All rights reserved.</p>
        </footer>

      </body>
    </html>
  );
}