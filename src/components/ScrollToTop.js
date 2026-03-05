"use client";

import { useState, useEffect, useCallback } from "react";
import { FaArrowUp } from "react-icons/fa6";
import styles from "./ScrollToTop.module.css";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // ✅ useCallback으로 함수 재생성 방지
  const toggleVisibility = useCallback(() => {
    setIsVisible(window.scrollY > 300);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [toggleVisibility]);

  if (!isVisible) return null; // ✅ Fragment 제거, 더 깔끔

  return (
    // ✅ <div> → <button> (접근성 개선)
    <button
      onClick={scrollToTop}
      className={styles.scrollBtn}
      aria-label="Scroll to top"
    >
      <FaArrowUp />
    </button>
  );
}