import Image from "next/image"; // ✅ <img> → Next.js Image 컴포넌트 (자동 최적화)
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        {/* 왼쪽: 서울대학교 로고 */}
        <div className={styles.logoWrapper}>
          <Image
            src="/images/logo/snu_logo_white.png"
            alt="Seoul National University Logo"
            width={120}
            height={80}
            style={{ width: 'clamp(50px, 10vw, 120px)', height: 'auto' }}
          />
        </div>

        {/* 오른쪽: 연구실 정보 */}
        <div className={styles.info}>
          <p className={styles.labName}>SMID Lab</p>
          <p className={styles.labDesc}>
            <strong>Semiconductor Materials &amp; Intelligent Devices Lab</strong>
            <br />
            <span>Dept. of Materials Science &amp; Engineering, SNU</span>
          </p>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} SMID Lab. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}