// ✅ MemberCard 별도 컴포넌트로 분리
// ✅ <img> → Next.js <Image> 컴포넌트
// ✅ 빈 문자열 링크 필터링 (member.links?.cv && cv !== "")

import Image from 'next/image';
import { FaFilePdf, FaLinkedin, FaUser } from 'react-icons/fa6';
import { SiGooglescholar, SiOrcid } from 'react-icons/si';
import styles from './MemberCard.module.css';

export default function MemberCard({ member }) {
  const { name, role, joined, email, area, image, links } = member;

  return (
    <div className={styles.card}>

      {/* 프로필 이미지 */}
      <div className={styles.imageWrapper}>
        {image ? (
          <Image
            src={image}
            alt={name}
            width={85}
            height={85}
            className={styles.image}
          />
        ) : (
          <div className={styles.imageFallback}>
            <FaUser size={30} color="#adb5bd" />
          </div>
        )}
      </div>

      {/* 텍스트 정보 */}
      <div className={styles.info}>

        {/* 이름 + 링크 아이콘 */}
        <div className={styles.nameRow}>
          <h2 className={styles.name}>{name}</h2>
          <div className={styles.links}>
            {/* ✅ 빈 문자열 필터링 */}
            {links?.cv && (
              <a href={links.cv} target="_blank" rel="noopener noreferrer" title="CV" className={styles.linkIcon}>
                <FaFilePdf size={16} color="#d32f2f" />
              </a>
            )}
            {links?.googleScholar && (
              <a href={links.googleScholar} target="_blank" rel="noopener noreferrer" title="Google Scholar" className={styles.linkIcon}>
                <SiGooglescholar size={16} color="#4285F4" />
              </a>
            )}
            {links?.linkedin && (
              <a href={links.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className={styles.linkIcon}>
                <FaLinkedin size={16} color="#0077b5" />
              </a>
            )}
            {links?.orcid && (
              <a href={links.orcid} target="_blank" rel="noopener noreferrer" title="ORCID" className={styles.linkIcon}>
                <SiOrcid size={16} color="#A6CE39" />
              </a>
            )}
          </div>
        </div>

        {/* 직함 */}
        <p className={styles.role}>{role}</p>

        <hr className={styles.divider} />

        {/* 세부 정보 */}
        <div className={styles.details}>
          {joined && <div className={styles.joined}>Joined {joined}</div>}
          <div className={styles.email}>✉️ {email}</div>
          {area && <div className={styles.area}>{area}</div>}
        </div>

      </div>
    </div>
  );
}