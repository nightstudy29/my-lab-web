"use client"; // 클라이언트 기능(이벤트 리스너) 사용 필수

import { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa6"; // 화살표 아이콘

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // 스크롤 감지 함수
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // 맨 위로 올리는 함수
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // 부드럽게 스크롤
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <>
      {isVisible && (
        <div 
          onClick={scrollToTop}
          style={{
            position: "fixed",
            bottom: "40px",
            right: "40px",
            backgroundColor: "#002b5e", // 사이트 테마 컬러 (서울대 블루)
            color: "#fff",
            width: "50px",
            height: "50px",
            borderRadius: "50%", // 동그라미 모양
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "1.5rem",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            zIndex: 9999, // 다른 요소 위에 떠있도록
            transition: "all 0.3s ease",
            opacity: 0.9,
          }}
          // 마우스 올렸을 때 효과
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.backgroundColor = "#004094";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.backgroundColor = "#002b5e";
          }}
        >
          <FaArrowUp />
        </div>
      )}
    </>
  );
}