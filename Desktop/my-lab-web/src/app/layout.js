import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Suh Research Group",
  description: "Advanced Energy Materials & Systems Lab",
};

export default function RootLayout({ children }) {
  // 메뉴 스타일 (글자색, 폰트 등)
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
            
            {/* 로고 / 연구실 이름 */}
            <Link href="/" style={{ textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
              Suh Research Group
            </Link>

            {/* 메뉴 링크들 (여기가 핵심입니다!) */}
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
        <footer style={{ borderTop: '1px solid #eee', padding: '30px 20px', textAlign: 'center', color: '#888', fontSize: '0.9rem', marginTop: 'auto', backgroundColor: '#f9f9f9' }}>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} Suh Research Group. All rights reserved.</p>
        </footer>

      </body>
    </html>
  );
}