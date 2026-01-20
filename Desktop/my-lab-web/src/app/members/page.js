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
      maxWidth: '1000px',   
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
        
        {/* [수정] 카드 최소 너비를 280px로 줄여 작은 폰에서도 안 잘리게 함 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '25px' 
        }}>
          {currentMembers.map((member) => (
            <div key={member.id} style={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: '16px', 
              padding: '20px', // [수정] 패딩을 25 -> 20으로 줄여 내부 공간 확보
              backgroundColor: '#fff', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              display: 'flex', 
              gap: '20px', 
              alignItems: 'flex-start',
              transition: 'transform 0.2s',
            }}>
              {/* 이미지 영역 */}
              <div style={{ flexShrink: 0 }}>
                {member.image ? (
                  <img src={member.image} alt={member.name} style={{ 
                    width: '90px', // [수정] 모바일 고려하여 100 -> 90으로 미세 조정
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
                    <FaUser size={35} color="#adb5bd" />
                  </div>
                )}
              </div>

              {/* 텍스트 정보 영역 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                
                {/* 1. 이름 & 직함 */}
                <h2 style={{ 
                  margin: '0 0 4px 0', 
                  color: '#222',
                  fontSize: 'clamp(1.2rem, 4vw, 1.35rem)',
                  fontWeight: '700',
                  wordBreak: 'keep-all' // 한글 이름 줄바꿈 방지
                }}>
                  {member.name}
                </h2>
                <p style={{ 
                  fontWeight: '600', 
                  color: '#004094', 
                  margin: '0 0 10px 0', 
                  fontSize: '0.95rem' 
                }}>
                  {member.role}
                </p>

                {/* 2. 세부 정보 (이메일 등) */}
                <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.6', marginBottom: '12px' }}>
                  {member.joined && <div style={{ color: '#888' }}>Joined {member.joined}</div>}
                  <a href={`mailto:${member.email}`} style={{ 
                    textDecoration: 'none', 
                    color: '#555', 
                    display: 'block', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' // 이메일 길어도 한 줄로
                  }}>
                    ✉️ {member.email}
                  </a>
                  {member.area && <div style={{ color: '#777', fontStyle: 'italic', marginTop: '4px' }}>{member.area}</div>}
                </div>

                {/* 3. 아이콘 (맨 아래로 이동하여 공간 간섭 해결) */}
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', flexWrap: 'wrap' }}>
                  {member.links?.cv && (
                    <a href={member.links.cv} target="_blank" rel="noopener noreferrer" title="CV" style={{ transition: 'opacity 0.2s' }}>
                      <FaFilePdf size={20} color="#d32f2f" />
                    </a>
                  )}
                  {member.links?.googleScholar && (
                    <a href={member.links.googleScholar} target="_blank" rel="noopener noreferrer" title="Google Scholar">
                      <SiGooglescholar size={20} color="#4285F4" />
                    </a>
                  )}
                  {member.links?.linkedin && (
                    <a href={member.links.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                      <FaLinkedin size={20} color="#0077b5" />
                    </a>
                  )}
                  {member.links?.orcid && (
                    <a href={member.links.orcid} target="_blank" rel="noopener noreferrer" title="ORCID">
                      <SiOrcid size={20} color="#A6CE39" />
                    </a>
                  )}
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', // [수정] 모바일 대응
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