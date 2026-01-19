// src/app/members/page.js
import members from '../../data/members.json'; // 경로가 한 단계 깊어져서 ../ 가 두 번 필요합니다

export default function MembersPage() {
  return (
    <div style={{ padding: '40px' }}>
      <h1>My Lab Members</h1>
      <p>우리 연구실의 핵심 인재들입니다.</p>

      <div style={{ marginTop: '20px' }}>
        {members.map((member) => (
          <div key={member.id} style={{ 
            border: '1px solid #ccc', 
            padding: '20px', 
            margin: '10px 0',
            borderRadius: '8px' 
          }}>
            <h3>{member.name} <span style={{fontSize: '14px', color: '#666'}}>({member.role})</span></h3>
            <p>📧 {member.email}</p>
            <p>🔬 {member.area}</p>
          </div>
        ))}
      </div>
    </div>
  );
}