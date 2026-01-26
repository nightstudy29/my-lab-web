"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import ReactGA from "react-ga4";

export default function GoogleAnalytics({ trackingId }) {
  const pathname = usePathname();

  useEffect(() => {
    // GA 초기화
    ReactGA.initialize(trackingId);
  }, [trackingId]);

  useEffect(() => {
    // 페이지 이동 시마다 페이지 뷰 전송
    if (pathname) {
      ReactGA.send({ hitType: "pageview", page: pathname });
    }
  }, [pathname]);

  return null;
}