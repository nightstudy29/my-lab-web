import './globals.css';
import Navbar from '../components/Navbar'; // 방금 만든 메뉴바 가져오기

export const metadata = {
  title: 'My Research Lab',
  description: '연구실 홈페이지입니다.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {/* 여기에 메뉴바를 넣습니다 */}
        <Navbar />
        
        {/* children이 바로 우리가 만든 page.js 내용들이 들어가는 자리입니다 */}
        <main style={{ maxWidth: '800px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  );
}