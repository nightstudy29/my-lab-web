"use client";

import { useState, useRef, useEffect } from 'react';
import newsData from '../../data/news.json';
import { FaCalendarAlt, FaTag, FaImages, FaChevronLeft, FaChevronRight, FaLink } from "react-icons/fa"; 

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 300; 

      for (const year of years) {
        const element = document.getElementById(`year-${year}`);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveYear(year);
            break; 
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [years]);

  const getCategoryColor = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('announcement') || cat.includes('opening')) return '#d32f2f'; 
    if (cat.includes('paper')) return '#004094';
    if (cat.includes('award')) return '#f57f17';
    if (cat.includes('conference')) return '#673ab7';
    if (cat.includes('event') || cat.includes('outing')) return '#2e7d32'; 
    return '#555';
  };

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

      {/* [핵심 1] align-items 제거하여 높이 Stretch 유지 (트랙 확보) */}
      <div className="news-layout-container" style={{ display: 'flex', gap: '60px', position: 'relative' }}>

        {/* === 좌측: 뉴스 피드 === */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {years.map((year) => (
            <div key={year} id={`year-${year}`} style={{ marginBottom: '50px', scrollMarginTop: '120px' }}> {/* 간격 축소 80px -> 50px */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', color: '#004094' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginRight: '15px' }}>{year}</h2>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e9ecef' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}> {/* 카드 간격 축소 40px -> 20px */}
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

        {/* === 우측: Timeline Track === */}
        {/* aside 자체는 뉴스 영역만큼 길게 늘어납니다 */}
        <aside className="year-nav" style={{ width: '120px', minWidth: '120px' }}>
          
          {/* [핵심 2] sticky는 이 내부 div에 적용 */}
          <div style={{ 
            position: 'sticky', 
            top: '120px', // 스크롤 시 화면 상단 120px 위치에 고정
            marginTop: '10px'
          }}>
            
            <div style={{ position: 'relative', paddingLeft: '20px' }}>
              {/* 세로 선 */}
              <div style={{ 
                position: 'absolute', left: '26px', top: '10px', bottom: '10px', 
                width: '2px', backgroundColor: '#e9ecef', zIndex: 0 
              }}></div>

              {/* 연도별 점(Dot) */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative', zIndex: 1 }}>
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
                        }}></div>
                        
                        <span style={{
                          fontSize: '0.95rem',
                          fontWeight: isActive ? '800' : '500',
                          color: isActive ? '#004094' : '#adb5bd',
                          transition: 'all 0.3s ease',
                          transform: isActive ? 'translateX(5px)' : 'none'
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

      </div>

      <style jsx>{`
        @media (max-width: 1000px) {
          .year-nav { display: none !important; }
        }
      `}</style>
      
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .news-link-btn:hover {
          background-color: #e9ecef !important;
          color: #212529 !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

// === NewsCard 컴포넌트 (슬림 가로 레이아웃 버전) ===
function NewsCard({ item, getCategoryColor, anchorId }) {
  const [imgIndex, setImgIndex] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false); // [추가] 확장 상태 관리
  const scrollRef = useRef(null);
  
  const hasImages = item.images && item.images.length > 0;
  const hasMultipleImages = item.images && item.images.length > 1;

  // 글자 수가 일정 이상일 때만 Read More 버튼을 보여주기 위한 기준
  const isLongText = item.description && item.description.length > 80;

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
        flexDirection: 'row',
        minHeight: isExpanded ? 'auto' : '220px', // [수정] 확장 시 높이 자동 조절
        transition: 'all 0.3s ease'
    }} className="news-card-mobile">
      
      {/* 1. 이미지 영역 */}
      {hasImages && (
        <div style={{ 
          position: 'relative', 
          width: '280px', 
          minWidth: '280px',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #f0f0f0',
          alignSelf: isExpanded ? 'stretch' : 'auto' // [추가] 글이 길어져도 이미지는 영역 유지
        }} className="news-image-container">
          {/* ... 슬라이더 버튼 및 로직 기존과 동일 ... */}
          <div ref={scrollRef} onScroll={handleScroll} className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', height: '100%' }}>
            {item.images.map((imgSrc, idx) => (
              <div key={idx} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', width: '100%', height: '100%' }}>
                <img src={imgSrc} alt="news" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. 텍스트 영역 */}
      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ backgroundColor: getCategoryColor(item.category), color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>
            {item.category}
          </span>
          <span style={{ color: '#999', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaCalendarAlt size={10} /> {item.date}
          </span>
        </div>

        <h2 style={{ fontSize: '1.2rem', color: '#222', marginBottom: '12px', fontWeight: '700', lineHeight: '1.4' }}>
          {item.title}
        </h2>
        
        {/* [수정] 설명 텍스트 영역 */}
        <div style={{ position: 'relative' }}>
          <p style={{ 
            fontSize: '0.95rem', 
            color: '#444', 
            lineHeight: '1.6', 
            margin: '0',
            whiteSpace: 'pre-line', // 줄바꿈 허용
            display: isExpanded ? 'block' : '-webkit-box', // [핵심] 확장 여부에 따라 박스 모델 변경
            WebkitLineClamp: isExpanded ? 'none' : '3', 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden'
          }}>
            {item.description}
          </p>

          {/* [추가] Read More 버튼 */}
          {isLongText && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none',
                border: 'none',
                color: '#004094',
                fontSize: '0.85rem',
                fontWeight: '600',
                padding: '8px 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '5px'
              }}
            >
              {isExpanded ? "Show Less" : "Read More..."}
            </button>
          )}
        </div>

        {/* 링크 버튼 (확장 시에 더 잘 보이게 위치 조정) */}
        {item.link && (
          <div style={{ marginTop: '15px' }}>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="news-link-btn"
               style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: '#495057', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none' }}>
              <FaLink size={10} /> Link
            </a>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .news-card-mobile { flex-direction: column !important; min-height: auto !important; }
          .news-image-container { width: 100% !important; height: 220px !important; border-right: none !important; border-bottom: 1px solid #f0f0f0; }
        }
      `}</style>
    </article>
  );
}