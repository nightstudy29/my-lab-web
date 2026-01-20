"use client";

import Link from "next/link";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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

  // [수정된 부분] 경로 생성 헬퍼 함수
  const getPath = (item) => {
    if (item === 'Home') return '/';
    
    // 🚨 [핵심] Lab Portal을 누르면 곧바로 '/labportal'로 가지 않고
    // 일단 '/login' (로그인 페이지)으로 보내줍니다.
    if (item === 'Lab Portal') return '/login'; 
    
    // 나머지는 기존 규칙대로 (예: Research -> /research)
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
              href={getPath(item)} // 수정된 getPath 사용
              style={{ 
                color: '#fff', 
                textDecoration: 'none', 
                fontWeight: '500', 
                fontSize: '1rem',
                transition: 'opacity 0.2s',
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
              href={getPath(item)} 
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
        @media (max-width: 1000px) {
          .desktop-menu { display: none !important; }
          .mobile-menu-icon { display: block !important; }
        }
      `}</style>
    </nav>
  );
}