import GoogleAnalytics from "../components/GoogleAnalytics";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar"; 
import ScrollToTop from "../components/ScrollToTop";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SMID Lab", 
  description: "Laboratory of Semiconductor Materials for Intelligent Devices",
};

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

        {/* footer 수정 시작 */}
        <footer style={{ 
          backgroundColor: '#002b5e', 
          color: '#fff', 
          padding: '40px 20px', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: 'auto' 
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            display: 'flex', 
            flexDirection: 'row',     // 가로 배치
            alignItems: 'center',     // 세로축 중앙
            justifyContent: 'center',  // 전체 덩어리를 화면 중앙으로
            gap: '30px',              // 로고와 텍스트 사이 간격
            flexWrap: 'wrap'          // 모바일 대응
          }}>
            
            {/* [왼쪽] 서울대학교 로고 */}
            <div style={{ flexShrink: 0 }}>
              <img 
                src="/images/logo/snu_logo_white.png" 
                alt="SNU Logo" 
                style={{ 
                  height: '100px',      // 푸터용 적당한 크기
                  width: 'auto', 
                  opacity: '0.95' 
                }} 
              />
            </div>

            {/* [중간] 세로 구분선 (선택 사항: 원치 않으시면 이 div를 지우셔도 됩니다) */}
            <div style={{ 
              width: '1px', 
              height: '40px', 
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'none', // 기본적으로 숨김 (화면이 넓을 때만 보이게 하려면 미디어쿼리 필요)
            }} className="footer-divider" /> 

            {/* [오른쪽] 연구실 및 소속 정보 */}
            <div style={{ 
              textAlign: 'left', 
              minWidth: '280px' 
            }}>
              <p style={{ 
                fontSize: '1rem', 
                fontWeight: '700', 
                marginBottom: '4px',
                letterSpacing: '0.5px'
              }}>
                SMID Lab
              </p>
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#ccd6f6', 
                lineHeight: '1.5',
                margin: 0
              }}>
                <strong>Semiconductor Materials & Intelligent Devices Lab</strong><br />
                Department of Materials Science & Engineering, Seoul National University
              </p>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.4)', 
                marginTop: '10px' 
              }}>
                © {new Date().getFullYear()} SMID Lab. All rights reserved.
              </p>
            </div>

          </div>
        </footer>
        {/* footer 수정 끝 */}

        <ScrollToTop />
        
      </body>
    </html>
  );
}