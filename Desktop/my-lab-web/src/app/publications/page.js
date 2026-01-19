"use client"; // 👈 이게 없으면 "Event handlers..." 에러가 나서 빌드가 터집니다!

import Link from "next/link";
import { FaNewspaper } from "react-icons/fa6"; 
import papers from '../../data/papers.json'; // 경로가 정확한지 확인해주세요

export default function PublicationsPage() {
  // 데이터가 제대로 로드되지 않았을 경우를 대비한 안전장치
  if (!papers) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>No papers data found.</div>;
  }

  // 최신순 정렬 (papers 원본을 건드리지 않도록 [...papers]로 복사 후 정렬)
  const sortedPapers = [...papers].sort((a, b) => b.year - a.year);

  return (
    <div style={{ 
      padding: '60px 20px', 
      maxWidth: '1000px',   
      width: '100%',        
      margin: '0 auto',     
      boxSizing: 'border-box' 
    }}>
      
      {/* 1. 페이지 헤더 */}
      <div style={{ marginBottom: '50px', borderBottom: '2px solid #004094', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333', margin: 0, wordBreak: 'break-word' }}>Publications</h1>
        <p style={{ color: '#666', marginTop: '10px', fontSize: '1rem' }}>
          Total: {sortedPapers.length}
        </p>
      </div>

      {/* 2. 논문 리스트 */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sortedPapers.map((paper) => (
          <li key={paper.id} style={{ marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px dashed #eee' }}>
            
            {/* [제목] */}
            <Link 
              href={paper.url || "#"} 
              target="_blank" 
              style={{ textDecoration: 'none' }}
            >
            <h2 
              style={{ 
                fontSize: '1.25rem',
                color: '#004094', 
                fontWeight: '700',
                marginBottom: '8px',
                lineHeight: '1.4',
                cursor: 'pointer',
                wordBreak: 'break-word' // 모바일에서 제목 잘림 방지
              }}
              dangerouslySetInnerHTML={{ __html: paper.title }} 
            />
            </Link>

            {/* [저자] */}
            <div 
              style={{ fontSize: '1rem', color: '#444', marginBottom: '6px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ 
                __html: paper.authors ? paper.authors.replace(/\s*[‐–-]\s*/g, '-') : "" 
              }} 
            />

            {/* [저널/학회 + 연도] */}
            <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: '12px' }}>
              <span style={{ fontStyle: 'italic', fontWeight: '600', color: '#222' }}>
                {paper.conference}
              </span>
              <span>, {paper.year}</span>
            </div>

            {/* [뉴스 링크 영역] */}
            {paper.news && paper.news.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 'bold', 
                  color: '#004094', 
                  alignSelf: 'center',
                  marginRight: '5px'
                }}>
                  MEDIA COVERAGE |
                </span>

                {paper.news.slice(0, 6).map((newsItem, index) => (
                  <a 
                    key={index} 
                    href={newsItem.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px',
                      backgroundColor: '#f0f7ff', border: '1px solid #cce0ff', borderRadius: '20px',
                      textDecoration: 'none', color: '#004094', fontSize: '0.85rem', fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    // 마우스 오버 효과 (use client 필수)
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#004094';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f7ff';
                      e.currentTarget.style.color = '#004094';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FaNewspaper style={{ fontSize: '0.9rem' }} />
                    <span>{newsItem.name}</span>
                  </a>
                ))}
              </div>
            )}

          </li>
        ))}
      </ul>
    </div>
  );
}