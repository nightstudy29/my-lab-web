// ✅ ResearchSection을 별도 컴포넌트 파일로 분리
// ✅ <Image fill> → 비율이 살짝 다른 이미지도 찌그러짐 없이 처리
// ✅ style jsx → CSS 모듈로 분리
// ✅ dangerouslySetInnerHTML 유지 (research.json 직접 관리하는 내부 데이터라 안전)

import Image from 'next/image';
import styles from './ResearchSection.module.css';

export default function ResearchSection({ item, index }) {
  const isEven = index % 2 === 0;

  return (
    <div className={styles.container}>

      {/* 이미지 영역 - ✅ fill로 비율 자동 맞춤 */}
      <div
        className={styles.imageWrapper}
        style={{ order: isEven ? 1 : 2 }}
      >
        <Image
          src={item.image}
          alt={item.title}
          fill
          className={styles.image}
          sizes="(max-width: 900px) 100vw, 50vw"
        />
      </div>

      {/* 텍스트 영역 */}
      <div
        className={styles.textWrapper}
        style={{ order: isEven ? 2 : 1 }}
      >
        <h2 className={styles.itemTitle}>{item.title}</h2>
        <div
          className={styles.description}
          dangerouslySetInnerHTML={{ __html: item.description }}
        />
      </div>

    </div>
  );
}