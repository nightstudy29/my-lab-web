// ✅ "use client" 제거 → 서버 컴포넌트로 동작 (성능 향상)

import researchData from '../../data/research.json';
import ResearchSection from '../../components/ResearchSection';
import styles from './page.module.css';

export default function ResearchPage() {
  return (
    <div style={{ width: '100%' }}>

      {/* 1. 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>Research Areas</h1>
        <p className={styles.subtitle}>
          Our research focuses on the intersection of advanced materials and novel device architectures
          to enable next-generation computing and sensing systems.
        </p>
      </div>

      {/* 2. 연구 주제 리스트 */}
      <div className={styles.container}>
        {researchData.map((item, index) => (
          <ResearchSection key={item.id} item={item} index={index} />
        ))}
      </div>

    </div>
  );
}