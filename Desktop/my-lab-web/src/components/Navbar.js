"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const linkStyle = {
    textDecoration: 'none',
    color: '#555',
    fontWeight: '500',
    fontSize: '0.95rem',
    transition: 'color 0.2s',
    whiteSpace: 'nowrap', // 글자 줄바꿈 방지
  };

  const activeStyle = {
    ...linkStyle,
    color: '#004094', // 활성화된 메뉴 색상
    fontWeight: '700',
  };

  return (
    <header style={{ 
      borderBottom: '1px solid #eee', 
      backgroundColor: '#fff', 
      position: 'sticky', 
      top: 0, 
      zIndex: 100,
      width: '100%' 
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '15px 20px', 
        display: 'flex', 
        flexWrap: 'wrap',       // ★ 핵심: 화면 좁으면 줄바꿈
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: '15px'             // 로고와 메뉴 사이 간격
      }}>
        
        {/* 로고 영역 */}
        <div style={{ flexShrink: 0 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
              <span style={{ color: '#004094' }}>SMID</span>
              <span style={{ color: '#333' }}> Lab</span>
            </div>
            <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: '400', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Semiconductor Materials for Intelligent Devices
            </span>
          </Link>
        </div>

        {/* 메뉴 링크들 */}
        <nav style={{ 
          display: 'flex', 
          gap: '20px', 
          alignItems: 'center',
          flexWrap: 'wrap',    // 메뉴 많으면 자동 줄바꿈
          justifyContent: 'center' // 모바일에서 가운데 정렬
        }}>
          <Link href="/" style={pathname === '/' ? activeStyle : linkStyle}>Home</Link>
          <Link href="/research" style={pathname === '/research' ? activeStyle : linkStyle}>Research</Link>
          <Link href="/members" style={pathname === '/members' ? activeStyle : linkStyle}>Members</Link>
          <Link href="/publications" style={pathname === '/publications' ? activeStyle : linkStyle}>Publications</Link>
          <Link href="/equipment" style={pathname === '/equipment' ? activeStyle : linkStyle}>Equipment</Link>
          <Link href="/news" style={pathname === '/news' ? activeStyle : linkStyle}>News</Link>
          <Link href="/contact" style={pathname === '/contact' ? activeStyle : linkStyle}>Contact</Link>
        </nav>
      </div>
    </header>
  );
}