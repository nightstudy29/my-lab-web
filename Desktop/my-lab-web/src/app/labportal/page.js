'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import rulesData from '@/data/rules.json'; 
import guideData from '@/data/newbieGuide.json';
import * as FaIcons from "react-icons/fa";
import { SiGoogle, SiLinkedin, SiOrcid, SiKakaotalk, SiSlack } from "react-icons/si"; 

// 1. 구글 시트 CSV URL
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZFKBBsoaoqe9PV4aOz92jS-k5yMr6ynih1NBSFr7490KdMFkRHKsSwyBRha0CTgP-_WlvIiOoUwwh/pub?gid=0&single=true&output=csv"; 

// 2. Apps Script URL
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxUzUoh_-l3TiciccM0WM3_hsZNl1HpZ8zWcgr0yQHL3lDUPx7-AKaDCNe6gF_OC452Zg/exec"; 

export default function LabPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("rules");
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- 로그인 체크 ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(storedUser);
    if (!userData.expiry || Date.now() > userData.expiry) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      localStorage.removeItem('user');
      router.push('/login');
      return;
    }
    setUser(userData);
  }, []);

  // --- 데이터 로딩 ---
  useEffect(() => {
    if (activeTab === 'directory' || activeTab === 'vacation') {
      if (members.length > 0) return; 

      setIsLoading(true);
      fetch(GOOGLE_SHEET_CSV_URL)
        .then(res => res.text())
        .then(csvText => {
          const rows = csvText.split(/\r?\n/);
          const headerIdx = rows.findIndex(r => r.includes("Name") && r.includes("E-mail"));
          if (headerIdx === -1) { setIsLoading(false); return; }
          
          const headers = rows[headerIdx].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.replace(/^"|"$/g, '').trim());
          
          const data = rows.slice(headerIdx + 1).map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
            const getV = (name) => { const i = headers.indexOf(name); return i !== -1 ? cols[i] : ""; };

            const checks = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7'].map(v => getV(v) === "TRUE");

            return {
              nameKor: getV("Name"), nameEng: getV("Eng. Name"), kakao: getV("Kakao ID"),
              year: getV("Year Joined"), email: getV("E-mail"), phone: getV("Phone"),
              status: getV("Status"), degree: getV("Degree"), position: getV("Current Position"),
              lastUpdated: getV("Last updated"),
              links: { cv: getV("CV_Link"), scholar: getV("Scholar_Link"), linkedin: getV("Linkedin_Link"), orcid: getV("ORCID_Link") },
              vacation: {
                checks: checks,
                memo: getV("V_Memo"),
                year: getV("V_Year") || new Date().getFullYear()
              }
            };
          });
          
          setMembers(data.filter(m => m.nameKor)); 
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }
  }, [activeTab]);

  // --- 저장 로직 ---
  const handleCheckUpdate = async (memberIndex, dayIndex, currentVal) => {
    const newVal = !currentVal;
    const newMembers = [...members];
    newMembers[memberIndex].vacation.checks[dayIndex] = newVal;
    setMembers(newMembers);
    setIsSaving(true);
    
    try {
      await fetch(GAS_WEB_APP_URL, {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: 'check', name: newMembers[memberIndex].nameKor, dayIndex: dayIndex, checked: newVal })
      });
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleMemoChange = (e, memberIndex) => {
    const newText = e.target.value;
    const newMembers = [...members];
    newMembers[memberIndex].vacation.memo = newText;
    setMembers(newMembers);
  };

  const handleMemoSave = async (memberIndex, text) => {
    const targetMember = members[memberIndex];
    if (targetMember.vacation.prevMemo === text) return; 
    setIsSaving(true);
    try {
        await fetch(GAS_WEB_APP_URL, {
            method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: 'memo', name: targetMember.nameKor, text: text })
        });
        const newMembers = [...members];
        newMembers[memberIndex].vacation.prevMemo = text; 
        setMembers(newMembers);
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleLogout = () => { localStorage.removeItem('user'); router.push('/login'); };

  if (!user) return null;

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: '2.2rem', fontWeight: '800' }}>SMID Lab Portal</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#666', fontWeight: 'bold' }}>{user.name} 연구원</span>
            <button onClick={handleLogout} style={{ cursor: 'pointer', border: '1px solid #ddd', background: '#fff', padding: '8px 15px', borderRadius: '20px', color: '#555', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.9rem' }}>
              <FaIcons.FaSignOutAlt /> Sign Out
            </button>
        </div>
      </div>

      {/* Shortcuts */}
      {/* gridTemplateColumns를 '1fr 1fr 1fr'로 변경하여 3열로 만들었습니다 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        
        {/* 1. Slack */}
        <a href="https://smidlab.slack.com" target="_blank" style={cardLinkStyle}>
            <div style={{ fontSize: '2.5rem', color: '#444', marginRight:'15px', display:'flex', alignItems:'center' }}><SiSlack /></div>
            <div><div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333', marginBottom:'4px' }}>Slack Workspace</div><div style={{ fontSize: '0.9rem', color: '#777' }}>연구실 공식 소통 채널</div></div>
        </a>

        {/* 2. Kakao Open Chat (New!) */}
        <a href="https://open.kakao.com/o/gYhxuwci" target="_blank" style={cardLinkStyle}>
            <div style={{ fontSize: '2.5rem', color: '#444', marginRight:'15px', display:'flex', alignItems:'center' }}><SiKakaotalk /></div>
            <div><div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333', marginBottom:'4px' }}>Kakao Open Chat</div><div style={{ fontSize: '0.9rem', color: '#777' }}>연구실 단체 채팅방</div></div>
        </a>

        {/* 3. Address Book */}
        <a href="https://docs.google.com/spreadsheets/d/1AwKmN6tcea_8_CDlvfwTEtAiBNQFiAiR6tRQVOgdMQM/edit" target="_blank" style={cardLinkStyle}>
            <div style={{ fontSize: '2.5rem', color: '#444', marginRight:'15px', display:'flex', alignItems:'center' }}><FaIcons.FaFileExcel /></div>
            <div><div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333', marginBottom:'4px' }}>Address Book (Edit)</div><div style={{ fontSize: '0.9rem', color: '#777' }}>주소록 업데이트</div></div>
        </a>

      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '2px solid #f1f3f5', paddingBottom: '0px', overflowX:'auto' }}>
        {[
          { id: 'manual', label: 'Newbie Guide', icon: <FaIcons.FaBookOpen /> },
          { id: 'rules', label: 'Lab Rules', icon: <FaIcons.FaGavel /> },
          { id: 'vacation', label: 'Vacation', icon: <FaIcons.FaPlane /> },
          { id: 'notices', label: 'Fixed Notices', icon: <FaIcons.FaBullhorn /> },
          { id: 'directory', label: 'Member Directory', icon: <FaIcons.FaAddressBook /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} 
            style={{ 
                padding: '12px 5px', border: 'none', background: 'none', fontWeight: 'bold', 
                color: activeTab === t.id ? '#004094' : '#adb5bd', 
                borderBottom: activeTab === t.id ? '3px solid #004094' : '3px solid transparent', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', whiteSpace: 'nowrap', transition: 'all 0.2s'
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ minHeight: '500px' }}>
        
        {/* [Tab 1] Newbie Guide */}
        {activeTab === 'manual' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h2 style={{ display:'flex', alignItems:'center', gap:'10px', color:'#333', marginBottom:'20px' }}>👋 Newbie Guide</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '15px' }}>
              {guideData.map((item) => (
                  <div key={item.id} style={guideCardStyle}>
                    <div style={{ marginRight: '15px', color: '#004094', fontSize: '1.2rem', paddingTop:'2px' }}><FaIcons.FaCheckSquare /></div>
                    <div><h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize:'1.05rem' }}>{item.title}</h4><p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.4' }}>{item.desc}</p></div>
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* [Tab 2] Lab Rules */}
        {activeTab === 'rules' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h2 style={{color:'#333', marginBottom:'20px'}}>⚖️ Laboratory Rules</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
              {rulesData.map(rule => (
                <div key={rule.id} style={{ padding: '30px', background: rule.highlight ? '#fff5f5' : '#fff', border: rule.highlight ? '2px solid #ffcdd2' : '1px solid #eee', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: rule.highlight ? '#d32f2f' : '#004094', marginTop: 0 }}>
                    {FaIcons[rule.icon] ? React.createElement(FaIcons[rule.icon]) : <FaIcons.FaCheckCircle />} {rule.title}
                  </h3>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#444', fontSize: '0.95rem' }}>
                    {rule.items.map((item, i) => (<li key={i} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* [Tab 3] Vacation (Active Only) */}
        {activeTab === 'vacation' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <h2 style={{ color: '#333', margin: 0 }}>✈️ Vacation Manager</h2>
                    {isSaving && <span style={{fontSize:'0.9rem', color:'#004094', fontWeight:'bold', animation:'blink 1s infinite'}}>💾 Saving...</span>}
                </div>
                <span style={{ fontSize: '0.9rem', color: '#666', background: '#f8f9fa', padding: '5px 10px', borderRadius: '8px', border: '1px solid #eee' }}>
                    📅 기준 연도: {new Date().getFullYear()}
                </span>
            </div>

            {isLoading ? <div style={{textAlign:'center', padding:'40px', color:'#888'}}>휴가 데이터를 불러오는 중입니다...</div> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {members.filter(m => m.status === 'Active').map((m, mIdx) => {
                    const originalIndex = members.findIndex(orig => orig.nameKor === m.nameKor);
                    const usedCount = m.vacation.checks.filter(Boolean).length;
                    const remain = 7 - usedCount;
                    
                    return (
                        <div key={mIdx} style={{...guideCardStyle, display:'block', borderTop: remain === 0 ? '4px solid #d32f2f' : '4px solid #4dabf7'}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <div><span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>{m.nameKor}</span><span style={{ fontSize: '0.85rem', color: '#888', marginLeft: '6px' }}>{m.position}</span></div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: remain === 0 ? '#d32f2f' : '#004094' }}>{remain}일 남음 <span style={{fontWeight:'normal', color:'#999', fontSize:'0.8rem'}}>({usedCount}/7)</span></div>
                            </div>
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', justifyContent:'space-between' }}>
                                {m.vacation.checks.map((isChecked, dayIdx) => (
                                    <div key={dayIdx} 
                                        onClick={() => handleCheckUpdate(originalIndex, dayIdx, isChecked)}
                                        style={{ 
                                            flex: 1, height: '32px', 
                                            backgroundColor: isChecked ? '#4dabf7' : '#fff',
                                            border: isChecked ? '1px solid #4dabf7' : '1px solid #dee2e6',
                                            borderRadius: '4px', cursor: 'pointer',
                                            display:'flex', alignItems:'center', justifyContent:'center',
                                            color:'white', fontSize:'0.8rem', transition: 'all 0.2s'
                                        }}>
                                        {isChecked && <FaIcons.FaCheck />}
                                    </div>
                                ))}
                            </div>
                            <input type="text" placeholder="휴가일자 기록 (예: 8/15-18)" value={m.vacation.memo} onChange={(e) => handleMemoChange(e, originalIndex)} onBlur={(e) => handleMemoSave(originalIndex, e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #eee', background: '#f8f9fa', fontSize: '0.85rem', outline: 'none', boxSizing:'border-box', color:'#555' }} />
                        </div>
                    );
                })}
              </div>
            )}
          </div>
        )}

        {/* [Tab 4] Fixed Notices */}
        {activeTab === 'notices' && (
             <div style={{ animation: 'fadeIn 0.4s ease-out', textAlign:'center', padding:'50px', color:'#888' }}>
                <FaIcons.FaBullhorn size={40} style={{marginBottom:'15px', color:'#dee2e6'}} />
                <h3>등록된 공지사항이 없습니다.</h3>
             </div>
        )}

        {/* --- [탭 5] Member Directory (색상 스타일 적용 완료!) --- */}
        {activeTab === 'directory' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h2 style={{color:'#333', marginBottom:'20px'}}>📇 Member Directory</h2>
            {isLoading ? <div style={{textAlign:'center', padding:'40px', color:'#888'}}>데이터를 불러오는 중입니다...</div> : (
              <div style={{ overflowX: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRadius: '12px', border:'1px solid #eee' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '15px', color:'#555' }}>Member Info</th>
                      <th style={{ padding: '15px', color:'#555' }}>Contact</th>
                      <th style={{ padding: '15px', textAlign: 'center', color:'#555' }}>External Links</th>
                      <th style={{ padding: '15px', textAlign: 'center', color:'#555' }}>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f3f5' }}>
                        <td style={{ padding: '15px' }}>
                          <div style={{ marginBottom: '4px' }}>
                            <strong style={{ fontSize: '1.1rem', color:'#333' }}>{m.nameKor}</strong> 
                            <span style={{ color: '#888', fontSize: '0.9rem', marginLeft: '5px' }}>({m.nameEng})</span>
                            <span style={{ fontSize: '0.85rem', color: '#004094', fontWeight: 'bold', marginLeft: '8px', background:'#e7f5ff', padding:'2px 6px', borderRadius:'4px' }}>{m.year}</span>
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '6px' }}>{m.position}</div>
                          
                          {/* ▼ [수정] Status, Degree에 색상 로직 적용 ▼ */}
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <span style={getStatusStyle(m.status)}>{m.status}</span>
                            <span style={getDegreeStyle(m.degree)}>{m.degree}</span>
                          </div>
                        </td>
                        <td style={{ padding: '15px', fontSize: '0.9rem' }}>
                          <div style={contactRow}><FaIcons.FaEnvelope color="#adb5bd" /> {m.email}</div>
                          {m.phone && <div style={contactRow}><FaIcons.FaPhoneAlt color="#adb5bd" /> {m.phone}</div>}
                          {m.kakao && <div style={contactRow}><SiKakaotalk color="#FEE500" /> {m.kakao}</div>}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {m.links.cv && <a href={m.links.cv} target="_blank" style={iconBtnStyle('#d32f2f')} title="CV"><FaIcons.FaFilePdf /></a>}
                            {m.links.scholar && <a href={m.links.scholar} target="_blank" style={iconBtnStyle('#4285F4')} title="Google Scholar"><SiGoogle /></a>}
                            {m.links.linkedin && <a href={m.links.linkedin} target="_blank" style={iconBtnStyle('#0077B5')} title="LinkedIn"><SiLinkedin /></a>}
                            {m.links.orcid && <a href={m.links.orcid} target="_blank" style={iconBtnStyle('#A6CE39')} title="ORCID"><SiOrcid /></a>}
                          </div>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', fontSize: '0.85rem', color: '#adb5bd' }}>{m.lastUpdated || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes blink { 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

// --- Helper Functions for Styles ---

// 1. Status 색상 (구글 시트 느낌)
const getStatusStyle = (status) => {
    let bg = '#f1f3f4', col = '#3c4043'; // Default Gray
    if (status === 'Active') { bg = '#e6f4ea'; col = '#137333'; } // Light Green
    else if (status === 'Graduated') { bg = '#fce8e6'; col = '#c5221f'; } // Light Red
    
    return { fontSize: '0.75rem', padding: '3px 8px', background: bg, color: col, borderRadius: '4px', fontWeight: 'bold' };
};

// 2. Degree 색상 (진한 칩 스타일)
const getDegreeStyle = (degree) => {
    let bg = '#e8eaed', col = '#3c4043'; // Default TBD Gray
    const d = degree ? degree.toUpperCase() : '';
    
    if (d.includes('PHD')) { bg = '#188038'; col = '#fff'; } // Dark Green
    else if (d.includes('MS')) { bg = '#c5221f'; col = '#fff'; } // Dark Red
    else if (d.includes('BS') || d.includes('UNDER')) { bg = '#1967d2'; col = '#fff'; } // Blue
    else if (d.includes('POSTDOC')) { bg = '#ea8600'; col = '#fff'; } // Orange/Yellow
    else if (d.includes('VISITOR')) { bg = '#8e24aa'; col = '#fff'; } // Purple

    return { fontSize: '0.75rem', padding: '3px 8px', background: bg, color: col, borderRadius: '4px', fontWeight: 'bold' };
};

const cardLinkStyle = { display: 'flex', alignItems: 'center', padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textDecoration: 'none', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'transform 0.2s, boxShadow 0.2s', cursor: 'pointer' };
const guideCardStyle = { display: 'flex', alignItems: 'flex-start', padding: '20px', background: '#fff', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' };
const contactRow = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', color: '#495057' };
const iconBtnStyle = (bg) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: bg, color: '#fff', borderRadius: '6px', fontSize: '1rem', textDecoration: 'none', transition: 'opacity 0.2s' });