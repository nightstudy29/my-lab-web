import Link from "next/link";
import papers from '../../data/papers.json';

export default function PublicationsPage() {
  // 최신순 정렬
  const sortedPapers = papers.sort((a, b) => b.year - a.year);

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* 1. 페이지 헤더 (SMID 스타일) */}
      <div style={{ marginBottom: '50px', borderBottom: '2px solid #004094', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333', margin: 0 }}>Publications</h1>
        <p style={{ color: '#666', marginTop: '10px', fontSize: '1rem' }}>
          Total: {sortedPapers.length}
        </p>
      </div>

      {/* 2. 논문 리스트 */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sortedPapers.map((paper) => (
          <li key={paper.id} style={{ marginBottom: '40px' }}>
            
            {/* [제목] 촌스러운 파란색(#0070f3) -> 진한 네이비(#004094)로 변경 */}
            <Link 
              href={paper.url} 
              target="_blank" 
              style={{ textDecoration: 'none' }}
            >
              <h2 style={{ 
                fontSize: '1.25rem',
                color: '#004094',  // ★ 여기가 포인트입니다
                fontWeight: '700',
                marginBottom: '8px',
                lineHeight: '1.4',
                cursor: 'pointer',
              }}>
                {paper.title}
              </h2>
            </Link>

            {/* [저자] 하이픈(-) 보정 기능 그대로 유지 */}
            <div 
              style={{ fontSize: '1rem', color: '#444', marginBottom: '6px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ 
                __html: paper.authors.replace(/\s*[‐–-]\s*/g, '-') 
              }} 
            />

            {/* [저널/학회 + 연도] 검은 박스 대신 깔끔한 텍스트 스타일로 변경 */}
            <div style={{ fontSize: '0.95rem', color: '#666' }}>
              <span style={{ fontStyle: 'italic', fontWeight: '600', color: '#222' }}>
                {paper.conference}
              </span>
              <span>, {paper.year}</span>
            </div>

          </li>
        ))}
      </ul>

    </div>
  );
}