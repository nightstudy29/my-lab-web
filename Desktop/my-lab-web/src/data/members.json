import members from '../../data/members.json';

// 아이콘 불러오기 (CV, 구글스칼라, 링크드인, ORCID)
import { FaFilePdf, FaLinkedin } from 'react-icons/fa6';
import { SiGooglescholar, SiOrcid } from 'react-icons/si';

export default function MembersPage() {
  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '40px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
        Members
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
        {members.map((member) => (
          <div key={member.id} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '10px', 
            padding: '25px',
            backgroundColor: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            {/* 이름과 아이콘을 감싸는 영역 */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#333' }}>
                {member.name}
              </h2>
              
              {/* 아이콘 리스트 (링크가 있을 때만 표시) */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {member.links?.cv && (
                  <a href={member.links.cv} target="_blank" rel="noopener noreferrer" title="Curriculum Vitae">
                    <FaFilePdf size={20} color="#cc0000" />
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

            <p style={{ fontWeight: 'bold', color: '#0056b3', marginBottom: '5px' }}>
              {member.role}
            </p>
            
            <p style={{ color: '#666', marginBottom: '10px', fontSize: '0.95rem' }}>
              📧 <a href={`mailto:${member.email}`} style={{ textDecoration: 'none', color: '#666' }}>{member.email}</a>
            </p>

            {member.area && (
              <p style={{ fontSize: '0.9rem', color: '#888', fontStyle: 'italic' }}>
                {member.area}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}