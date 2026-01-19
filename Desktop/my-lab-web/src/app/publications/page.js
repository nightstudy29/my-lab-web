import papers from '../../data/papers.json';

export default function PublicationsPage() {
  // Python의 sort와 비슷합니다. 연도(year)를 기준으로 내림차순(최신순) 정렬합니다.
  // b.year - a.year가 양수면 순서를 바꿉니다.
  const sortedPapers = papers.sort((a, b) => b.year - a.year);

  return (
    <div style={{ padding: '40px' }}>
      <h1>Publications</h1>
      <p style={{ marginBottom: '30px' }}>
        주요 연구 실적입니다. (Total: {sortedPapers.length})
      </p>

      <div>
        {sortedPapers.map((paper) => (
          <div key={paper.id} style={{ 
            marginBottom: '20px', 
            paddingBottom: '20px', 
            borderBottom: '1px solid #eee' 
          }}>
            {/* 연도 표시 배지 */}
            <span style={{ 
              backgroundColor: '#333', 
              color: 'white', 
              padding: '2px 8px', 
              borderRadius: '4px', 
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              {paper.year}
            </span>

            {/* 논문 제목 및 링크 */}
            <div style={{ marginTop: '5px' }}>
              <a 
                href={paper.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  textDecoration: 'none', 
                  color: '#0070f3' 
                }}
              >
                {paper.title} 🔗
              </a>
            </div>

            {/* 저자 및 학회명 */}
            <p style={{ margin: '5px 0', color: '#555' }}>{paper.authors}</p>
            <p style={{ fontStyle: 'italic', color: '#666' }}>In {paper.conference}</p>
          </div>
        ))}
      </div>
    </div>
  );
}