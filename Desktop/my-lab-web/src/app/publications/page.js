import Link from "next/link";
import { FaNewspaper } from "react-icons/fa6"; // 신문 아이콘 불러오기
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
              <h2 style={{ 
                fontSize: '1.25rem',
                color: '#004094', 
                fontWeight: '700',
                marginBottom: '8px',
                lineHeight: '1.4',
                cursor: 'pointer',
              }}>
                {paper.title}
              </h2>
            </Link>

            {/* [저자] */}
            <div 
              style={{ fontSize: '1rem', color: '#444', marginBottom: '6px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ 
                __html: paper.authors.replace(/\s*[‐–-]\s*/g, '-') 
              }} 
            />

            {/* [저널/학회 + 연도] */}
            <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: '10px' }}>
              <span style={{ fontStyle: 'italic', fontWeight: '600', color: '#222' }}>
                {paper.conference}
              </span>
              <span>, {paper.year}</span>
            </div>

            {/* [뉴스 링크 영역] - 데이터에 'news'가 있을 때만 표시 */}
            {paper.news && paper.news.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#004094', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  backgroundColor: '#eef4ff',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  Press
                </span>
                
                {/* 최대 6개까지만 자르고(.slice(0,6)) 보여줌 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {paper.news.slice(0, 6).map((newsItem, index) => (
                    <a 
                      key={index} 
                      href={newsItem.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title={`Media coverage: ${newsItem.name}`} // 마우스 올리면 언론사 이름 뜸
                      style={{ 
                        color: '#666', 
                        fontSize: '1.2rem', 
                        display: 'flex', 
                        alignItems: 'center',
                        transition: 'color 0.2s, transform 0.1s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = '#004094'; // 호버 시 SMID 블루
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = '#666';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <FaNewspaper />
                    </a>
                  ))}
                </div>
              </div>
            )}

          </li>
        ))}
      </ul>
    </div>
  );
}