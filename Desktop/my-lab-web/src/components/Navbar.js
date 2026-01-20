"use client";

import Link from "next/link";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // [수정 1] 메뉴 목록에 'Lab Portal' 추가 (맨 뒤에 배치)
  const menuItems = [
    'Home', 
    'Research', 
    'Members', 
    'Publications', 
    'Equipment', 
    'News', 
    'Contact', 
    'Lab Portal'
  ];

  // [수정 2] 경로 생성 헬퍼 함수
  // 'Lab Portal' -> '/labportal' (공백 제거)로 변환하기 위해 필요
  const getPath = (item) => {
    if (item === 'Home') return '/';
    return `/${item.toLowerCase().replace(/\s+/g, '')}`; 
  };

  return (
    <nav style={{ 
      backgroundColor: '#002b5e', 
      color: '#fff', 
      padding: '12px 20px', 
      position: 'sticky', 
      top: 0, 
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        
        {/* [LOGO AREA] */}
        <Link href="/" style={{ 
          textDecoration: 'none', 
          color: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px'
        }}>
          <img 
            src="/images/snu_logo_white.png" 
            alt="SNU Logo" 
            style={{ 
              height: '45px', 
              width: 'auto',
              display: 'block'
            }} 
          />
          <span style={{ 
            fontSize: '1.6rem', 
            fontWeight: '800', 
            letterSpacing: '-0.5px',
            lineHeight: '1'
          }}>
            SMID Lab
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="desktop-menu" style={{ display: 'flex', gap: '25px' }}>
          {menuItems.map((item) => (
            <Link 
              key={item} 
              href={getPath(item)} // 위에서 만든 함수 사용
              style={{ 
                color: '#fff', 
                textDecoration: 'none', 
                fontWeight: '500', 
                fontSize: '1rem',
                transition: 'opacity 0.2s',
                // Lab Portal은 약간 다르게 보이게 하고 싶다면 아래 주석 해제
                // opacity: item === 'Lab Portal' ? 0.7 : 1 
              }}
              className="nav-link"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Icon */}
        <div className="mobile-menu-icon" onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer', display: 'none' }}>
          {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div style={{ 
          backgroundColor: '#003366', 
          padding: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '15px',
          marginTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          {menuItems.map((item) => (
            <Link 
              key={item} 
              href={getPath(item)} // 위에서 만든 함수 사용
              onClick={() => setIsOpen(false)}
              style={{ color: '#fff', textDecoration: 'none', fontSize: '1.1rem' }}
            >
              {item}
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .nav-link:hover {
          opacity: 0.8;
        }
        @media (max-width: 1000px) { /* 메뉴가 많아져서 브레이크포인트를 조금 늘렸습니다 (900->1000) */
          .desktop-menu { display: none !important; }
          .mobile-menu-icon { display: block !important; }
        }
      `}</style>
    </nav>
  );
}