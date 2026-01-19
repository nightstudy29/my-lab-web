export default function ResearchPage() {
  return (
    // ▼ 1. 가장 바깥쪽 부모 div (여기가 제일 중요합니다!)
    <div style={{ 
      padding: '60px 20px', // 위아래 60px, 양옆 20px 여백
      maxWidth: '1000px',   // PC에서는 1000px까지만 커짐
      width: '100%',        // 👈 모바일에서 화면 꽉 채우기 (필수)
      margin: '0 auto',     // 중앙 정렬
      boxSizing: 'border-box' // 👈 패딩 때문에 화면 밖으로 튀어 나가는 것 방지
    }}>
      <h1>Research</h1>
      <p>Research will be updated soon.</p>
    </div>
  );
}