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
          padding: '40px 15px', // 모바일 여백을 고려해 좌우 패딩 살짝 축소
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: 'auto' 
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            display: 'flex', 
            flexDirection: 'row',     // 무조건 가로 유지
            alignItems: 'center',     // 세로축 중앙
            justifyContent: 'center',  // 전체 중앙 정렬
            gap: '20px',              // 모바일에서 너무 벌어지지 않게 간격 살짝 축소
            flexWrap: 'nowrap'        // [중요] 절대 줄바꿈 되지 않도록 설정
          }}>
            
            {/* [왼쪽] 서울대학교 로고 */}
            <div style={{ flexShrink: 0 }}>
              <img 
                src="/images/logo/snu_logo_white.png" 
                alt="SNU Logo" 
                style={{ 
                  height: 'clamp(50px, 10vw, 80px)', // 화면 크기에 따라 로고 크기가 유동적으로 조절됨
                  width: 'auto', 
                  opacity: '0.95',
                  display: 'block'
                }} 
              />
            </div>

            {/* [오른쪽] 연구실 및 소속 정보 */}
            <div style={{ 
              textAlign: 'left',
              flexShrink: 1,  // 공간이 부족하면 텍스트 영역이 줄어듦
              minWidth: 0     // flexbox 안에서 텍스트 줄바꿈이 정상 작동하게 함
            }}>
              <p style={{ 
                fontSize: 'clamp(0.85rem, 2vw, 1rem)', // 폰트 크기도 유동적 조절
                fontWeight: '700', 
                marginBottom: '2px',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap' // 'SMID Lab'은 한 줄 유지
              }}>
                SMID Lab
              </p>
              <p style={{ 
                fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)', // 본문 크기 유동적 조절
                color: '#ccd6f6', 
                lineHeight: '1.4',
                margin: 0,
                wordBreak: 'keep-all' // 단어 단위로 줄바꿈되어 깔끔하게 유지
              }}>
                <strong>Semiconductor Materials & Intelligent Devices Lab</strong><br />
                <span style={{ fontSize: '0.9em' }}>Dept. of Materials Science & Engineering, SNU</span>
              </p>
              <p style={{ 
                fontSize: 'clamp(0.6rem, 1.2vw, 0.75rem)', 
                color: 'rgba(255,255,255,0.4)', 
                marginTop: '6px' 
              }}>
                © {new Date().getFullYear()} SMID Lab.
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