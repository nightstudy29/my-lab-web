"use client";

import newsData from '../../data/news.json'; // 데이터 불러오기
import { FaCalendarAlt, FaTag } from "react-icons/fa"; // 아이콘

export default function NewsPage() {
  // 최신순 정렬 (날짜 기준 내림차순)
  const sortedNews = [...(newsData || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  // 카테고리별 뱃지 색상 결정 함수
  const getCategoryColor = (category) => {
    const cat = category.toLowerCase();
        
    if (cat.includes('announcement') || cat.includes('opening')) return '#d32f2f'; 
    if (cat.includes('paper')) return '#004094';    // 논문: 파란색
    if (cat.includes('award')) return '#f57f17';    // 수상: 금색
    if (cat.includes('conference')) return '#673ab7'; // 학회: 보라색
    if (cat.includes('event') || cat.includes('outing')) return '#2e7d32'; // 행사: 초록색
    
    return '#555'; // 기타: 회색
  };

  return (
    <div style={{ 
      padding: '60px 20px', 
      maxWidth: '800px', // 뉴스는 너무 넓으면 읽기 힘들어서 800px 정도가 적당함
      width: '100%', 
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>

      {/* 헤더 */}
      <div style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 style={{ 
          // [수정] 폰트 크기 자동 조절
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
        {sortedNews.map((item) => (
          <article key={item.id} style={{ 
            backgroundColor: '#fff', 
            borderRadius: '16px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', // 부드러운 그림자
            padding: '30px',
            border: '1px solid #eee',
            transition: 'transform 0.2s',
          }}>
            
            {/* 1. 상단 정보 (날짜 + 카테고리) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
              
              {/* 카테고리 뱃지 */}
              <span style={{ 
                backgroundColor: getCategoryColor(item.category), 
                color: '#fff', 
                padding: '5px 12px', 
                borderRadius: '20px', 
                fontSize: '0.8rem', 
                fontWeight: 'bold',
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px'
              }}>
                <FaTag size={10} />
                {item.category}
              </span>

              {/* 날짜 */}
              <span style={{ color: '#888', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaCalendarAlt size={12} />
                {item.date}
              </span>
            </div>

            {/* 2. 제목 및 내용 */}
            <h2 style={{ 
              // [수정] 모바일에서 너무 크지 않게 조절 (1.2rem ~ 1.5rem)
              fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', 
              color: '#222', 
              marginBottom: '12px', 
              lineHeight: '1.3',
              // [추가] 단어 중간에 줄바꿈 되지 않도록 설정 (한글 제목에 필수)
              wordBreak: 'keep-all' 
            }}>
              {item.title}
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#555', lineHeight: '1.7', margin: '0 0 20px 0', whiteSpace: 'pre-line' }}>
              {item.description}
            </p>

            {/* 3. 이미지 영역 (통일성 있게 수정됨) */}
            {item.images && item.images.length > 0 && (
              <div style={{ 
                display: 'grid', 
                // 사진이 1장이면 1열, 2장이면 2열, 3장이상이면 3열 등 자동 조절
                gridTemplateColumns: item.images.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '10px',
                marginTop: '20px'
              }}>
                {item.images.map((imgSrc, index) => {
                  // 사진이 1장일 때는 16:9 비율(직사각형), 여러 장일 때는 1:1 비율(정사각형)
                  const aspectRatio = item.images.length === 1 ? '56.25%' : '100%'; 

                  return (
                    <div key={index} style={{ 
                      position: 'relative', 
                      width: '100%', 
                      paddingBottom: aspectRatio, // 높이를 비율로 강제 고정
                      overflow: 'hidden',
                      borderRadius: '12px',
                      backgroundColor: '#f0f0f0', // 사진 로딩 전 회색 배경
                      border: '1px solid #eee'
                    }}>
                      <img 
                        src={imgSrc} 
                        alt="news image" 
                        style={{ 
                          position: 'absolute',
                          top: 0, 
                          left: 0,
                          width: '100%', 
                          height: '100%',
                          objectFit: 'cover',   // ★ 핵심: 비율 달라도 꽉 차게 크롭
                          objectPosition: 'center', // 사진의 가운데 부분을 보여줌
                          transition: 'transform 0.3s ease'
                        }} 
                        // 마우스 올리면 살짝 확대되는 효과 (선택사항)
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                      />
                    </div>
                  );
                })}
              </div>
            )}

          </article>
        ))}
      </div>
    </div>
  );
}