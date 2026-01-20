"use client";

import { useState, useEffect } from 'react';
import internalData from '../../data/internal.json'; 
import { 
  FaLock, FaSignOutAlt, FaSlack, FaBook, FaGavel, FaBullhorn, 
  FaCheckSquare, FaAddressBook, FaFileExcel, FaPhoneAlt, FaEnvelope, FaIdCard, FaExclamationTriangle
} from "react-icons/fa";
import { SiGoogle, SiLinkedin, SiOrcid, SiKakaotalk } from "react-icons/si"; 

const PORTAL_PASSWORD = "smid"; 

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZFKBBsoaoqe9PV4aOz92jS-k5yMr6ynih1NBSFr7490KdMFkRHKsSwyBRha0CTgP-_WlvIiOoUwwh/pub?gid=0&single=true&output=csv"; 

export default function LabPortalPage() {
  const [inputPw, setInputPw] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // [순서 변경] 기본 탭을 manual(Newbie Guide)로 설정
  const [activeTab, setActiveTab] = useState("manual");

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (activeTab === 'directory' && isAuthenticated) {
      setIsLoading(true);
      setFetchError(false);

      fetch(GOOGLE_SHEET_CSV_URL)
        .then(response => {
           if (!response.ok) throw new Error("Network response was not ok");
           return response.text();
        })
        .then(csvText => {
          const rows = csvText.split(/\r?\n/);
          const headerIdx = rows.findIndex(row => row.includes("Name") || row.includes("Eng. Name"));
          
          if (headerIdx === -1) {
             setIsLoading(false);
             return;
          }

          const dataRows = rows.slice(headerIdx + 1);
          const parsedData = dataRows.map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
            let offset = 0;
            if (cols[0] && !isNaN(cols[0]) && cols[0].length < 3) {
                offset = -1;
            }

            return {
              nameKor: cols[2 + offset],     
              nameEng: cols[3 + offset],     
              kakao:   cols[4 + offset],     
              year:    cols[5 + offset],     
              email:   cols[6 + offset],     
              phone:   cols[7 + offset],     
              links: {
                cv:       cols[8 + offset],   
                scholar:  cols[9 + offset],   
                linkedin: cols[10 + offset],  
                orcid:    cols[11 + offset],  
              },
              role:    cols[12 + offset],    
              updated: cols[13 + offset],    
            };
          });

          setMembers(parsedData.filter(m => m.nameKor && m.nameKor !== ''));
          setIsLoading(false);
        })
        .catch(err => {
          setFetchError(true);
          setIsLoading(false);
        });
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    const isLogged = sessionStorage.getItem("smid_portal_auth");
    if (isLogged === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (inputPw === PORTAL_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("smid_portal_auth", "true");
    } else {
      alert("Incorrect Password");
    }
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("smid_portal_auth");
    setInputPw("");
  };

  if (!isAuthenticated) {
     return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
          <div style={{ maxWidth: '400px', width: '90%', backgroundColor: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <FaLock size={30} color="#004094" style={{ marginBottom: '15px' }} />
            <h2 style={{ marginBottom: '10px', color: '#333' }}>SMID Lab Portal</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', gap: '10px' }}>
              <input type="password" placeholder="Password" value={inputPw} onChange={(e) => setInputPw(e.target.value)} 
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
              <button type="submit" style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#004094', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Enter</button>
            </form>
          </div>
        </div>
      );
  }

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2rem', color: '#333', margin: 0 }}>SMID Lab Portal</h1>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#eee', border: 'none', borderRadius: '20px', color: '#555', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
          <a href="https://smidlab.slack.com" target="_blank" className="quick-card slack">
            <FaSlack size={28} />
            <div><h3>Slack Workspace</h3><p>공식 소통 채널</p></div>
          </a>
          <a href="https://docs.google.com/spreadsheets/d/1AwKmN6tcea_8_CDlvfwTEtAiBNQFiAiR6tRQVOgdMQM/edit?usp=sharing" target="_blank" className="quick-card sheet">
            <FaFileExcel size={28} />
            <div><h3>Address Book (Edit)</h3><p>주소록 데이터 수정 (Google Sheet)</p></div>
          </a>
        </div>
      </div>

      {/* [순서 조정] Tabs */}
      <div>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid #eee', overflowX: 'auto' }}>
          {[
            { id: 'manual', label: 'Newbie Guide', icon: <FaBook /> },
            { id: 'rules', label: 'Lab Rules', icon: <FaGavel /> },
            { id: 'notices', label: 'Fixed Notices', icon: <FaBullhorn /> },
            { id: 'directory', label: 'Member Directory', icon: <FaAddressBook /> },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 15px', fontSize: '1rem', fontWeight: 'bold',
                color: activeTab === tab.id ? '#004094' : '#888',
                border: 'none', borderBottom: activeTab === tab.id ? '3px solid #004094' : '3px solid transparent',
                backgroundColor: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '400px' }}>
          
          {/* 1. Newbie Guide */}
          {activeTab === 'manual' && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '20px' }}>👋 Newbie Guide</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <CheckItem title="Slack 가입" desc="#general 채널에 인사말 남기기" />
                <CheckItem title="주소록 등록" desc="Member Directory 탭 상단의 수정 버튼을 눌러 본인 정보를 입력하세요." />
                <CheckItem title="출입 등록" desc="301동 행정실 방문 및 지문 등록" />
              </div>
            </div>
          )}

          {/* 2. Lab Rules */}
          {activeTab === 'rules' && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '20px' }}>⚖️ Lab Rules</h2>
              <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', lineHeight: '1.6' }}>
                <p>연구실 내부 규칙 및 에티켓에 대한 내용이 이곳에 들어갑니다.</p>
                <ul style={{ color: '#555' }}>
                  <li>연구실 정숙 및 상호 존중</li>
                  <li>공용 비품 사용 후 정리 정돈</li>
                  <li>주간 회의 참석 및 보고서 제출</li>
                </ul>
              </div>
            </div>
          )}

          {/* 3. Fixed Notices */}
          {activeTab === 'notices' && (
             <div className="animate-fade-in">
               <h2 style={{ marginBottom: '20px' }}>📌 Fixed Notices</h2>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 {internalData.map(n => (
                   <div key={n.id} style={{padding: '18px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '10px'}}>
                     <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{n.title}</h3>
                     <p style={{ margin: 0, color: '#777', fontSize: '0.9rem' }}>{n.date}</p>
                   </div>
                 ))}
               </div>
             </div>
          )}
          
          {/* 4. Member Directory */}
          {activeTab === 'directory' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#222' }}>📖 Member Directory</h2>
                <a href="https://docs.google.com/spreadsheets/d/1AwKmN6tcea_8_CDlvfwTEtAiBNQFiAiR6tRQVOgdMQM/edit?usp=sharing" target="_blank" style={{ fontSize: '0.9rem', color: '#004094', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: '600' }}>
                  <FaFileExcel /> 시트 수정하기
                </a>
              </div>

              {fetchError && (
                <div style={{ padding: '20px', backgroundColor: '#fff4f4', border: '1px solid #ffcdd2', borderRadius: '8px', color: '#d32f2f', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <FaExclamationTriangle size={24} />
                  <div><strong>데이터를 불러올 수 없습니다.</strong> URL을 확인해주세요.</div>
                </div>
              )}

              {isLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}><p>Loading...</p></div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', color: '#444', borderBottom: '2px solid #eee', textAlign: 'left' }}>
                        <th style={{ padding: '15px', width: '30%' }}>Profile</th>
                        <th style={{ padding: '15px', width: '35%' }}>Contact Info</th>
                        <th style={{ padding: '15px', width: '35%' }}>Academic Links</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((person, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '15px', verticalAlign: 'top' }}>
                            <div style={{ marginBottom: '6px' }}>
                                <span style={{ fontWeight: '700', color: '#333', fontSize: '1.1rem', marginRight: '6px' }}>{person.nameKor}</span>
                                <span style={{ fontWeight: '400', color: '#666', fontSize: '0.95rem' }}>{person.nameEng && `(${person.nameEng})`}</span>
                                {person.year && <span style={{ marginLeft: '8px', backgroundColor: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>{person.year}</span>}
                            </div>
                            <div style={{ color: '#004094', fontWeight: '600', fontSize: '0.9rem' }}>{person.role}</div>
                          </td>
                          <td style={{ padding: '15px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {person.email && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#555' }}><FaEnvelope color="#888" /><a href={`mailto:${person.email}`} style={{ color: '#555', textDecoration: 'none' }}>{person.email}</a></div>}
                              {person.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#555' }}><FaPhoneAlt color="#888" size={12} />{person.phone}</div>}
                              {person.kakao && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#555' }}><SiKakaotalk color="#3c1e1e" size={16} />{person.kakao}</div>}
                            </div>
                          </td>
                          <td style={{ padding: '15px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {person.links?.cv && <LinkBadge href={person.links.cv} label="CV" color="#d32f2f" icon={<FaIdCard />} />}
                              {person.links?.scholar && <LinkBadge href={person.links.scholar} label="Scholar" color="#4285F4" icon={<SiGoogle />} />}
                              {person.links?.linkedin && <LinkBadge href={person.links.linkedin} label="LinkedIn" color="#0077b5" icon={<SiLinkedin />} />}
                              {person.links?.orcid && <LinkBadge href={person.links.orcid} label="ORCID" color="#A6CE39" icon={<SiOrcid />} />}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        .quick-card {
          background: #fff; border: 1px solid #eee; border-radius: 16px; padding: 20px;
          display: flex; align-items: center; gap: 15px; text-decoration: none; color: #333;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .quick-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.08); }
        .quick-card.slack svg { color: #4A154B; }
        .quick-card.sheet svg { color: #1EA362; }
        .quick-card h3 { margin: 0 0 3px 0; font-size: 1.1rem; }
        .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function LinkBadge({ href, label, color, icon }) {
  if (!href) return null;
  const finalHref = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a href={finalHref} target="_blank" rel="noopener noreferrer" 
       style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: color, color: '#fff', textDecoration: 'none', fontWeight: '600' }}>
      {icon} <span>{label}</span>
    </a>
  );
}

function CheckItem({ title, desc }) {
  return (
    <div style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #eee' }}>
      <FaCheckSquare size={20} color="#004094" />
      <div><h3 style={{ margin: '0 0 5px 0', fontSize: '1.05rem' }}>{title}</h3><p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{desc}</p></div>
    </div>
  );
}