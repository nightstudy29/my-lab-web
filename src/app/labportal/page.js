'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import rulesData from '@/data/rules.json'; 
import guideData from '@/data/newbieGuide.json';
import wikiData from '@/data/labwiki.json'; 
import * as FaIcons from "react-icons/fa";
import { SiGoogle, SiLinkedin, SiOrcid, SiKakaotalk, SiSlack } from "react-icons/si"; 
// [추가됨] Admin 및 아이콘 관련 import
import { MdAdminPanelSettings, MdPendingActions, MdPlaylistAddCheck } from "react-icons/md"; 

// 1. 구글 시트 CSV URL (기존 동일)
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZFKBBsoaoqe9PV4aOz92jS-k5yMr6ynih1NBSFr7490KdMFkRHKsSwyBRha0CTgP-_WlvIiOoUwwh/pub?gid=0&single=true&output=csv"; 

// 2. [기존] Member & Vacation 관리용 (기존 GAS_WEB_APP_URL)
const GAS_MEMBER_URL = "https://script.google.com/macros/s/AKfycbwdgyNJ2J6L1nxiCy5DIIfNmsaFRiwg6uwTlWrbY3nnYvufz-wbN4vsWhoj71hWlM_Z7w/exec"; 

// 3. [신규] Auth & Admin Request 관리용 (방금 만든 새 URL)
const GAS_AUTH_URL = "https://script.google.com/macros/s/AKfycbyaTohnw8xR8yqX3lWUbGsMNaVVc2oL-3OGYQkpYeiKaXRVGKPN0bRcfg59zSkJni_Ppg/exec";

export default function LabPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("rules");
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // [신규 State] Admin 및 요청 관련
  const [pendingUsers, setPendingUsers] = useState([]);
  const [contentRequests, setContentRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestCategory, setRequestCategory] = useState("");
  const [requestContent, setRequestContent] = useState("");

  // --- 로그인 체크 (기존 동일) ---
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
    // 1. 기존 디렉토리/휴가 로딩 (기존 로직 100% 동일)
    if (activeTab === 'directory' || (activeTab === 'admin' && user?.role === 'admin')) {
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

    // 2. [신규] Admin 데이터 로딩 (GAS_AUTH_URL 사용)
    if (activeTab === 'admin' && user?.role === 'admin') {
        fetchAdminData();
    }
  }, [activeTab, user]);

  // [수정] Admin 데이터 가져오기 (실제 데이터 연동)
  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
        // 1. 가입 대기자 명단 가져오기
        const res1 = await fetch(GAS_AUTH_URL, {
            method: "POST", 
            // mode: "no-cors" 삭제함 (중요!)
            headers: { "Content-Type": "text/plain" }, // 단순 텍스트로 보내야 CORS 에러가 덜 납니다
            body: JSON.stringify({ action: 'getPendingUsers' })
        });
        
        if (res1.ok) {
            const usersData = await res1.json(); // JSON 데이터 파싱
            console.log("Pending Users:", usersData); // 디버깅용 로그
            setPendingUsers(usersData); // 상태 업데이트
        }

        // 2. 수정 요청 목록 가져오기
        const res2 = await fetch(GAS_AUTH_URL, {
             method: "POST", 
             headers: { "Content-Type": "text/plain" },
             body: JSON.stringify({ action: 'getRequests' })
        });

        if (res2.ok) {
            const reqsData = await res2.json();
            console.log("Requests:", reqsData); // 디버깅용 로그
            setContentRequests(reqsData); // 상태 업데이트
        }
        
    } catch (e) { 
        console.error("데이터 로딩 실패:", e);
        alert("데이터를 불러오지 못했습니다. 관리자에게 문의하세요.");
    }
    setIsLoading(false);
  };

  // --- 저장 로직 (기존 동일 + 변수명만 GAS_MEMBER_URL로 매칭) ---
  const handleCheckUpdate = async (memberIndex, dayIndex, currentVal) => {
    const newVal = !currentVal;
    const newMembers = [...members];
    newMembers[memberIndex].vacation.checks[dayIndex] = newVal;
    setMembers(newMembers);
    setIsSaving(true);
    
    try {
      await fetch(GAS_MEMBER_URL, { // [기존 URL 사용]
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
        await fetch(GAS_MEMBER_URL, { // [기존 URL 사용]
            method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: 'memo', name: targetMember.nameKor, text: text })
        });
        const newMembers = [...members];
        newMembers[memberIndex].vacation.prevMemo = text; 
        setMembers(newMembers);
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  // [신규 함수] Admin: 가입 승인 (GAS_AUTH_URL 사용)
  const handleApproveUser = async (targetId) => {
      if(!confirm("승인하시겠습니까?")) return;
      setIsSaving(true);
      await fetch(GAS_AUTH_URL, {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: 'approveUser', targetId: targetId })
      });
      alert("승인 요청 전송됨");
      setPendingUsers(prev => prev.filter(u => u.id !== targetId));
      setIsSaving(false);
  };

    // [수정] 수정 요청 '처리 완료' 버튼 핸들러
  const handleResolveRequest = async (req) => { // 인자를 req 객체 전체로 변경
    if (!confirm("이 요청을 처리 완료로 변경하시겠습니까?")) return;

    try {
      await fetch(GAS_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ 
            action: 'resolveRequest',
            requester: req.from,    // [추가] 요청자 이름 전송
            content: req.message    // [추가] 요청 내용 전송
        })
      });

      // 목록에서 제거 (timestamp 기준)
      setContentRequests((prev) => prev.filter(r => r.timestamp !== req.timestamp));
      
      alert("처리되었습니다.");
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };


  // [신규 함수] User: 수정 요청 (GAS_AUTH_URL 사용)
  const openRequestModal = (category) => {
      setRequestCategory(category);
      setRequestContent("");
      setIsModalOpen(true);
  };

  const submitRequest = async () => {
      if(!requestContent.trim()) return alert("내용을 입력해주세요.");
      setIsSaving(true);
      await fetch(GAS_AUTH_URL, {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ 
            action: 'submitRequest', 
            requester: user.name, 
            category: requestCategory, 
            content: requestContent 
        })
      });
      setIsSaving(false);
      setIsModalOpen(false);
      alert("요청사항이 전달되었습니다.");
  };

  const handleLogout = () => { localStorage.removeItem('user'); router.push('/login'); };

  if (!user) return null;

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Header (기존 동일) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: '2.2rem', fontWeight: '800' }}>SMID Lab Portal</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#666', fontWeight: 'bold' }}>{user.name} {user.role === 'admin' ? '(Admin)' : '연구원'}</span>
            <button onClick={handleLogout} style={{ cursor: 'pointer', border: '1px solid #ddd', background: '#fff', padding: '8px 15px', borderRadius: '20px', color: '#555', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.9rem' }}>
              <FaIcons.FaSignOutAlt /> Sign Out
            </button>
        </div>
      </div>

      {/* Shortcuts (기존 동일) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        <a href="https://smidlab.slack.com" target="_blank" style={cardLinkStyle}>
            <div style={{ fontSize: '2.5rem', color: '#444', marginRight:'15px', display:'flex', alignItems:'center' }}><SiSlack /></div>
            <div><div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333', marginBottom:'4px' }}>Slack Workspace</div><div style={{ fontSize: '0.9rem', color: '#777' }}>연구실 공식 소통 채널</div></div>
        </a>
        <a href="https://open.kakao.com/o/gYhxuwci" target="_blank" style={cardLinkStyle}>
            <div style={{ fontSize: '2.5rem', color: '#444', marginRight:'15px', display:'flex', alignItems:'center' }}><SiKakaotalk /></div>
            <div><div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333', marginBottom:'4px' }}>Kakao Open Chat</div><div style={{ fontSize: '0.9rem', color: '#777' }}>연구실 단체 채팅방</div></div>
        </a>
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
          { id: 'wiki', label: 'Lab Wiki', icon: <FaIcons.FaBook /> },
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
        
        {/* [신규] Admin Tab Button (Admin만 보임) */}
        {user.role === 'admin' && (
             <button onClick={() => setActiveTab('admin')} 
             style={{ 
                 padding: '12px 5px', border: 'none', background: 'none', fontWeight: 'bold', 
                 color: activeTab === 'admin' ? '#d32f2f' : '#adb5bd', 
                 borderBottom: activeTab === 'admin' ? '3px solid #d32f2f' : '3px solid transparent', 
                 cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', whiteSpace: 'nowrap', transition: 'all 0.2s', marginLeft: 'auto'
             }}>
             <MdAdminPanelSettings size={22} /> Admin
           </button>
        )}
      </div>

      <div style={{ minHeight: '500px' }}>

        {/* [Tab 1] Newbie Guide */}
        {activeTab === 'manual' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {/* [추가] 수정 요청 버튼 */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <h2 style={{ display:'flex', alignItems:'center', gap:'10px', color:'#333', margin:0 }}>👋 Newbie Guide</h2>
                <button onClick={() => openRequestModal('Newbie Guide')} style={requestBtnStyle}>✏️ 수정 요청</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
              {guideData.map((item) => (
                  <div key={item.id} style={guideCardStyle}>
                    <div style={{ marginRight: '18px', color: '#004094', fontSize: '1.35rem', paddingTop:'3px', flexShrink: 0 }}><FaIcons.FaCheckSquare /></div>
                    <div>
                        <h4 style={{ margin: '0 0 12px 0', color: '#212529', fontSize:'1.15rem', fontWeight:'700' }}>{item.title}</h4>
                        <p style={{ margin: 0, fontSize: '1rem', color: '#555', lineHeight: '1.7', letterSpacing: '-0.02em' }} dangerouslySetInnerHTML={{ __html: item.desc }} />
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* [Tab 2] Lab Rules (기존 동일) */}
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

        {/* [Tab 4] Lab Wiki - 카테고리 아이콘 적용 버전 */}
        {activeTab === 'wiki' && (
              <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                {/* 상단 헤더 */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                    <h2 style={{color:'#333', margin:0}}>📚 Lab Wiki</h2>
                    <button onClick={() => openRequestModal('Lab Wiki')} style={requestBtnStyle}>✏️ 수정 요청</button>
                </div>

                {/* 카드 그리드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                  {wikiData.map((item) => {
                      
                      // 1. 카테고리에 따라 아이콘 결정하는 로직
                      let categoryIcon;
                      switch (item.category) {
                        case 'Equipment': categoryIcon = <FaIcons.FaTools />; break;        // 장비 -> 도구 아이콘
                        case 'Research':  categoryIcon = <FaIcons.FaBookOpen />; break;     // 연구 -> 펼친 책
                        case 'Admin':     categoryIcon = <FaIcons.FaClipboardList />; break;// 행정 -> 클립보드
                        case 'Ethics':    categoryIcon = <FaIcons.FaBalanceScale />; break; // 윤리 -> 저울
                        case 'Software':  categoryIcon = <FaIcons.FaLaptopCode />; break;   // SW -> 노트북
                        case 'Data':      categoryIcon = <FaIcons.FaChartBar />; break;     // 데이터 -> 차트
                        default:          categoryIcon = <FaIcons.FaInfoCircle />;          // 그 외 -> 정보(i)
                      }

                      return (
                        <div key={item.id} style={{ ...guideCardStyle, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                              {/* 2. 결정된 아이콘 렌더링 */}
                              <div style={{ color: '#004094', fontSize: '1.2rem', marginRight: '10px' }}>
                                  {categoryIcon}
                              </div>
                              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>{item.title}</h3>
                            </div>
                            
                            <div style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.6', whiteSpace: 'pre-wrap', flex: 1 }}>
                              {item.content}
                            </div>
                            
                            {item.link && (
                              <a href={item.link} target="_blank" style={{ marginTop: '15px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#004094', textDecoration: 'none', fontWeight: 'bold' }}>
                                  🔗 바로가기 <FaIcons.FaExternalLinkAlt size={12} />
                              </a>
                            )}
                        </div>
                      );
                  })}
                </div>
              </div>
        )}


        {/* [Tab 5] Member Directory (기존 동일) */}
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

        {/* [신규] Admin Dashboard Tab */}
        {activeTab === 'admin' && user.role === 'admin' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                <h2 style={{color:'#d32f2f', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px'}}>
                    <MdAdminPanelSettings size={28} /> Admin Dashboard
                </h2>
                
                {/* 1. Pending Approvals (가입 승인 대기) */}
                <div style={{ marginBottom: '40px', background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MdPendingActions size={22} color="#d32f2f" /> 가입 승인 대기 ({pendingUsers.length})
                    </h3>
                    
                    {pendingUsers.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>대기 중인 가입 요청이 없습니다.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fa', color: '#555', textAlign: 'left', fontSize: '0.9rem' }}>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>ID</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Name</th>
                                        {/* [추가] 날짜 헤더 */}
                                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Date</th>                                    
                                        <th style={{ padding: '12px', textAlign:'center', borderBottom: '2px solid #eee' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingUsers.map((u, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f3f5' }}>
                                            <td style={{ padding: '12px', color: '#333' }}>{u.id}</td>
                                            <td style={{ padding: '12px', fontWeight:'bold', color: '#333' }}>{u.name}</td>
                                            {/* [추가] 날짜 데이터 표시 */}
                                            {/* [수정] 날짜 데이터 표시 */}
                                            <td style={{ padding: '12px', color: '#666', fontSize: '0.85rem' }}>
                                                {/* 이미 백엔드에서 예쁜 문자열로 만들었으므로, new Date()를 씌우지 말고 그대로 출력합니다. */}
                                                {u.timestamp}
                                            </td>

                                            <td style={{ padding: '12px', textAlign:'center' }}>
                                                <button 
                                                    onClick={() => handleApproveUser(u.id)} 
                                                    style={{ background: '#4dabf7', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', transition: '0.2s' }}
                                                    onMouseOver={(e) => e.target.style.background = '#339af0'}
                                                    onMouseOut={(e) => e.target.style.background = '#4dabf7'}
                                                >
                                                    승인
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                        </div>
                    )}
                </div>

                {/* 2. 콘텐츠 수정/추가 요청 섹션 */}
                <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#1565c0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MdPlaylistAddCheck size={26} color="#1565c0" /> 
                        콘텐츠 수정/추가 요청 ({contentRequests.length})
                    </h3>

                    {contentRequests.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>접수된 요청사항이 없습니다.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                            {contentRequests.map((req, index) => (
                                <div key={index} style={{ border: '1px solid #e9ecef', borderRadius: '8px', padding: '15px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
                                    
                                    {/* 왼쪽: 텍스트 정보 */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <span style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '0.75rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>
                                                {req.page}
                                            </span>
                                            <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>
                                                {new Date(req.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p style={{ color: '#495057', fontSize: '0.95rem', margin: '0 0 10px 0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                            {req.message}
                                        </p>
                                        <div style={{ fontSize: '0.85rem', color: '#868e96' }}>
                                            From: <span style={{ fontWeight: '600', color: '#495057' }}>{req.from}</span>
                                        </div>
                                    </div>

                                    {/* 오른쪽: 버튼만 남김 (Pending 배지 삭제됨) */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '80px' }}>
                                        <button 
                                            onClick={() => handleResolveRequest(req)}
                                            style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                            onMouseOver={(e) => e.target.style.background = '#1b5e20'}
                                            onMouseOut={(e) => e.target.style.background = '#2e7d32'}
                                        >
                                            처리 완료
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. [이식됨] Vacation Manager (Admin 전용 관리) */}
                <div style={{ marginTop: '40px', background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaIcons.FaPlane size={22} color="#004094" /> 연구원 휴가 관리 (Admin Only)
                        </h3>
                        {isSaving && <span style={{fontSize:'0.9rem', color:'#004094', fontWeight:'bold', animation:'blink 1s infinite'}}>💾 Saving...</span>}
                    </div>

                    {isLoading ? (
                        <div style={{textAlign:'center', padding:'40px', color:'#888'}}>데이터 로딩 중...</div>
                    ) : (
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
            </div>
        )}

      </div>

      {/* [신규] Request Modal */}
      {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 5px 20px rgba(0,0,0,0.2)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>✏️ {requestCategory} 수정/추가 요청</h3>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                      내용이 틀렸거나, 새로 추가하고 싶은 정보가 있다면 자유롭게 적어주세요. 관리자에게 전달됩니다.
                  </p>
                  <textarea 
                    value={requestContent} 
                    onChange={(e) => setRequestContent(e.target.value)}
                    placeholder="예: 장비 목록에 3D 프린터 모델명(Ultimaker) 추가 부탁드립니다."
                    style={{ width: '100%', height: '120px', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.95rem', resize: 'vertical', marginBottom: '20px', boxSizing:'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 15px', background: '#f1f3f5', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#555' }}>취소</button>
                      <button onClick={submitRequest} disabled={isSaving} style={{ padding: '10px 15px', background: '#004094', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#fff', opacity: isSaving ? 0.7 : 1 }}>
                          {isSaving ? '전송 중...' : '전송하기'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <style jsx>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes blink { 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

// --- Helper Functions for Styles (기존 동일) ---

const getStatusStyle = (status) => {
    let bg = '#f1f3f4', col = '#3c4043'; 
    if (status === 'Active') { bg = '#e6f4ea'; col = '#137333'; } 
    else if (status === 'Graduated') { bg = '#fce8e6'; col = '#c5221f'; } 
    
    return { fontSize: '0.75rem', padding: '3px 8px', background: bg, color: col, borderRadius: '4px', fontWeight: 'bold' };
};

const getDegreeStyle = (degree) => {
    let bg = '#e8eaed', col = '#3c4043'; 
    const d = degree ? degree.toUpperCase() : '';
    
    if (d.includes('PHD')) { bg = '#188038'; col = '#fff'; } 
    else if (d.includes('MS')) { bg = '#c5221f'; col = '#fff'; } 
    else if (d.includes('BS') || d.includes('UNDER')) { bg = '#1967d2'; col = '#fff'; } 
    else if (d.includes('POSTDOC')) { bg = '#ea8600'; col = '#fff'; } 
    else if (d.includes('VISITOR')) { bg = '#8e24aa'; col = '#fff'; } 

    return { fontSize: '0.75rem', padding: '3px 8px', background: bg, color: col, borderRadius: '4px', fontWeight: 'bold' };
};

const cardLinkStyle = { display: 'flex', alignItems: 'center', padding: '25px', backgroundColor: '#fff', borderRadius: '12px', textDecoration: 'none', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'transform 0.2s, boxShadow 0.2s', cursor: 'pointer' };
const guideCardStyle = { display: 'flex', alignItems: 'flex-start', padding: '25px', background: '#fff', border: '1px solid #e9ecef', borderRadius: '12px', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' };
const contactRow = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', color: '#495057' };
const iconBtnStyle = (bg) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: bg, color: '#fff', borderRadius: '6px', fontSize: '1rem', textDecoration: 'none', transition: 'opacity 0.2s' });

// [추가됨] 요청 버튼 스타일
const requestBtnStyle = { fontSize: '0.85rem', padding: '6px 12px', borderRadius: '20px', border: '1px solid #eee', background: '#fff', cursor: 'pointer', color: '#555', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };