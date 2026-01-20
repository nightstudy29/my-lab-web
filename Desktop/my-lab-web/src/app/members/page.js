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
      boxSizing: 'border-box' 
    }}>
      
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
        
        <div style={{ 
          display: 'grid', 
          // [핵심 수정 1] minmax를 300px -> 400px로 대폭 늘림.
          // PC 화면(1100px) 기준 3열 -> 2열로 바뀌면서 카드 내부 공간이 넓어짐.
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
          gap: '25px' 
        }}>
          {currentMembers.map((member) => (
            <div key={member.id} style={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: '16px', 
              padding: '20px',
              backgroundColor: '#fff', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              display: 'flex', 
              gap: '15px', 
              alignItems: 'center', // [수정] 세로 중앙 정렬로 변경하여 안정감 확보
              transition: 'transform 0.2s',
            }}>
              {/* 이미지 영역 */}
              <div style={{ flexShrink: 0 }}>
                {member.image ? (
                  <img src={member.image} alt={member.name} style={{ 
                    width: '90px',  // 이미지를 조금 더 키워 균형 맞춤
                    height: '90px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    border: '3px solid #f8f9fa',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }} />
                ) : (
                  <div style={{ 
                    width: '90px', 
                    height: '90px', 
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
                
                {/* [핵심 수정 2] 이름과 아이콘을 한 줄에 강제 배치 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '4px',
                  flexWrap: 'nowrap' // 절대 줄바꿈 하지 않음
                }}>
                  {/* 이름: 공간 부족 시 말줄임표(...) 처리 대신 폰트 크기 조절 */}
                  <h2 style={{ 
                    margin: '0', 
                    color: '#222',
                    // [핵심 수정 3] 폰트 크기를 유동적으로 (최소 1rem ~ 최대 1.25rem)
                    // 이름이 길어지면 자동으로 조금 작아져서 한 줄 유지
                    fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', 
                    fontWeight: '700',
                    whiteSpace: 'nowrap', // 한 줄 유지
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginRight: '8px' // 아이콘과의 최소 간격
                  }}>
                    {member.name}
                  </h2>

                  {/* 아이콘: 크기 고정 (압축되지 않음) */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {member.links?.cv && (
                      <a href={member.links.cv} target="_blank" rel="noopener noreferrer" title="CV">
                        <FaFilePdf size={18} color="#d32f2f" />
                      </a>
                    )}
                    {member.links?.googleScholar && (
                      <a href={member.links.googleScholar} target="_blank" rel="noopener noreferrer" title="Google Scholar">
                        <SiGooglescholar size={18} color="#4285F4" />
                      </a>
                    )}
                    {member.links?.linkedin && (
                      <a href={member.links.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                        <FaLinkedin size={18} color="#0077b5" />
                      </a>
                    )}
                    {member.links?.orcid && (
                      <a href={member.links.orcid} target="_blank" rel="noopener noreferrer" title="ORCID">
                        <SiOrcid size={18} color="#A6CE39" />
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