// src/app/page.js
export default function Home() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
        Future AI Lab 🤖
      </h1>
      <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#555' }}>
        미래를 선도하는 인공지능 연구실입니다.<br />
        Deep Learning, Computer Vision, NLP 등 다양한 분야를 연구합니다.
      </p>
      
      <div style={{ marginTop: '50px' }}>
        <h3>📢 Latest News</h3>
        <ul style={{ textAlign: 'left', marginTop: '20px', paddingLeft: '20px' }}>
          <li>[2024.03] CVPR 2024 논문 2편 채택! 🎉</li>
          <li>[2024.02] 신입 석사 과정 김철수 학생 입학</li>
          <li>[2024.01] 연구재단 과제 선정</li>
        </ul>
      </div>
    </div>
  );
}