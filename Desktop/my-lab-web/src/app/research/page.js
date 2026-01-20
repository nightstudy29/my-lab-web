"use client";

import researchData from '../../data/research.json';

export default function ResearchPage() {
  return (
    <div style={{ width: '100%' }}>
      
      {/* 1. 헤더 */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '80px 20px', 
        textAlign: 'center',
        borderBottom: '1px solid #eee'
      }}>
        <h1 style={{ 
          // [수정] 폰트 크기 자동 조절
          fontSize: 'clamp(2rem, 5vw, 2.5rem)', 
          marginBottom: '15px', 
          color: '#333', 
          fontWeight: '800' 
        }}>
          Research Areas
        </h1>
        <p style={{ 
          fontSize: 'clamp(1rem, 3vw, 1.1rem)', 
          color: '#666', 
          maxWidth: '800px', 
          margin: '0 auto', 
          lineHeight: '1.6' 
        }}>
          Our research focuses on the intersection of advanced materials and novel device architectures
          to enable next-generation computing and sensing systems.
        </p>
      </div>

      {/* 2. 연구 주제 리스트 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
        {researchData.map((item, index) => (
          <ResearchSection key={item.id} item={item} index={index} />
        ))}
      </div>

    </div>
  );
}

// 개별 연구 주제 컴포넌트
function ResearchSection({ item, index }) {
  const isEven = index % 2 === 0;

  return (
    // [수정] className 추가 (스타일 격리 목적)
    <div className="research-section-container" style={{ 
      display: 'flex', 
      flexWrap: 'wrap',     
      alignItems: 'center', 
      justifyContent: 'space-between',
      marginBottom: '100px', 
      gap: '50px'
    }}>
      
      {/* 이미지 영역 */}
      <div className="research-image-wrapper" style={{ 
        // [수정] flex-basis를 450px -> 300px로 줄여 모바일에서 자연스럽게 줄바꿈 유도
        flex: '1 1 300px', 
        order: isEven ? 1 : 2, 
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
        // 높이 자동 조절을 위해 별도 높이 지정 안 함
      }}>
        <img 
          src={item.image} 
          alt={item.title} 
          style={{ 
            width: '100%', 
            height: 'auto', 
            display: 'block',
            objectFit: 'cover' // 이미지가 찌그러지지 않게 방지
          }} 
        />
      </div>

      {/* 텍스트 영역 */}
      <div className="research-text-wrapper" style={{ 
        flex: '1 1 300px', // 텍스트 영역도 300px 최소 너비 가짐
        order: isEven ? 2 : 1,
        textAlign: 'left'
      }}>
        <h2 style={{ 
          // [수정] 모바일 폰트 크기 대응
          fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
          color: '#004094', 
          marginBottom: '20px', 
          fontWeight: '700',
          borderLeft: '5px solid #004094',
          paddingLeft: '15px',
          wordBreak: 'keep-all' // 단어 끊김 방지
        }}>
          {item.title}
        </h2>
        <div 
          style={{ 
            fontSize: 'clamp(1rem, 3vw, 1.1rem)', 
            color: '#444', 
            lineHeight: '1.8' 
          }}
          dangerouslySetInnerHTML={{ __html: item.description }}
        />
      </div>

      {/* [중요 수정 사항]
        기존의 div { ... } 선택자는 너무 광범위해서 페이지 내 모든 div를 깨뜨릴 수 있습니다.
        아래와 같이 className을 지정하여 구체적으로 타겟팅합니다.
      */}
      <style jsx>{`
        @media (max-width: 900px) {
          .research-section-container {
            flex-direction: column !important;
            gap: 30px !important;
            margin-bottom: 60px !important;
          }
          .research-image-wrapper, 
          .research-text-wrapper {
            order: unset !important; /* 순서 초기화 (이미지가 항상 위로 오게 됨) */
            width: 100% !important;
            flex: none !important;
          }
          /* 이미지를 항상 위로 올리고 싶다면 아래 코드 활성화 */
          .research-image-wrapper { order: -1 !important; }
        }
      `}</style>
    </div>
  );
}