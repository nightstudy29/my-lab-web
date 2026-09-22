// 공개 Members 페이지 카드 — 컴팩트 가로형.
// 사진(56px) | 이름 + 링크 아이콘 / 직함 (+Co-advisor) / 입학 · 이메일 / 연구분야

import Image from 'next/image';
import { FaFilePdf, FaLinkedin, FaUser } from 'react-icons/fa6';
import { SiGooglescholar, SiOrcid } from 'react-icons/si';
import styles from './MemberCard.module.css';

export default function MemberCard({ member }) {
  const { name, role, coAdvisor, joined, email, area, image, links } = member;

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {image ? (
          <Image src={image} alt={name} width={56} height={56} className={styles.image} />
        ) : (
          <div className={styles.imageFallback}><FaUser size={22} color="#adb5bd" /></div>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.nameRow}>
          <h2 className={styles.name} title={name}>{name}</h2>
          <div className={styles.links}>
            {links?.cv && <a href={links.cv} target="_blank" rel="noopener noreferrer" title="CV" className={styles.linkIcon}><FaFilePdf size={14} color="#d32f2f" /></a>}
            {links?.googleScholar && <a href={links.googleScholar} target="_blank" rel="noopener noreferrer" title="Google Scholar" className={styles.linkIcon}><SiGooglescholar size={14} color="#4285F4" /></a>}
            {links?.linkedin && <a href={links.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className={styles.linkIcon}><FaLinkedin size={14} color="#0077b5" /></a>}
            {links?.orcid && <a href={links.orcid} target="_blank" rel="noopener noreferrer" title="ORCID" className={styles.linkIcon}><SiOrcid size={14} color="#A6CE39" /></a>}
          </div>
        </div>

        <p className={styles.role}>{role}</p>
        {coAdvisor && <p className={styles.coAdvisor}>Co-advisor: {coAdvisor}</p>}

        {(joined || email) && (
          <p className={styles.meta}>
            {joined && <span>Joined {joined}</span>}
            {joined && email && <span className={styles.dot}>·</span>}
            {email && <a href={`mailto:${email}`} className={styles.email}>{email}</a>}
          </p>
        )}

        {area && <p className={styles.area} title={area}>{area}</p>}
      </div>
    </div>
  );
}
