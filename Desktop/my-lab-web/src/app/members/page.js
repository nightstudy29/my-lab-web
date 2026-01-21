import membersData from '../../data/members.json'; 
import { FaFilePdf, FaLinkedin, FaUser, FaTrophy, FaFileLines } from 'react-icons/fa6';
import { SiGooglescholar, SiOrcid } from 'react-icons/si';

export default function MembersPage() {
  if (!membersData) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>Loading members data...</div>;
  }

  const { currentMembers = [], alumni = [], interns = [] } = membersData;

  return (
    <div style={{ 
      padding: '60px 20px', 
      maxWidth: '1100px', 
      width: '100%',        
      margin: '0 auto',     
      boxSizing: 'border-box',
      overflowX: 'hidden' // [안전장치] 혹시라도 넘치면 스크롤 방지
    }}>
      
      {/* [핵심 수정 1] CSS Media Query 추가 
        - 모바일: 1열 (1fr) -> 화면 밖으로 안 나감
        - 태블릿/PC(768px 이상): 최소 380px 이상 확보 -> 2열 배치 & 이름 공간 확보
      */}
      <style>{`
        .members-grid {
          display: grid;
          grid-template-columns: 1fr; /* 모바일 기본: 1줄 꽉 차게 */
          gap: 20px;
        }
        @media (min-width: 768px) {
          .members-grid {
            /* PC: 카드가 넓어져서 2열이 됨. 공간이 넓으니 이름이 잘 안 잘림 */
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 25px;
          }
        }
      `}</style>

      {/* ==================== 1. Current Members ==================== */}
      <section style={{ marginBottom: '80px' }}>
        <h1 style={{ 
          marginBottom: '40px', 
          borderBottom: '2px solid #333', 
          paddingBottom: '10px',
          fontSize: 'clamp(2rem, 5vw, 2.5rem)',
          fontWeight: '800',
          color: '#222'
        }}>
          Current Members
        </h1>
        
        {/* 위에서 정의한 클래스 적용 */}
        <div className="members-grid">
          {currentMembers.map((member) => (
            <div key={member.id} style={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: '16px', 
              padding: '20px',
              backgroundColor: '#fff', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              display: 'flex', 
              gap: '15px', 
              alignItems: 'center', 
              transition: 'transform 0.2s',
            }}>
              {/* 이미지 영역 */}
              <div style={{ flexShrink: 0 }}>
                {member.image ? (
                  <img src={member.image} alt={member.name} style={{ 
                    width: '85px', 
                    height: '85px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    border: '3px solid #f8f9fa',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }} />
                ) : (
                  <div style={{ 
                    width: '85px', 
                    height: '85px', 
                    borderRadius: '50%', 
                    backgroundColor: '#f1f3f5', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    border: '3px solid #f8f9fa' 
                  }}>
                    <FaUser size={30} color="#adb5bd" />
                  </div>
                )}
              </div>

              {/* 텍스트 정보 영역 */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                
                {/* [핵심 수정 2] 이름 + 아이콘 한 줄 강제 배치 (Flex) */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', // 높이 중앙 정렬
                  marginBottom: '4px',
                  width: '100%' // 부모 너비 꽉 채우기
                }}>
                  
                  {/* 이름: 공간이 부족하면 폰트가 작아짐 */}
                  <h2 style={{ 
                    margin: '0', 
                    color: '#222',
                    // clamp(최소, 권장, 최대) -> 모바일에서 이름이 길면 15px(0.95rem)까지 줄어들어서라도 한 줄 유지
                    fontSize: 'clamp(0.95rem, 4vw, 1.25rem)', 
                    fontWeight: '700',
                    whiteSpace: 'nowrap',  // 줄바꿈 절대 금지
                    marginRight: 'auto'    // 아이콘을 오른쪽 끝으로 밀어내기
                  }}>
                    {member.name}
                  </h2>

                  {/* 아이콘: 절대 줄어들지 않음 (flexShrink: 0) */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '6px', // 아이콘 간격 살짝 좁힘 (공간 확보)
                    flexShrink: 0, 
                    marginLeft: '8px' // 이름과 최소 간격
                  }}>
                    {member.links?.cv && (
                      <a href={member.links.cv} target="_blank" rel="noopener noreferrer" title="CV">
                        <FaFilePdf size={16} color="#d32f2f" />
                      </a>
                    )}
                    {member.links?.googleScholar && (
                      <a href={member.links.googleScholar} target="_blank" rel="noopener noreferrer" title="Google Scholar">
                        <SiGooglescholar size={16} color="#4285F4" />
                      </a>
                    )}
                    {member.links?.linkedin && (
                      <a href={member.links.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                        <FaLinkedin size={16} color="#0077b5" />
                      </a>
                    )}
                    {member.links?.orcid && (
                      <a href={member.links.orcid} target="_blank" rel="noopener noreferrer" title="ORCID">
                        <SiOrcid size={16} color="#A6CE39" />
                      </a>
                    )}
                  </div>
                </div>

                {/* 직함 (Role) */}
                <p style={{ 
                  fontWeight: '600', 
                  color: '#004094', 
                  margin: '0 0 6px 0', 
                  fontSize: '0.9rem' 
                }}>
                  {member.role}
                </p>

                <hr style={{ border: 'none', borderTop: '1px solid #f1f3f5', margin: '6px 0' }} />

                {/* 세부 정보 */}
                <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.5' }}>
                  {member.joined && <div style={{ color: '#888', marginBottom: '2px' }}>Joined {member.joined}</div>}
                  
                  <div style={{ 
                    color: '#555', 
                    wordBreak: 'break-all', 
                    marginBottom: '2px'
                  }}>
                    ✉️ {member.email}
                  </div>
                  
                  {member.area && <div style={{ color: '#777', fontStyle: 'italic', marginTop: '4px' }}>{member.area}</div>}
                </div>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 2. Alumni ==================== */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ 
          marginBottom: '20px', 
          borderBottom: '1px solid #ddd', 
          paddingBottom: '10px',
          fontSize: 'clamp(1.5rem, 4vw, 1.8rem)',
          color: '#333'
        }}>
          Alumni
        </h2>
        {alumni.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '15px' 
          }}>
            {alumni.map((alum) => (
              <div key={alum.id} style={{ 
                padding: '12px 15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                fontSize: '1rem',
                color: '#444'
              }}>
                <strong>{alum.name}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#888', fontStyle: 'italic' }}>No alumni yet.</p>
        )}
      </section>

      {/* ==================== 3. Former Interns ==================== */}
      <section>
        <h2 style={{ 
          marginBottom: '20px', 
          borderBottom: '1px solid #ddd', 
          paddingBottom: '10px',
          fontSize: 'clamp(1.5rem, 4vw, 1.8rem)',
          color: '#333'
        }}>
          Former Interns
        </h2>    
        {interns.length > 0 ? (
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            display: 'grid', 
            /* [핵심 수정] 210px -> 155px로 변경 (모바일에서 2개 들어가게) */
            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', 
            gap: '8px' /* 간격도 10px -> 8px로 미세 조정 */
          }}>
            {interns.map((intern) => (
              <li key={intern.id} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                /* [수정] 박스가 좁아지므로 패딩을 12px -> 10px로 축소 */
                padding: '10px', 
                backgroundColor: '#fff', 
                borderRadius: '8px',
                border: '1px solid #eee',
              }}>
                
                {/* 윗줄: 이름 + 성과 아이콘 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    {/* [수정] 이름 글씨 크기를 0.95rem -> 0.9rem로 조정하여 줄바꿈 방지 */ }
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#333', letterSpacing: '-0.3px' }}>
                      {intern.name}
                    </span>
                    
                    {/* 성과 아이콘 */}
                    {intern.achievements && intern.achievements.length > 0 && (
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {intern.achievements.map((ach, idx) => (
                          <a 
                            key={idx} 
                            href={ach.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                            title={ach.type === 'award' ? 'Award' : 'Paper'}
                          >
                            {/* 아이콘 크기도 살짝 조절 12 -> 11 */}
                            {ach.type === 'award' && <FaTrophy size={11} color="#f1c40f" />}
                            {ach.type === 'paper' && <FaFileLines size={11} color="#3498db" />}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 아랫줄: 프로그램명 + 기간 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ 
                      alignSelf: 'flex-start',
                      color: '#555', 
                      backgroundColor: '#f1f3f5', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontSize: '0.7rem', /* 폰트 사이즈 축소 */
                      fontWeight: '600'
                    }}>
                      {intern.program || 'Intern'}
                    </span>
                    <span style={{ color: '#999', fontSize: '0.7rem', marginTop: '2px' }}>
                      {intern.period}
                    </span>
                </div>

              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#888', fontStyle: 'italic' }}>-</p>
        )}
      </section>

    </div>
  );
}