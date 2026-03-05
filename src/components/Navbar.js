"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes } from "react-icons/fa";
import styles from "./Navbar.module.css";

const menuItems = [
  'Home',
  'Research',
  'Members',
  'Publications',
  // 'Equipment',
  'News',
  'Contact',
  'Lab Portal'
];

const getPath = (item) => {
  if (item === 'Home') return '/';
  if (item === 'Lab Portal') return '/login';
  return `/${item.toLowerCase().replace(/\s+/g, '')}`;
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname(); // ✅ 현재 경로 감지

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>

        {/* 로고 영역 */}
        <Link href="/" className={styles.logo}>
          <Image
            src="/images/logo/lab_logo_trans.png"
            alt="SMID Lab Logo"
            width={45}
            height={45}
            style={{ width: 'auto', height: '45px' }}
          />
          <span className={styles.logoText}>SMID Lab</span>
        </Link>

        {/* 데스크탑 메뉴 - ✅ CSS 모듈로 처리 */}
        <div className={styles.desktopMenu}>
          {menuItems.map((item) => {
            const path = getPath(item);
            const isActive = pathname === path;
            return (
              <Link
                key={item}
                href={path}
                className={isActive ? styles.navLinkActive : styles.navLink}
              >
                {item}
              </Link>
            );
          })}
        </div>

        {/* 모바일 햄버거 아이콘 - ✅ CSS 모듈로 처리 */}
        <button
          className={styles.mobileIcon}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu" // ✅ 접근성
        >
          {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

      </div>

      {/* 모바일 드롭다운 */}
      {isOpen && (
        <div className={styles.mobileMenu}>
          {menuItems.map((item) => {
            const path = getPath(item);
            const isActive = pathname === path;
            return (
              <Link
                key={item}
                href={path}
                onClick={() => setIsOpen(false)}
                className={isActive ? styles.mobileLinkActive : styles.mobileLink}
              >
                {item}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}