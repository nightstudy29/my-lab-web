// ✅ 서버 컴포넌트
import { FaLocationDot, FaMapLocationDot, FaUserGraduate, FaPhone } from "react-icons/fa6";
import styles from './page.module.css';

export default function ContactPage() {
  return (
    <div className={styles.pageWrapper}>

      {/* ===== Hero ===== */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Contact Us</h1>
          <p className={styles.heroSub}>
            SMID Lab · Dept. of Materials Science &amp; Engineering · Seoul National University
          </p>
        </div>
        <div className={styles.heroDot1} />
        <div className={styles.heroDot2} />
        <div className={styles.heroLine} />
      </div>

      <div className={styles.content}>

        {/* ===== Recruitment 배너 ===== */}
        <div className={styles.recruitBanner}>
          <div className={styles.recruitIcon}>
            <FaUserGraduate size={24} />
          </div>
          <div className={styles.recruitText}>
            <h2 className={styles.recruitTitle}>We&apos;re Recruiting</h2>
            <p className={styles.recruitDesc}>
              We are always looking for <strong>highly motivated graduate students</strong>.
              Please send your <strong>CV and transcript</strong> to{' '}
              <a href="mailto:junminsuh@snu.ac.kr" className={styles.inlineEmail}>
                junminsuh@snu.ac.kr
              </a>.
            </p>
          </div>
        </div>

        {/* ===== 주소 카드 그리드 ===== */}
        <div className={styles.grid}>

          <div className={styles.addressCard}>
            <div className={styles.addressHeader}>
              <div className={`${styles.addressDot} ${styles.dotBlue}`} />
              <h3 className={styles.addressTitle}>Professor Office</h3>
            </div>
            <p className={styles.addressRoom}>Building 18, Room 405</p>
            <p className={styles.addressPhone}>
              <FaPhone size={12} style={{ color: '#004094', flexShrink: 0 }} />
              +82-2-880-8463
            </p>
            <p className={styles.addressStreet}>
              Seoul National University<br />
              1 Gwanak-ro, Gwanak-gu<br />
              Seoul 08826, Republic of Korea
            </p>
            <a href="https://maps.app.goo.gl/mVkc698chUkL4HrB9" target="_blank" rel="noopener noreferrer"
              className={`${styles.mapsLink} ${styles.mapsBlue}`}>
              <FaMapLocationDot size={13} /> Google Maps
            </a>
          </div>

          <div className={styles.addressCard}>
            <div className={styles.addressHeader}>
              <div className={`${styles.addressDot} ${styles.dotGreen}`} />
              <h3 className={styles.addressTitle}>Student Lab</h3>
            </div>
            <p className={styles.addressRoom}>Building 31, Room 204-3</p>
            <p className={styles.addressPhone}>
              <FaPhone size={12} style={{ color: '#2e7d32', flexShrink: 0 }} />
              TBD
            </p>
            <p className={styles.addressStreet}>
              Seoul National University<br />
              1 Gwanak-ro, Gwanak-gu<br />
              Seoul 08826, Republic of Korea
            </p>
            <a href="https://maps.app.goo.gl/LN8xpMhKz97z3xCF8" target="_blank" rel="noopener noreferrer"
              className={`${styles.mapsLink} ${styles.mapsGreen}`}>
              <FaMapLocationDot size={13} /> Google Maps
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}