"use client";

import { useState, useEffect } from "react";

// 화면 폭이 breakpoint 이하면 true.
// 하이드레이션 전(서버 렌더 시점)에는 null을 돌려주므로, 호출하는 쪽에서
// `isMobile !== false`(모바일 우선) 또는 `isMobile === true`(데스크탑 우선) 중 원하는 기본값을 고르세요.
export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}
