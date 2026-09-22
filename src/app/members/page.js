// 공개 Members 페이지 — 서버 컴포넌트. Supabase members / interns 테이블에서 공개 컬럼만 읽습니다.
// (service_role 로 서버에서만 조회하므로 브라우저에 키가 노출되지 않음)
//
// - Current Members : status active + is_public. 정렬: PI → Postdoc → 학생 입학년도순 → Intern/Visitor → Staff
// - Alumni          : status graduated, degree ≠ Intern. "이름 · 학위 · 재적기간 · 현재 소속"
// - Former Interns  : interns 테이블 + (graduated & degree Intern 인 멤버)

import { FaTrophy, FaFileLines } from 'react-icons/fa6';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MEMBER_COLUMNS, toPublic } from '@/lib/memberShapes';
import { compareMembers, yearKey } from '@/lib/memberConstants';
import MemberCard from '../../components/MemberCard';
import styles from './page.module.css';

export const revalidate = 60; // 1분마다 갱신 (관리자 수정이 최대 1분 뒤 반영)

async function loadData() {
  const [{ data: memberRows }, { data: internRows }] = await Promise.all([
    supabaseAdmin.from('members').select(MEMBER_COLUMNS).eq('is_public', true),
    supabaseAdmin.from('interns').select('*').order('sort_order', { ascending: true, nullsFirst: false }).order('created_at'),
  ]);
  const rows = memberRows || [];

  const current = rows.filter((m) => m.status === 'active').sort(compareMembers).map(toPublic);

  const alumni = rows
    .filter((m) => m.status === 'graduated' && m.degree !== 'Intern')
    .sort((a, b) => yearKey(b.year_left) - yearKey(a.year_left) || yearKey(a.year_joined) - yearKey(b.year_joined))
    .map(toPublic);

  const memberInterns = rows
    .filter((m) => m.status === 'graduated' && m.degree === 'Intern')
    .map((m) => ({
      id: `m-${m.id}`,
      name: m.name_eng || m.name_kor,
      participations: [{ program: 'Lab Intern', period: [m.year_joined, m.year_left].filter(Boolean).join(' – ') }],
      achievements: [],
    }));
  const interns = [
    ...(internRows || []).map((it) => ({ id: it.id, name: it.name_eng, participations: it.participations || [], achievements: it.achievements || [] })),
    ...memberInterns,
  ];

  return { current, alumni, interns };
}

export default async function MembersPage() {
  const { current, alumni, interns } = await loadData();

  return (
    <div className={styles.wrapper}>

      {/* ===== 1. Current Members ===== */}
      <section className={styles.section}>
        <h1 className={styles.sectionTitleLarge}>Current Members</h1>
        <div className={styles.membersGrid}>
          {current.map((m) => (
            <MemberCard
              key={m.id}
              member={{
                name: m.nameEng || m.nameKor,
                role: m.positionLabel,
                joined: m.yearJoined,
                email: m.email,
                area: m.researchArea,
                motto: m.motto,
                image: m.photoUrl,
                links: { cv: m.links.cv, googleScholar: m.links.scholar, linkedin: m.links.linkedin, orcid: m.links.orcid },
              }}
            />
          ))}
        </div>
      </section>

      {/* ===== 2. Alumni ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Alumni</h2>
        {alumni.length > 0 ? (
          <div className={styles.alumniGrid}>
            {alumni.map((a) => (
              <div key={a.id} className={styles.alumniCard}>
                <strong>{a.nameEng || a.nameKor}</strong>
                <div style={{ fontSize: '0.82rem', color: '#666', marginTop: '4px' }}>
                  {a.degree !== 'TBD' && <span>{a.degree}</span>}
                  {(a.yearJoined || a.yearLeft) && <span>{a.degree !== 'TBD' ? ' · ' : ''}{[a.yearJoined, a.yearLeft].filter(Boolean).join(' – ')}</span>}
                </div>
                {a.currentPosition && <div style={{ fontSize: '0.82rem', color: '#004094', marginTop: '2px' }}>{a.currentPosition}</div>}
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
                <div className={styles.internTop}>
                  <span className={styles.internName}>{intern.name}</span>
                  {intern.achievements?.length > 0 && (
                    <div className={styles.internIcons}>
                      {intern.achievements.map((ach, idx) => (
                        <a key={idx} href={ach.url} target="_blank" rel="noopener noreferrer"
                          title={ach.title || (ach.type === 'award' ? 'Award' : 'Paper')} className={styles.internIconLink}>
                          {ach.type === 'award' && <FaTrophy size={11} color="#f1c40f" />}
                          {ach.type === 'paper' && <FaFileLines size={11} color="#3498db" />}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.internPrograms}>
                  {intern.participations?.filter((p) => p.program).map((p, idx) => (
                    <span key={idx} className={styles.internProgram}>{p.program}</span>
                  ))}
                </div>
                <div className={styles.internPeriod}>
                  {[...new Set(intern.participations?.map((p) => p.period).filter(Boolean))].join(', ')}
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
