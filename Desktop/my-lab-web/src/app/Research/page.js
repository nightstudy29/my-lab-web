"use client";

import researchData from '../../data/research.json';

export default function ResearchPage() {
  return (
    <div style={{ width: '100%' }}>
      
      {/* 1. 헤더 (배경 이미지 없이 깔끔한 스타일) */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '80px 20px', 
        textAlign: 'center',
        borderBottom: '1px solid #eee'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '15px', color: '#333', fontWeight: '800' }}>
          Research Areas
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
          Our research focuses on the intersection of advanced materials and novel device architectures
          to enable next-generation computing and sensing systems.
        </p>
      </div>

      {/* 2. 연구 주제 리스트 (지그재그 레이아웃) */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 20px' }}>
        {researchData.map((item, index) => (
          <ResearchSection key={item.id} item={item} index={index} />
        ))}
      </div>

    </div>
  );
}

// 개별 연구 주제 컴포넌트
function ResearchSection({ item, index }) {
  // 짝수 번째(0, 2...)는 [이미지-텍스트], 홀수 번째(1, 3...)는 [텍스트-이미지] 순서
  const isEven = index % 2 === 0;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row', // 기본은 가로 배치
      flexWrap: 'wrap',     // 화면 작으면 줄바꿈
      alignItems: 'center', 
      justifyContent: 'space-between',
      marginBottom: '100px', // 항목 간 간격
      gap: '50px'
    }}>
      
      {/* 이미지 영역 (순서 조절: order 속성 사용 가능하지만, 조건부 렌더링이 더 직관적) */}
      {/* 화면이 넓을 때: 짝수면 왼쪽, 홀수면 오른쪽 배치 */}
      <div style={{ 
        flex: '1 1 450px', // 최소 450px, 남은 공간 채움
        order: isEven ? 1 : 2, // 짝수면 1번(왼쪽), 홀수면 2번(오른쪽)
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <img 
          src={item.image} 
          alt={item.title} 
          style={{ width: '100%', height: 'auto', display: 'block' }} 
        />
      </div>

      {/* 텍스트 영역 */}
      <div style={{ 
        flex: '1 1 450px', 
        order: isEven ? 2 : 1, // 짝수면 2번(오른쪽), 홀수면 1번(왼쪽)
        textAlign: 'left'
      }}>
        <h2 style={{ 
          fontSize: '2rem', 
          color: '#004094', 
          marginBottom: '20px', 
          fontWeight: '700',
          borderLeft: '5px solid #004094',
          paddingLeft: '15px'
        }}>
          {item.title}
        </h2>
        <div 
          style={{ fontSize: '1.1rem', color: '#444', lineHeight: '1.8' }}
          // HTML 태그(줄바꿈 등)를 적용하기 위해 dangerouslySetInnerHTML 사용
          dangerouslySetInnerHTML={{ __html: item.description }}
        />
      </div>

      {/* 모바일 대응을 위한 스타일 (CSS Media Query 대용) */}
      <style jsx>{`
        @media (max-width: 900px) {
          div { flex-direction: column !important; }
          div > div { order: unset !important; width: 100% !important; }
          h2 { font-size: 1.6rem !important; }
        }
      `}</style>
    </div>
  );
}