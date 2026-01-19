import papers from '../../data/papers.json';

export default function PublicationsPage() {
  const sortedPapers = papers.sort((a, b) => b.year - a.year);

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Publications</h1>
      <p style={{ marginBottom: '40px', fontSize: '1.1rem', color: '#555' }}>
        Total: {sortedPapers.length}
      </p>

      <div>
        {sortedPapers.map((paper) => (
          <div key={paper.id} style={{ 
            marginBottom: '30px', 
            paddingBottom: '30px', 
            borderBottom: '1px solid #eee' 
          }}>
            {/* 연도 표시 */}
            <span style={{ 
              backgroundColor: '#333', 
              color: 'white', 
              padding: '4px 10px', 
              borderRadius: '4px', 
              fontSize: '0.9rem',
              fontWeight: 'bold',
              display: 'inline-block',
              marginBottom: '10px'
            }}>
              {paper.year}
            </span>

            {/* 논문 제목 */}
            <div style={{ marginBottom: '8px' }}>
              <a 
                href={paper.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '700', 
                  textDecoration: 'none', 
                  color: '#0070f3',
                  lineHeight: '1.4'
                }}
              >
                {paper.title} 🔗
              </a>
            </div>

            {/* ★핵심: 저자 이름 (HTML 태그 적용) */}
            <div 
              style={{ color: '#444', lineHeight: '1.6', fontSize: '1rem' }}
              // ↓ 이 부분이 <b> 태그를 작동하게 만듭니다.
              dangerouslySetInnerHTML={{ __html: paper.authors }} 
            />

            {/* 학회/저널 정보 */}
            <p style={{ 
              marginTop: '5px', 
              fontStyle: 'italic', 
              color: '#666',
              fontSize: '0.95rem'
            }}>
              In {paper.conference}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}