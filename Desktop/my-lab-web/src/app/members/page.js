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
                  
                  <a href={`mailto:${member.email}`} style={{ 
                    textDecoration: 'none', 
                    color: '#555', 
                    display: 'block', 
                    wordBreak: 'break-all', 
                    marginBottom: '2px'
                  }}>
                    ✉️ {member.email}
                  </a>
                  
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '15px' 
          }}>
            {interns.map((intern) => (
              <li key={intern.id} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                padding: '15px', 
                backgroundColor: '#fff', 
                borderRadius: '10px',
                border: '1px solid #eee',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#333' }}>
                      {intern.name}
                    </span>
                    
                    {intern.program && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: '#e9ecef', 
                        color: '#495057', 
                        padding: '2px 8px', 
                        borderRadius: '12px',
                        fontWeight: '600'
                      }}>
                        {intern.program}
                      </span>
                    )}

                    {intern.achievements && intern.achievements.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {intern.achievements.map((ach, idx) => (
                          <a 
                            key={idx} 
                            href={ach.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                          >
                            {ach.type === 'award' && <FaTrophy size={14} color="#f1c40f" />}
                            {ach.type === 'paper' && <FaFileLines size={14} color="#3498db" />}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span style={{ color: '#868e96', fontSize: '0.85rem' }}>
                  {intern.period}
                </span>
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