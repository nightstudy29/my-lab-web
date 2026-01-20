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
      maxWidth: '1100px', // [수정] 3열 배치를 여유롭게 하기 위해 폭을 1000 -> 1100으로 살짝 늘림
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
        
        {/* [수정] minmax를 300px로 조정하여 정보가 너무 찌그러지면 자동으로 줄이 바뀜 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
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
              alignItems: 'flex-start',
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
              <div style={{ flex: 1, minWidth: 0 }}>
                
                {/* [수정] 이름 + 아이콘을 한 줄(Flex Row)에 배치 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  {/* 이름 & 직함 */}
                  <div>
                    <h2 style={{ 
                      margin: '0', 
                      color: '#222',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      wordBreak: 'keep-all',
                      lineHeight: '1.2'
                    }}>
                      {member.name}
                    </h2>
                    <p style={{ 
                      fontWeight: '600', 
                      color: '#004094', 
                      margin: '4px 0 0 0', 
                      fontSize: '0.9rem' 
                    }}>
                      {member.role}
                    </p>
                  </div>

                  {/* 아이콘 (이름 오른쪽 고정) */}
                  <div style={{ display: 'flex', gap: '6px', marginLeft: '8px', flexShrink: 0 }}>
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

                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />

                {/* 세부 정보 (이메일 줄바꿈 허용) */}
                <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.5' }}>
                  {member.joined && <div style={{ color: '#888', marginBottom: '2px' }}>Joined {member.joined}</div>}
                  
                  <a href={`mailto:${member.email}`} style={{ 
                    textDecoration: 'none', 
                    color: '#555', 
                    display: 'block', 
                    // [수정] 이메일이 길면 줄바꿈 되도록 설정 (잘림 방지)
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