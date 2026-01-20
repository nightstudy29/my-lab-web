import membersData from '../../data/members.json'; // 경로 확인 필요
import { FaFilePdf, FaLinkedin, FaUser, FaTrophy, FaFileLines } from 'react-icons/fa6';
import { SiGooglescholar, SiOrcid } from 'react-icons/si';

export default function MembersPage() {
  // 데이터 파일이 로드되지 않았을 때를 대비한 방어 코드
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
        {/* 제목 수정 */}
        <h1 style={{ 
          marginBottom: '40px', 
          borderBottom: '2px solid #333', 
          paddingBottom: '10px',
          // [수정] 폰트 크기 자동 조절
          fontSize: 'clamp(2rem, 5vw, 2.5rem)'
        }}>
          Current Members
        </h1>
        
        {/* [수정] minmax(400px -> 280px 또는 300px)로 변경해야 모바일에서 안 잘림 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {currentMembers.map((member) => (
            <div key={member.id} style={{ 
              border: '1px solid #eee', borderRadius: '12px', padding: '25px',
              backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              display: 'flex', gap: '20px', alignItems: 'flex-start'
            }}>
              <div style={{ flexShrink: 0 }}>
                {member.image ? (
                  <img src={member.image} alt={member.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f0f0f0' }} />
                ) : (
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #e0e0e0' }}>
                    <FaUser size={40} color="#bbb" />
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <h2 style={{ 
                    margin: 0, 
                    color: '#333',
                    // [수정] 이름 크기 조절
                    fontSize: 'clamp(1.1rem, 4vw, 1.3rem)'
                  }}>
                    {member.name}
                  </h2>                
                  <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                    {member.links?.cv && <a href={member.links.cv} target="_blank" rel="noopener noreferrer"><FaFilePdf size={18} color="#cc0000" /></a>}
                    {member.links?.googleScholar && <a href={member.links.googleScholar} target="_blank" rel="noopener noreferrer"><SiGooglescholar size={18} color="#4285F4" /></a>}
                    {member.links?.linkedin && <a href={member.links.linkedin} target="_blank" rel="noopener noreferrer"><FaLinkedin size={18} color="#0077b5" /></a>}
                    {member.links?.orcid && <a href={member.links.orcid} target="_blank" rel="noopener noreferrer"><SiOrcid size={18} color="#A6CE39" /></a>}
                  </div>
                </div>
                <p style={{ fontWeight: 'bold', color: '#0056b3', margin: '0 0 4px 0', fontSize: '1rem' }}>{member.role}</p>
                {member.joined && <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 10px 0' }}>Joined {member.joined}</p>}
                <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                  <a href={`mailto:${member.email}`} style={{ textDecoration: 'none', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.1em' }}>✉️</span> {member.email}
                  </a>
                </p>
                {member.area && <p style={{ fontSize: '0.85rem', color: '#777', fontStyle: 'italic', margin: 0, lineHeight: '1.4' }}>{member.area}</p>}
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
          // [수정] 섹션 제목 크기 조절
          fontSize: 'clamp(1.5rem, 4vw, 1.8rem)'
        }}>
          Alumni
        </h2>
        {alumni.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {alumni.map((alum) => <div key={alum.id}><strong>{alum.name}</strong></div>)}
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
          // [수정] 섹션 제목 크기 조절
          fontSize: 'clamp(1.5rem, 4vw, 1.8rem)'
        }}>
          Former Interns
        </h2>     
        {interns.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {interns.map((intern) => (
              <li key={intern.id} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                padding: '15px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '8px',
                border: '1px solid #eee'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* 이름 */}
                    <span style={{ fontWeight: '600', fontSize: '1.05rem', color: '#333' }}>
                      {intern.name}
                    </span>
                    
                    {/* 프로그램 뱃지 */}
                    {intern.program && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: '#e9ecef', 
                        color: '#555', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        {intern.program}
                      </span>
                    )}

                    {/* 성과 아이콘들 */}
                    {intern.achievements && intern.achievements.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', marginLeft: '5px' }}>
                        {intern.achievements.map((ach, idx) => (
                          <a 
                            key={idx} 
                            href={ach.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title={ach.title}
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            {ach.type === 'award' && <FaTrophy size={14} color="#f1c40f" />}
                            {ach.type === 'paper' && <FaFileLines size={14} color="#3498db" />}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 기간 */}
                <span style={{ color: '#777', fontSize: '0.85rem' }}>
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