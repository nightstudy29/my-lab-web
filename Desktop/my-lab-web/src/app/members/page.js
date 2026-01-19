import membersData from '../../data/members.json';
import { FaFilePdf, FaLinkedin, FaUser } from 'react-icons/fa6';
import { SiGooglescholar, SiOrcid } from 'react-icons/si';

export default function MembersPage() {
  const { currentMembers, alumni, interns } = membersData;

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* 1. Current Members */}
      <section style={{ marginBottom: '80px' }}>
        <h1 style={{ marginBottom: '40px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
          Current Members
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '30px' }}>
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
                  <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>{member.name}</h2>
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

      {/* 2. Alumni */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Alumni</h2>
        {alumni.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {alumni.map((alum) => <div key={alum.id}><strong>{alum.name}</strong></div>)}
          </div>
        ) : (
          <p style={{ color: '#888', fontStyle: 'italic' }}>No alumni yet.</p>
        )}
      </section>

      {/* 3. Interns */}
      <section>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Former Interns</h2>
        {interns.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {interns.map((intern) => (
              <li key={intern.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#f9f9f9', borderRadius: '6px', border: '1px solid #eee' }}>
                <span style={{ fontWeight: '500', color: '#333' }}>{intern.name}</span>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>{intern.period}</span>
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