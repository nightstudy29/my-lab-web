"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import newsData from '../../data/news.json';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaLink } from "react-icons/fa";

// ✅ scroll-behavior는 globals.css에 추가 권장:
// html { scroll-behavior: smooth; }

const getCategoryColor = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('announcement') || cat.includes('opening')) return '#d32f2f';
  if (cat.includes('paper')) return '#004094';
  if (cat.includes('award')) return '#f57f17';
  if (cat.includes('conference')) return '#673ab7';
  if (cat.includes('event') || cat.includes('outing')) return '#2e7d32';
  return '#555';
};

// ===== NewsCard 컴포넌트 =====
function NewsCard({ item, anchorId, isExpanded: isExpandedProp }) {
  const [imgIndex, setImgIndex] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);
  const scrollRef = useRef(null);
  const textRef = useRef(null);

  const hasImages = item.images && item.images.length > 0;
  const hasMultipleImages = item.images && item.images.length > 1;

  useEffect(() => {
    const checkClamped = () => {
      if (textRef.current) {
        const { scrollHeight, clientHeight } = textRef.current;
        setIsClamped(scrollHeight > clientHeight);
      }
    };
    const timer = setTimeout(checkClamped, 100);
    window.addEventListener('resize', checkClamped);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkClamped);
    };
  }, [item.description]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      setImgIndex(Math.round(scrollLeft / width) + 1);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({ left: direction * width, behavior: 'smooth' });
    }
  };

  return (
    <article
      id={anchorId}
      style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid #f0f0f0',
        overflow: 'hidden',
        scrollMarginTop: '110px',
        display: 'flex',
        // ✅ style jsx 없이 반응형: 모바일은 JS로 처리
        flexDirection: hasImages ? 'row' : 'row',
        minHeight: isExpanded ? 'auto' : '160px',
        transition: 'all 0.3s ease'
      }}
    >
      {/* 이미지 영역 */}
      {hasImages && (
        <div style={{
          position: 'relative',
          width: '280px',
          minWidth: '280px',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #f0f0f0'
        }}>
          {/* 이전/다음 버튼 */}
          {hasMultipleImages && (
            <>
              <button
                onClick={() => scroll(-1)}
                style={{
                  position: 'absolute', top: '50%', left: '5px',
                  transform: 'translateY(-50%)', width: '28px', height: '28px',
                  borderRadius: '50%', border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.3)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 10
                }}
              >
                <FaChevronLeft size={12} />
              </button>
              <button
                onClick={() => scroll(1)}
                style={{
                  position: 'absolute', top: '50%', right: '5px',
                  transform: 'translateY(-50%)', width: '28px', height: '28px',
                  borderRadius: '50%', border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.3)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 10
                }}
              >
                <FaChevronRight size={12} />
              </button>
            </>
          )}

          {/* 이미지 슬라이더 */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              width: '100%',
              height: '100%',
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE
            }}
          >
            {item.images.map((imgSrc, idx) => (
              <div
                key={idx}
                style={{
                  flex: '0 0 100%',
                  scrollSnapAlign: 'start',
                  position: 'relative',
                  width: '100%',
                  minHeight: '220px'
                }}
              >
                {/* ✅ <img> → Next.js <Image> with fill */}
                <Image
                  src={imgSrc}
                  alt={`${item.title} 이미지 ${idx + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="280px"
                />
              </div>
            ))}
          </div>

          {/* 이미지 카운터 */}
          {hasMultipleImages && (
            <div style={{
              position: 'absolute', bottom: '10px', right: '10px',
              backgroundColor: 'rgba(0,0,0,0.5)', color: 'white',
              padding: '2px 8px', borderRadius: '10px',
              fontSize: '0.7rem', pointerEvents: 'none'
            }}>
              {imgIndex} / {item.images.length}
            </div>
          )}
        </div>
      )}

      {/* 텍스트 영역 */}
      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        {/* 카테고리 + 날짜 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{
            backgroundColor: getCategoryColor(item.category),
            color: '#fff', padding: '3px 8px',
            borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700'
          }}>
            {item.category}
          </span>
          <span style={{ color: '#999', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaCalendarAlt size={10} /> {item.date}
          </span>
        </div>

        {/* 제목 */}
        <h2 style={{ fontSize: '1.2rem', color: '#222', marginBottom: '12px', fontWeight: '700', lineHeight: '1.4' }}>
          {item.title}
        </h2>

        {/* 본문 */}
        <div style={{ position: 'relative' }}>
          <p
            ref={textRef}
            style={{
              fontSize: '0.95rem', color: '#444', lineHeight: '1.6', margin: '0',
              whiteSpace: 'pre-line',
              display: isExpanded ? 'block' : '-webkit-box',
              WebkitLineClamp: isExpanded ? 'none' : '3',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {item.description}
          </p>
          {(isClamped || isExpanded) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none', border: 'none', color: '#004094',
                fontSize: '0.85rem', fontWeight: '600', padding: '8px 0',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '4px', marginTop: '5px'
              }}
            >
              {isExpanded ? "Show Less" : "Read More..."}
            </button>
          )}
        </div>

        {/* 링크 버튼 - ✅ useState hover로 처리 */}
        {item.link && (
          <div style={{ marginTop: '15px' }}>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setLinkHovered(true)}
              onMouseLeave={() => setLinkHovered(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px',
                backgroundColor: linkHovered ? '#e9ecef' : '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                color: linkHovered ? '#212529' : '#495057',
                fontSize: '0.8rem', fontWeight: '600',
                textDecoration: 'none',
                transform: linkHovered ? 'translateY(-1px)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <FaLink size={10} /> Link
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

// ===== 메인 페이지 =====
export default function NewsPage() {
  const sortedNews = [...(newsData || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  const newsByYear = sortedNews.reduce((acc, item) => {
    const year = item.date.substring(0, 4);
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {});
  const years = Object.keys(newsByYear).sort((a, b) => b - a);

  const [activeYear, setActiveYear] = useState(years[0]);
  // ✅ 모바일 여부를 JS로 감지 (style jsx 대신)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1000);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 300;

      // ✅ 위/아래 스크롤 모두 정확히 작동
      // offsetTop이 scrollPosition 이하인 것 중 가장 아래 연도를 선택
      let currentYear = years[years.length - 1]; // 기본값: 가장 오래된 연도

      for (const year of [...years].reverse()) {
        const element = document.getElementById(`year-${year}`);
        if (element && element.offsetTop <= scrollPosition) {
          currentYear = year;
          break;
        }
      }

      setActiveYear(currentYear);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // ✅ 초기 로드 시에도 실행
    return () => window.removeEventListener('scroll', handleScroll);
  }, [years]);

  return (
    <div style={{
      padding: '60px 20px',
      maxWidth: '1100px',
      width: '100%',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>

      {/* 헤더 */}
      <div style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: '10px', color: '#333', fontWeight: '800' }}>
          Lab News
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          SMID Lab의 최신 소식과 일상을 공유합니다.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '60px', position: 'relative' }}>

        {/* 뉴스 피드 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {years.map((year) => (
            <div key={year} id={`year-${year}`} style={{ marginBottom: '50px', scrollMarginTop: '120px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', color: '#004094' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginRight: '15px' }}>{year}</h2>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e9ecef' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {newsByYear[year].map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    getCategoryColor={getCategoryColor}
                    anchorId={`news-${item.id}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ✅ 연도 네비 - style jsx 없이 isMobile로 처리 */}
        {!isMobile && (
          <aside style={{ width: '120px', minWidth: '120px' }}>
            <div style={{ position: 'sticky', top: '120px', marginTop: '10px' }}>
              <div style={{ position: 'relative', paddingLeft: '20px' }}>

                {/* 세로 선 */}
                <div style={{
                  position: 'absolute', left: '26px', top: '10px', bottom: '10px',
                  width: '2px', backgroundColor: '#e9ecef', zIndex: 0
                }} />

                {/* 연도 목록 */}
                <ul style={{
                  listStyle: 'none', padding: 0, margin: 0,
                  display: 'flex', flexDirection: 'column', gap: '30px',
                  position: 'relative', zIndex: 1
                }}>
                  {years.map((year) => {
                    const isActive = activeYear === year;
                    return (
                      <li key={year} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <a
                          href={`#year-${year}`}
                          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '15px' }}
                        >
                          <div style={{
                            width: isActive ? '14px' : '10px',
                            height: isActive ? '14px' : '10px',
                            borderRadius: '50%',
                            backgroundColor: isActive ? '#004094' : '#fff',
                            border: isActive ? '2px solid #004094' : '2px solid #ced4da',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            transform: isActive ? 'scale(1.2)' : 'scale(1)',
                            boxShadow: isActive ? '0 0 0 4px rgba(0, 64, 148, 0.1)' : 'none'
                          }} />
                          <span style={{
                            fontSize: '0.95rem',
                            fontWeight: isActive ? '800' : '500',
                            color: isActive ? '#004094' : '#adb5bd',
                            transition: 'all 0.3s ease',
                            transform: isActive ? 'translateX(5px)' : 'none',
                            display: 'inline-block'
                          }}>
                            {year}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}