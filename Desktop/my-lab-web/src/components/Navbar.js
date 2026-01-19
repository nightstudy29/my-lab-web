"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // 기본 링크 스타일
  const linkStyle = {
    textDecoration: 'none',
    color: '#555',
    fontWeight: '500',
    fontSize: '0.95rem',
    transition: 'color 0.2s',
    whiteSpace: 'nowrap',
  };

  // 활성화된(현재 페이지) 링크 스타일
  const activeStyle = {
    ...linkStyle,
    color: '#004094', // SMID 메인 컬러
    fontWeight: '700',
  };

  // 현재 메뉴가 활성화 상태인지 확인하는 함수 (부분 일치 허용)
  // 예: /research/detail 페이지에 있어도 Research 메뉴에 불이 들어오게 함
  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
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
        flexWrap: 'wrap',       
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: '15px'             
      }}>
        
        {/* 1. 로고 영역 */}
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

        {/* 2. 메뉴 링크들 */}
        <nav style={{ 
          display: 'flex', 
          gap: '25px', // 간격을 조금 더 넓혔습니다
          alignItems: 'center',
          flexWrap: 'wrap',    
          justifyContent: 'center' 
        }}>
          {/* 각 링크마다 isActive 함수를 사용하여 현재 페이지 확인 */}
          <Link href="/" style={isActive('/') ? activeStyle : linkStyle}>Home</Link>
          <Link href="/research" style={isActive('/research') ? activeStyle : linkStyle}>Research</Link>
          <Link href="/publications" style={isActive('/publications') ? activeStyle : linkStyle}>Publications</Link>
          <Link href="/members" style={isActive('/members') ? activeStyle : linkStyle}>Members</Link>
          <Link href="/equipment" style={isActive('/equipment') ? activeStyle : linkStyle}>Equipment</Link>
          <Link href="/news" style={isActive('/news') ? activeStyle : linkStyle}>News</Link>
          <Link href="/contact" style={isActive('/contact') ? activeStyle : linkStyle}>Contact</Link>
        </nav>
      </div>
    </header>
  );
}