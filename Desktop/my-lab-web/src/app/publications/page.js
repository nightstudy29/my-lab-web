"use client";

import Link from "next/link";
import { FaNewspaper } from "react-icons/fa6"; 
import papers from '../../data/papers.json';

export default function PublicationsPage() {
  // 최신순 정렬
  const sortedPapers = papers.sort((a, b) => b.year - a.year);

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* 1. 페이지 헤더 */}
      <div style={{ marginBottom: '50px', borderBottom: '2px solid #004094', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333', margin: 0 }}>Publications</h1>
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
              href={paper.url} 
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
              }}
              // ▼ 여기가 핵심입니다! 제목 안에 있는 태그(<sub> 등)를 해석하라는 뜻입니다.
              dangerouslySetInnerHTML={{ __html: paper.title }} 
            />
            </Link>

            {/* [저자] */}
            <div 
              style={{ fontSize: '1rem', color: '#444', marginBottom: '6px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ 
                __html: paper.authors.replace(/\s*[‐–-]\s*/g, '-') 
              }} 
            />

            {/* [저널/학회 + 연도] */}
            <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: '12px' }}>
              <span style={{ fontStyle: 'italic', fontWeight: '600', color: '#222' }}>
                {paper.conference}
              </span>
              <span>, {paper.year}</span>
            </div>

            {/* [뉴스 링크 영역] - 디자인 변경: 태그 스타일 */}
            {paper.news && paper.news.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                
                {/* Press 라벨 (선택 사항 - 필요 없으면 이 span 삭제 가능) */}
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 'bold', 
                  color: '#004094', 
                  alignSelf: 'center',
                  marginRight: '5px'
                }}>
                  MEDIA COVERAGE |
                </span>

                {/* 뉴스 리스트 (아이콘 + 이름) */}
                {paper.news.slice(0, 6).map((newsItem, index) => (
                  <a 
                    key={index} 
                    href={newsItem.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      backgroundColor: '#f0f7ff', // 아주 연한 하늘색 배경
                      border: '1px solid #cce0ff', // 연한 파란 테두리
                      borderRadius: '20px',       // 둥근 알약 모양
                      textDecoration: 'none',
                      color: '#004094',           // 글자색: SMID 네이비
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    // 마우스 올렸을 때 효과
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#004094';
                      e.currentTarget.style.color = '#ffffff'; // 글자가 흰색으로 반전
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    // 마우스 뗐을 때 원상복구
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f7ff';
                      e.currentTarget.style.color = '#004094';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FaNewspaper style={{ fontSize: '0.9rem' }} /> {/* 아이콘 */}
                    <span>{newsItem.name}</span> {/* 언론사 이름 */}
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