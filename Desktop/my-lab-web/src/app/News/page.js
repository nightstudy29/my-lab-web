"use client";

import { useState } from 'react';
import newsData from '../../data/news.json';
import { FaCalendarAlt, FaTag, FaImages } from "react-icons/fa";

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
      maxWidth: '700px', // 가독성을 위해폭을 살짝 좁힘
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

// 개별 뉴스 카드 컴포넌트 (슬라이더 로직 분리)
function NewsCard({ item, getCategoryColor }) {
  const [imgIndex, setImgIndex] = useState(1); // 현재 보고 있는 이미지 번호

  // 스크롤 이벤트로 현재 페이지 번호 계산
  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const index = Math.round(scrollLeft / width) + 1;
    setImgIndex(index);
  };

  const hasMultipleImages = item.images && item.images.length > 1;

  return (
    <article style={{ 
      backgroundColor: '#fff', 
      borderRadius: '20px', 
      boxShadow: '0 2px 15px rgba(0,0,0,0.05)', 
      border: '1px solid #f0f0f0',
      overflow: 'hidden' // 자식 요소 튀어나옴 방지
    }}>
      
      {/* 1. 상단 정보 (Padding 적용) */}
      <div style={{ padding: '25px 25px 10px 25px' }}>
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
        
        {/* [수정] 긴 링크 줄바꿈 처리 (word-break: break-word) */}
        <p style={{ 
          fontSize: '1rem', 
          color: '#444', 
          lineHeight: '1.6', 
          margin: '0 0 15px 0', 
          whiteSpace: 'pre-line',
          wordBreak: 'break-word',       // 단어 단위로 줄바꿈
          overflowWrap: 'anywhere'       // 긴 URL 강제 줄바꿈
        }}>
          {item.description}
        </p>
      </div>

      {/* 2. 이미지 영역 (인스타그램 스타일 슬라이더) */}
      {item.images && item.images.length > 0 && (
        <div style={{ position: 'relative', width: '100%', backgroundColor: '#000' }}>
          
          {/* 가로 스크롤 컨테이너 */}
          <div 
            onScroll={handleScroll}
            style={{ 
              display: 'flex', 
              overflowX: 'auto', 
              scrollSnapType: 'x mandatory', // 스냅 효과 (필수)
              scrollbarWidth: 'none',        // 스크롤바 숨김 (Firefox)
              msOverflowStyle: 'none',       // 스크롤바 숨김 (IE)
              width: '100%',
              aspectRatio: '4/3',            // 사진 비율 고정 (인스타 느낌)
            }}
            className="hide-scrollbar" // 아래 style jsx로 크롬 스크롤바 숨김
          >
            {item.images.map((imgSrc, index) => (
              <div key={index} style={{ 
                flex: '0 0 100%',            // 한 번에 하나씩 꽉 차게
                scrollSnapAlign: 'start',    // 스냅 위치
                position: 'relative',
                width: '100%',
                height: '100%'
              }}>
                <img 
                  src={imgSrc} 
                  alt={`news-${index}`} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', // 비율 안 맞으면 꽉 차게 자름
                    display: 'block'
                  }} 
                />
              </div>
            ))}
          </div>

          {/* 사진 번호 뱃지 (1/3) - 사진이 여러 장일 때만 표시 */}
          {hasMultipleImages && (
            <div style={{ 
              position: 'absolute', 
              top: '15px', 
              right: '15px', 
              backgroundColor: 'rgba(0, 0, 0, 0.6)', 
              color: 'white', 
              padding: '4px 10px', 
              borderRadius: '12px', 
              fontSize: '0.8rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(4px)'
            }}>
              <FaImages size={10} />
              {imgIndex} / {item.images.length}
            </div>
          )}
        </div>
      )}

      {/* 크롬/사파리 스크롤바 숨기기 스타일 */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </article>
  );
}