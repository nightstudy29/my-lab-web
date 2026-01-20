"use client";

import { useState, useRef } from 'react';
import newsData from '../../data/news.json';
// [추가] 링크 아이콘(FaLink) 추가
import { FaCalendarAlt, FaTag, FaImages, FaChevronLeft, FaChevronRight, FaLink } from "react-icons/fa"; 

export default function NewsPage() {
  const sortedNews = [...(newsData || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

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
      maxWidth: '700px', 
      width: '100%', 
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>

      {/* 헤더 */}
      <div style={{ marginBottom: '50px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: 'clamp(2rem, 5vw, 2.5rem)', 
          marginBottom: '10px', 
          color: '#333' 
        }}>
          Lab News
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          SMID Lab의 최신 소식과 일상을 공유합니다.
        </p>
      </div>

      {/* 뉴스 피드 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {sortedNews.map((item) => (
          <NewsCard key={item.id} item={item} getCategoryColor={getCategoryColor} />
        ))}
      </div>
    </div>
  );
}

// 개별 뉴스 카드 컴포넌트
function NewsCard({ item, getCategoryColor }) {
  const [imgIndex, setImgIndex] = useState(1);
  const scrollRef = useRef(null);

  const hasMultipleImages = item.images && item.images.length > 1;

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width) + 1;
      setImgIndex(index);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({ 
        left: direction * width, 
        behavior: 'smooth' 
      });
    }
  };

  return (
    <article style={{ 
      backgroundColor: '#fff', 
      borderRadius: '20px', 
      boxShadow: '0 2px 15px rgba(0,0,0,0.05)', 
      border: '1px solid #f0f0f0',
      overflow: 'hidden'
    }}>
      
      {/* 1. 상단 정보 */}
      <div style={{ padding: '25px 25px 20px 25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ 
            backgroundColor: getCategoryColor(item.category), 
            color: '#fff', 
            padding: '4px 10px', 
            borderRadius: '6px', 
            fontSize: '0.75rem', 
            fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <FaTag size={10} /> {item.category}
          </span>
          <span style={{ color: '#999', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaCalendarAlt size={11} /> {item.date}
          </span>
        </div>

        <h2 style={{ 
          fontSize: 'clamp(1.25rem, 4vw, 1.4rem)', 
          color: '#222', 
          marginBottom: '12px', 
          lineHeight: '1.35',
          wordBreak: 'keep-all' 
        }}>
          {item.title}
        </h2>
        
        {/* 설명글 */}
        <p style={{ 
          fontSize: '1rem', 
          color: '#444', 
          lineHeight: '1.6', 
          margin: '0 0 15px 0', 
          whiteSpace: 'pre-line',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere'
        }}>
          {item.description}
        </p>

        {/* [새로 추가된 부분] 관련 링크 버튼 */}
        {item.link && (
          <div style={{ marginTop: '10px' }}>
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#f8f9fa', // 아주 연한 회색 배경
                border: '1px solid #dee2e6',
                borderRadius: '20px',       // 둥근 알약 모양
                color: '#495057',
                fontSize: '0.9rem',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              // 마우스 올렸을 때 효과를 위한 클래스 (아래 style jsx 참조)
              className="news-link-btn"
            >
              <FaLink size={12} /> 관련 링크
            </a>
          </div>
        )}
      </div>

      {/* 2. 이미지 영역 */}
      {item.images && item.images.length > 0 && (
        <div style={{ position: 'relative', width: '100%', backgroundColor: '#000' }}>
          
          {hasMultipleImages && imgIndex > 1 && (
            <button 
              onClick={() => scroll(-1)}
              style={{
                position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white', border: 'none', borderRadius: '50%',
                width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10
              }}
            >
              <FaChevronLeft size={16} />
            </button>
          )}

          {hasMultipleImages && imgIndex < item.images.length && (
            <button 
              onClick={() => scroll(1)}
              style={{
                position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white', border: 'none', borderRadius: '50%',
                width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10
              }}
            >
              <FaChevronRight size={16} />
            </button>
          )}

          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            style={{ 
              display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none', msOverflowStyle: 'none', width: '100%', aspectRatio: '4/3',
            }}
            className="hide-scrollbar"
          >
            {item.images.map((imgSrc, index) => (
              <div key={index} style={{ 
                flex: '0 0 100%', scrollSnapAlign: 'start', position: 'relative', width: '100%', height: '100%'
              }}>
                <img 
                  src={imgSrc} 
                  alt={`news-${index}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                />
              </div>
            ))}
          </div>

          {hasMultipleImages && (
            <div style={{ 
              position: 'absolute', top: '15px', right: '15px', 
              backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white', padding: '4px 10px', borderRadius: '12px', 
              fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)', pointerEvents: 'none'
            }}>
              <FaImages size={10} />
              {imgIndex} / {item.images.length}
            </div>
          )}
        </div>
      )}

      {/* 스타일 정의: 스크롤바 숨김 + 버튼 호버 효과 */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        
        .news-link-btn:hover {
          background-color: #e9ecef !important;
          color: #212529 !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
      `}</style>
    </article>
  );
}