// ✅ 서버 컴포넌트 (use client 불필요)

import membersData from '../../data/members.json';
import { FaTrophy, FaFileLines } from 'react-icons/fa6';
import MemberCard from '../../components/MemberCard';
import styles from './page.module.css';

export default function MembersPage() {
  if (!membersData) {
    return <div className={styles.loading}>Loading members data...</div>;
  }

  const { currentMembers = [], alumni = [], interns = [] } = membersData;

  return (
    <div className={styles.wrapper}>

      {/* ===== 1. Current Members ===== */}
      <section className={styles.section}>
        <h1 className={styles.sectionTitleLarge}>Current Members</h1>
        <div className={styles.membersGrid}>
          {currentMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </section>

      {/* ===== 2. Alumni ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Alumni</h2>
        {alumni.length > 0 ? (
          <div className={styles.alumniGrid}>
            {alumni.map((alum) => (
              <div key={alum.id} className={styles.alumniCard}>
                <strong>{alum.name}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>No alumni yet.</p>
        )}
      </section>

      {/* ===== 3. Former Interns ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Former Interns</h2>
        {interns.length > 0 ? (
          <ul className={styles.internGrid}>
            {interns.map((intern) => (
              <li key={intern.id} className={styles.internCard}>

                {/* 이름 + 성과 아이콘 */}
                <div className={styles.internTop}>
                  <span className={styles.internName}>{intern.name}</span>
                  {intern.achievements?.length > 0 && (
                    <div className={styles.internIcons}>
                      {intern.achievements.map((ach, idx) => (
                        <a
                          key={idx}
                          href={ach.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={ach.type === 'award' ? 'Award' : 'Paper'}
                          className={styles.internIconLink}
                        >
                          {ach.type === 'award' && <FaTrophy size={11} color="#f1c40f" />}
                          {ach.type === 'paper' && <FaFileLines size={11} color="#3498db" />}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* 프로그램 + 기간 */}
                <div className={styles.internBottom}>
                  <span className={styles.internProgram}>{intern.program || 'Intern'}</span>
                  <span className={styles.internPeriod}>{intern.period}</span>
                </div>

              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyText}>-</p>
        )}
      </section>

    </div>
  );
}