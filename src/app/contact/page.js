// Contact — 서버 컴포넌트. 연락 채널 · 위치 · 모집 안내.
import { FaEnvelope, FaPhone, FaLocationDot, FaUserGraduate, FaCheck, FaArrowUpRightFromSquare } from "react-icons/fa6";
import styles from './page.module.css';

const EMAIL = 'junminsuh@snu.ac.kr';
const PHONE = '+82-2-880-8463';

const LOCATIONS = [
  { number: '18', title: 'Professor Office', room: 'Building 18, Room 405', accent: 'blue', maps: 'https://maps.app.goo.gl/mVkc698chUkL4HrB9' },
  { number: '31', title: 'Student Lab', room: 'Building 31, Room 204-3', accent: 'green', maps: 'https://maps.app.goo.gl/LN8xpMhKz97z3xCF8' },
];

const POSITIONS = ['MS', 'PhD', 'MS–PhD Integrated', 'Postdoc', 'Undergraduate Intern'];
const CHECKLIST = ['CV (Curriculum Vitae)', 'Academic transcript', 'A short note on your research interests'];

export default function ContactPage() {
  return (
    <div className={styles.pageWrapper}>

      {/* ===== Hero ===== */}
      <section className={styles.hero}>
        <div className={styles.heroPattern} aria-hidden="true" />
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Contact</span>
          <h1 className={styles.heroTitle}>Get in touch</h1>
          <p className={styles.heroLead}>
            Questions about our research, collaboration, or joining the lab — we&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <div className={styles.content}>

        {/* ===== Join Us (맨 위) ===== */}
        <section className={styles.recruit}>
          <div className={styles.recruitMain}>
            <span className={styles.recruitEyebrow}><FaUserGraduate size={12} /> Join us</span>
            <h2 className={styles.recruitTitle}>We&apos;re recruiting</h2>
            <p className={styles.recruitDesc}>
              We are always looking for <strong>highly motivated students and researchers</strong> who want to work on
              semiconductor materials and intelligent devices. Prior experience is welcome but not required — curiosity is.
            </p>
            <div className={styles.positions}>
              {POSITIONS.map((p) => <span key={p} className={styles.positionChip}>{p}</span>)}
            </div>
          </div>
          <div className={styles.recruitAside}>
            <div className={styles.checklistTitle}>Please send</div>
            <ul className={styles.checklist}>
              {CHECKLIST.map((item) => <li key={item}><FaCheck size={11} /> {item}</li>)}
            </ul>
            <a href={`mailto:${EMAIL}?subject=${encodeURIComponent('[SMID Lab] Application')}`} className={styles.recruitBtn}>
              <FaEnvelope size={13} /> Email your application
            </a>
          </div>
        </section>

        {/* ===== 연락 채널 ===== */}
        <div className={styles.channels}>
          <a href={`mailto:${EMAIL}`} className={styles.channel}>
            <span className={`${styles.channelIcon} ${styles.iconBlue}`}><FaEnvelope /></span>
            <span className={styles.channelLabel}>Email</span>
            <span className={styles.channelValue}>{EMAIL}</span>
            <span className={styles.channelSub}>Prof. Jun Min Suh · replies within a few days</span>
          </a>
          <a href={`tel:${PHONE.replace(/[^\d+]/g, '')}`} className={styles.channel}>
            <span className={`${styles.channelIcon} ${styles.iconGreen}`}><FaPhone /></span>
            <span className={styles.channelLabel}>Phone</span>
            <span className={styles.channelValue}>{PHONE}</span>
            <span className={styles.channelSub}>Professor office · weekdays</span>
          </a>
          <div className={styles.channel}>
            <span className={`${styles.channelIcon} ${styles.iconAmber}`}><FaLocationDot /></span>
            <span className={styles.channelLabel}>Address</span>
            <span className={styles.channelValue}>1 Gwanak-ro, Gwanak-gu</span>
            <span className={styles.channelSub}>Seoul National University · Seoul 08826, Korea</span>
          </div>
        </div>
        <p className={styles.channelsNote}>Email is the best way to reach us. The phone number is for the professor office.</p>

        {/* ===== 위치 ===== */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Where to find us</h2>
            <p className={styles.sectionDesc}>Dept. of Materials Science &amp; Engineering, Seoul National University (Gwanak campus)</p>
          </div>

          <div className={styles.grid}>
            {LOCATIONS.map((loc) => (
              <div key={loc.number} className={`${styles.locationCard} ${styles[`accent_${loc.accent}`]}`}>
                <div className={styles.buildingBadge}>
                  <span className={styles.buildingLabel}>Bldg</span>
                  <span className={styles.buildingNumber}>{loc.number}</span>
                </div>
                <div className={styles.locationBody}>
                  <h3 className={styles.locationTitle}>{loc.title}</h3>
                  <p className={styles.locationRoom}>{loc.room}</p>
                  <a href={loc.maps} target="_blank" rel="noopener noreferrer" className={styles.mapsLink}>
                    Open in Google Maps <FaArrowUpRightFromSquare size={11} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
