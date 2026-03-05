'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import rulesData from '@/data/rules.json'; 
import guideData from '@/data/newbieGuide.json';
import wikiData from '@/data/labwiki.json'; 
import * as FaIcons from "react-icons/fa";
import { SiGoogle, SiLinkedin, SiOrcid, SiKakaotalk, SiSlack } from "react-icons/si"; 
import { MdAdminPanelSettings, MdPendingActions, MdPlaylistAddCheck } from "react-icons/md"; 

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZFKBBsoaoqe9PV4aOz92jS-k5yMr6ynih1NBSFr7490KdMFkRHKsSwyBRha0CTgP-_WlvIiOoUwwh/pub?gid=0&single=true&output=csv"; 
const GAS_MEMBER_URL = "https://script.google.com/macros/s/AKfycbwdgyNJ2J6L1nxiCy5DIIfNmsaFRiwg6uwTlWrbY3nnYvufz-wbN4vsWhoj71hWlM_Z7w/exec"; 
const GAS_AUTH_URL = "https://script.google.com/macros/s/AKfycbyaTohnw8xR8yqX3lWUbGsMNaVVc2oL-3OGYQkpYeiKaXRVGKPN0bRcfg59zSkJni_Ppg/exec";

export default function LabPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("rules");
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(null);
  const mobile = isMobile !== false;

  const [pendingUsers, setPendingUsers] = useState([]);
  const [contentRequests, setContentRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestCategory, setRequestCategory] = useState("");
  const [requestContent, setRequestContent] = useState("");

  // 모바일 감지
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 로그인 체크
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { router.push('/login'); return; }
    const userData = JSON.parse(storedUser);
    if (!userData.expiry || Date.now() > userData.expiry) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      localStorage.removeItem('user');
      router.push('/login');
      return;
    }
    setUser(userData);
  }, []);

  // 데이터 로딩
  useEffect(() => {
    if (activeTab === 'directory' || (activeTab === 'admin' && user?.role === 'admin')) {
      if (members.length > 0 && activeTab === 'directory') return;
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
            const checks = ['V1','V2','V3','V4','V5','V6','V7'].map(v => getV(v) === "TRUE");
            return {
              nameKor: getV("Name"), nameEng: getV("Eng. Name"), kakao: getV("Kakao ID"),
              year: getV("Year Joined"), email: getV("E-mail"), phone: getV("Phone"),
              status: getV("Status"), degree: getV("Degree"), position: getV("Current Position"),
              lastUpdated: getV("Last updated"),
              links: { cv: getV("CV_Link"), scholar: getV("Scholar_Link"), linkedin: getV("Linkedin_Link"), orcid: getV("ORCID_Link") },
              vacation: { checks, memo: getV("V_Memo"), year: getV("V_Year") || new Date().getFullYear() }
            };
          });
          setMembers(data.filter(m => m.nameKor));
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }
    if (activeTab === 'admin' && user?.role === 'admin') fetchAdminData();
  }, [activeTab, user]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const res1 = await fetch(GAS_AUTH_URL, {
        method: "POST", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: 'getPendingUsers' })
      });
      if (res1.ok) setPendingUsers(await res1.json());

      const res2 = await fetch(GAS_AUTH_URL, {
        method: "POST", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: 'getRequests' })
      });
      if (res2.ok) setContentRequests(await res2.json());
    } catch (e) {
      console.error("데이터 로딩 실패:", e);
      alert("데이터를 불러오지 못했습니다.");
    }
    setIsLoading(false);
  };

  const handleCheckUpdate = async (memberIndex, dayIndex, currentVal) => {
    const newVal = !currentVal;
    const newMembers = [...members];
    newMembers[memberIndex].vacation.checks[dayIndex] = newVal;
    setMembers(newMembers);
    setIsSaving(true);
    try {
      await fetch(GAS_MEMBER_URL, {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: 'check', name: newMembers[memberIndex].nameKor, dayIndex, checked: newVal })
      });
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleMemoChange = (e, memberIndex) => {
    const newMembers = [...members];
    newMembers[memberIndex].vacation.memo = e.target.value;
    setMembers(newMembers);
  };

  const handleMemoSave = async (memberIndex, text) => {
    const targetMember = members[memberIndex];
    if (targetMember.vacation.prevMemo === text) return;
    setIsSaving(true);
    try {
      await fetch(GAS_MEMBER_URL, {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: 'memo', name: targetMember.nameKor, text })
      });
      const newMembers = [...members];
      newMembers[memberIndex].vacation.prevMemo = text;
      setMembers(newMembers);
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleApproveUser = async (targetId) => {
    if (!confirm("승인하시겠습니까?")) return;
    setIsSaving(true);
    await fetch(GAS_AUTH_URL, {
      method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: 'approveUser', targetId })
    });
    alert("승인 요청 전송됨");
    setPendingUsers(prev => prev.filter(u => u.id !== targetId));
    setIsSaving(false);
  };

  const handleResolveRequest = async (req) => {
    if (!confirm("이 요청을 처리 완료로 변경하시겠습니까?")) return;
    try {
      await fetch(GAS_AUTH_URL, {
        method: "POST", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: 'resolveRequest', requester: req.from, content: req.message })
      });
      setContentRequests(prev => prev.filter(r => r.timestamp !== req.timestamp));
      alert("처리되었습니다.");
    } catch (e) { console.error(e); alert("오류가 발생했습니다."); }
  };

  const openRequestModal = (category) => {
    setRequestCategory(category);
    setRequestContent("");
    setIsModalOpen(true);
  };

  const submitRequest = async () => {
    if (!requestContent.trim()) return alert("내용을 입력해주세요.");
    setIsSaving(true);
    await fetch(GAS_AUTH_URL, {
      method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: 'submitRequest', requester: user.name, category: requestCategory, content: requestContent })
    });
    setIsSaving(false);
    setIsModalOpen(false);
    alert("요청사항이 전달되었습니다.");
  };

  const handleLogout = () => { localStorage.removeItem('user'); router.push('/login'); };

  if (!user) return null;

  return (
    <div style={{ padding: mobile ? '30px 16px' : '60px 20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', minHeight: '100vh' }}>
      
      {/* ===== Header ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: mobile ? 'flex-start' : 'center', flexDirection: mobile ? 'column' : 'row', gap: mobile ? '12px' : '0', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: mobile ? '1.6rem' : '2.2rem', fontWeight: '800' }}>SMID Lab Portal</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#666', fontWeight: 'bold', fontSize: mobile ? '0.9rem' : '1rem' }}>
            {user.name} {user.role === 'admin' ? '(Admin)' : '연구원'}
          </span>
          <button onClick={handleLogout} style={{ cursor: 'pointer', border: '1px solid #ddd', background: '#fff', padding: '8px 15px', borderRadius: '20px', color: '#555', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
            <FaIcons.FaSignOutAlt /> Sign Out
          </button>
        </div>
      </div>

      {/* ===== Shortcuts ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: mobile ? '12px' : '20px', marginBottom: '40px' }}>
        <a href="https://smidlab.slack.com" target="_blank" style={cardLinkStyle(mobile)}>
          <div style={shortcutIconStyle}><SiSlack /></div>
          <div>
            <div style={shortcutTitleStyle}>Slack</div>
            <div style={shortcutSubStyle}>공식 소통 채널</div>
          </div>
        </a>
        <a href="https://open.kakao.com/o/gYhxuwci" target="_blank" style={cardLinkStyle(mobile)}>
          <div style={shortcutIconStyle}><SiKakaotalk /></div>
          <div>
            <div style={shortcutTitleStyle}>Kakao (전체)</div>
            <div style={shortcutSubStyle}>교수님 포함 톡방</div>
          </div>
        </a>
        <a href="#" target="_blank" style={cardLinkStyle(mobile)}>
          <div style={shortcutIconStyle}><SiKakaotalk /></div>
          <div>
            <div style={shortcutTitleStyle}>Kakao (학생)</div>
            <div style={shortcutSubStyle}>교수님 미포함 톡방</div>
          </div>
        </a>
        <a href="https://docs.google.com/spreadsheets/d/1AwKmN6tcea_8_CDlvfwTEtAiBNQFiAiR6tRQVOgdMQM/edit" target="_blank" style={cardLinkStyle(mobile)}>
          <div style={shortcutIconStyle}><FaIcons.FaFileExcel /></div>
          <div>
            <div style={shortcutTitleStyle}>Address Book</div>
            <div style={shortcutSubStyle}>주소록 업데이트</div>
          </div>
        </a>
      </div>

      {/* ===== Tabs ===== */}
      <div style={{ display: 'flex', gap: mobile ? '0px' : '20px', marginBottom: '30px', borderBottom: '2px solid #f1f3f5', overflowX: 'auto', scrollbarWidth: 'none', padding: mobile ? '0 4px' : '0' }}>
        {[
          { id: 'manual', label: 'Newbie Guide', icon: <FaIcons.FaBookOpen /> },
          { id: 'rules', label: 'Lab Rules', icon: <FaIcons.FaGavel /> },
          { id: 'wiki', label: 'Lab Wiki', icon: <FaIcons.FaBook /> },
          { id: 'directory', label: 'Directory', icon: <FaIcons.FaAddressBook /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabBtnStyle(activeTab === t.id, false, mobile)}>
            {t.icon}
            <span style={{ fontSize: mobile ? '0.68rem' : '1rem' }}>{t.label}</span>
          </button>
        ))}
        {user.role === 'admin' && (
          <button onClick={() => setActiveTab('admin')} style={tabBtnStyle(activeTab === 'admin', true, mobile)}>
            <FaIcons.FaUserShield />
            <span style={{ fontSize: mobile ? '0.68rem' : '1rem' }}>Admin</span>
          </button>
        )}
      </div>

      <div style={{ minHeight: '500px' }}>

        {/* ===== Newbie Guide ===== */}
        {activeTab === 'manual' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#333', margin: 0 }}>👋 Newbie Guide</h2>
              <button onClick={() => openRequestModal('Newbie Guide')} style={requestBtnStyle}>✏️ 수정 요청</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
              {guideData.map((item) => (
                <div key={item.id} style={guideCardStyle}>
                  <div style={{ marginRight: '15px', color: '#004094', fontSize: '1.2rem', paddingTop: '3px', flexShrink: 0 }}><FaIcons.FaCheckSquare /></div>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#212529', fontSize: '1.1rem', fontWeight: '700' }}>{item.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#555', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: item.desc }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Lab Rules ===== */}
        {activeTab === 'rules' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>⚖️ Laboratory Rules</h2>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))', gap: '16px' }}>
              {rulesData.map(rule => (
                <div key={rule.id} style={{ padding: '25px', background: rule.highlight ? '#fff5f5' : '#fff', border: rule.highlight ? '2px solid #ffcdd2' : '1px solid #eee', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: rule.highlight ? '#d32f2f' : '#004094', marginTop: 0, fontSize: mobile ? '1rem' : '1.1rem' }}>
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

        {/* ===== Lab Wiki ===== */}
        {activeTab === 'wiki' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ color: '#333', margin: 0 }}>📚 Lab Wiki</h2>
              <button onClick={() => openRequestModal('Lab Wiki')} style={requestBtnStyle}>✏️ 수정 요청</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
              {wikiData.map((item) => {
                let categoryIcon;
                switch (item.category) {
                  case 'Equipment': categoryIcon = <FaIcons.FaTools />; break;
                  case 'Research':  categoryIcon = <FaIcons.FaBookOpen />; break;
                  case 'Admin':     categoryIcon = <FaIcons.FaClipboardList />; break;
                  case 'Ethics':    categoryIcon = <FaIcons.FaBalanceScale />; break;
                  case 'Software':  categoryIcon = <FaIcons.FaLaptopCode />; break;
                  case 'Data':      categoryIcon = <FaIcons.FaChartBar />; break;
                  default:          categoryIcon = <FaIcons.FaInfoCircle />;
                }
                return (
                  <div key={item.id} style={{ ...guideCardStyle, flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ color: '#004094', fontSize: '1.1rem', marginRight: '10px' }}>{categoryIcon}</div>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>{item.title}</h3>
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.6', whiteSpace: 'pre-wrap', flex: 1 }}>{item.content}</div>
                    {item.link && (
                      <a href={item.link} target="_blank" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#004094', textDecoration: 'none', fontWeight: 'bold' }}>
                        🔗 바로가기 <FaIcons.FaExternalLinkAlt size={12} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== Member Directory ===== */}
        {activeTab === 'directory' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>📇 Member Directory</h2>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>데이터를 불러오는 중입니다...</div>
            ) : mobile ? (
              // 모바일: 카드 형태
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {members.map((m, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', color: '#333' }}>{m.nameKor}</strong>
                        <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: '5px' }}>({m.nameEng})</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#004094', fontWeight: 'bold', background: '#e7f5ff', padding: '2px 6px', borderRadius: '4px' }}>{m.year}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '8px' }}>{m.position}</div>
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span style={getStatusStyle(m.status)}>{m.status}</span>
                      <span style={getDegreeStyle(m.degree)}>{m.degree}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '8px' }}>
                      {m.email && <div style={{ marginBottom: '4px' }}>✉️ {m.email}</div>}
                      {m.phone && <div style={{ marginBottom: '4px' }}>📞 {m.phone}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {m.links.cv && <a href={m.links.cv} target="_blank" style={iconBtnStyle('#d32f2f')} title="CV"><FaIcons.FaFilePdf /></a>}
                      {m.links.scholar && <a href={m.links.scholar} target="_blank" style={iconBtnStyle('#4285F4')} title="Scholar"><SiGoogle /></a>}
                      {m.links.linkedin && <a href={m.links.linkedin} target="_blank" style={iconBtnStyle('#0077B5')} title="LinkedIn"><SiLinkedin /></a>}
                      {m.links.orcid && <a href={m.links.orcid} target="_blank" style={iconBtnStyle('#A6CE39')} title="ORCID"><SiOrcid /></a>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 데스크탑: 테이블
              <div style={{ overflowX: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRadius: '12px', border: '1px solid #eee' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '15px', color: '#555' }}>Member Info</th>
                      <th style={{ padding: '15px', color: '#555' }}>Contact</th>
                      <th style={{ padding: '15px', textAlign: 'center', color: '#555' }}>Links</th>
                      <th style={{ padding: '15px', textAlign: 'center', color: '#555' }}>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f3f5' }}>
                        <td style={{ padding: '15px' }}>
                          <div style={{ marginBottom: '4px' }}>
                            <strong style={{ fontSize: '1.1rem', color: '#333' }}>{m.nameKor}</strong>
                            <span style={{ color: '#888', fontSize: '0.9rem', marginLeft: '5px' }}>({m.nameEng})</span>
                            <span style={{ fontSize: '0.85rem', color: '#004094', fontWeight: 'bold', marginLeft: '8px', background: '#e7f5ff', padding: '2px 6px', borderRadius: '4px' }}>{m.year}</span>
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
                            {m.links.scholar && <a href={m.links.scholar} target="_blank" style={iconBtnStyle('#4285F4')} title="Scholar"><SiGoogle /></a>}
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

        {/* ===== Admin Dashboard ===== */}
        {activeTab === 'admin' && user.role === 'admin' && (
          <div>
            <h2 style={{ color: '#d32f2f', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MdAdminPanelSettings size={24} /> Admin Dashboard
            </h2>

            {/* 가입 승인 대기 */}
            <div style={adminCardStyle}>
              <h3 style={{ marginTop: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdPendingActions size={22} color="#d32f2f" /> 가입 승인 대기 ({pendingUsers.length})
              </h3>
              {pendingUsers.length === 0 ? (
                <p style={{ color: '#888', fontSize: '0.9rem' }}>대기 중인 가입 요청이 없습니다.</p>
              ) : mobile ? (
                // 모바일: 카드
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                  {pendingUsers.map((u, idx) => (
                    <div key={idx} style={{ background: '#f8f9fa', border: '1px solid #eee', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>{u.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{u.id}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{u.timestamp}</div>
                      </div>
                      <button onClick={() => handleApproveUser(u.id)} style={approveBtn}>승인</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', color: '#555', textAlign: 'left', fontSize: '0.9rem' }}>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>ID</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Name</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #eee' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((u, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f3f5' }}>
                          <td style={{ padding: '12px', color: '#333' }}>{u.id}</td>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#333' }}>{u.name}</td>
                          <td style={{ padding: '12px', color: '#666', fontSize: '0.85rem' }}>{u.timestamp}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button onClick={() => handleApproveUser(u.id)} style={approveBtn}>승인</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 콘텐츠 수정 요청 */}
            <div style={adminCardStyle}>
              <h3 style={{ marginTop: 0, color: '#1565c0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdPlaylistAddCheck size={26} color="#1565c0" /> 콘텐츠 수정/추가 요청 ({contentRequests.length})
              </h3>
              {contentRequests.length === 0 ? (
                <p style={{ color: '#888', fontSize: '0.9rem' }}>접수된 요청사항이 없습니다.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                  {contentRequests.map((req, index) => (
                    <div key={index} style={{ border: '1px solid #e9ecef', borderRadius: '8px', padding: '15px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: mobile ? 'wrap' : 'nowrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '0.75rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>{req.page}</span>
                          <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>{new Date(req.timestamp).toLocaleString()}</span>
                        </div>
                        <p style={{ color: '#495057', fontSize: '0.95rem', margin: '0 0 8px 0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{req.message}</p>
                        <div style={{ fontSize: '0.85rem', color: '#868e96' }}>From: <span style={{ fontWeight: '600', color: '#495057' }}>{req.from}</span></div>
                      </div>
                      <button onClick={() => handleResolveRequest(req)} style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        처리 완료
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 휴가 관리 */}
            <div style={{ ...adminCardStyle, marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaIcons.FaPlane size={20} color="#004094" /> 연구원 휴가 관리
                </h3>
                {isSaving && <span style={{ fontSize: '0.9rem', color: '#004094', fontWeight: 'bold' }}>💾 Saving...</span>}
              </div>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>데이터 로딩 중...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {members.filter(m => m.status === 'Active').map((m, mIdx) => {
                    const originalIndex = members.findIndex(orig => orig.nameKor === m.nameKor);
                    const usedCount = m.vacation.checks.filter(Boolean).length;
                    const remain = 7 - usedCount;
                    return (
                      <div key={mIdx} style={{ 
                        padding: '16px', background: '#fff',
                        border: '1px solid #e9ecef', borderRadius: '12px',
                        borderTop: remain === 0 ? '4px solid #d32f2f' : '4px solid #4dabf7',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                      }}>
                        {/* 1행: 이름 + 몇일 남음 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div>
                            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333' }}>{m.nameKor}</span>
                            <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '6px' }}>{m.position}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: remain === 0 ? '#d32f2f' : '#004094', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                            {remain}일 남음 <span style={{ fontWeight: 'normal', color: '#999', fontSize: '0.75rem' }}>({usedCount}/7)</span>
                          </div>
                        </div>
                        {/* 2행: 체크박스 7개 */}
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                          {m.vacation.checks.map((isChecked, dayIdx) => (
                            <div key={dayIdx} onClick={() => handleCheckUpdate(originalIndex, dayIdx, isChecked)}
                              style={{ 
                                flex: 1,
                                height: '40px',
                                backgroundColor: isChecked ? '#4dabf7' : '#fff',
                                border: isChecked ? '2px solid #4dabf7' : '2px solid #dee2e6',
                                borderRadius: '6px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', transition: 'all 0.2s',
                              }}>
                              {isChecked && <FaIcons.FaCheck size={12} />}
                            </div>
                          ))}
                        </div>
                        {/* 메모 */}
                        <input type="text" placeholder="휴가일자 기록 (예: 8/15-18)" value={m.vacation.memo}
                          onChange={(e) => handleMemoChange(e, originalIndex)}
                          onBlur={(e) => handleMemoSave(originalIndex, e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #eee', background: '#f8f9fa', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', color: '#555' }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== Request Modal ===== */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ background: '#fff', padding: mobile ? '20px' : '30px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 5px 20px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#333' }}>✏️ {requestCategory} 수정/추가 요청</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '12px' }}>내용이 틀렸거나, 새로 추가하고 싶은 정보가 있다면 자유롭게 적어주세요.</p>
            <textarea value={requestContent} onChange={(e) => setRequestContent(e.target.value)}
              placeholder="예: 장비 목록에 3D 프린터 모델명(Ultimaker) 추가 부탁드립니다."
              style={{ width: '100%', height: '120px', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.95rem', resize: 'vertical', marginBottom: '16px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 15px', background: '#f1f3f5', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#555' }}>취소</button>
              <button onClick={submitRequest} disabled={isSaving} style={{ padding: '10px 15px', background: '#004094', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#fff', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? '전송 중...' : '전송하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 50% { opacity: 0.5; } }
        div[style*="overflowX: auto"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

// ===== 스타일 헬퍼 =====
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

const cardLinkStyle = (mobile) => ({
  display: 'flex', alignItems: 'center',
  padding: mobile ? '16px 12px' : '25px',
  backgroundColor: '#fff', borderRadius: '12px', textDecoration: 'none',
  border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'pointer',
});

const tabBtnStyle = (isActive, isAdmin, mobile) => ({
  padding: mobile ? '10px 0' : '12px 5px',
  border: 'none', background: 'none', fontWeight: 'bold',
  color: isActive ? (isAdmin ? '#d32f2f' : '#004094') : '#adb5bd',
  borderBottom: isActive ? `3px solid ${isAdmin ? '#d32f2f' : '#004094'}` : '3px solid transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  flexDirection: mobile ? 'column' : 'row',
  flex: mobile ? '1 1 0' : 'unset',
  justifyContent: 'center',
  gap: mobile ? '3px' : '8px',
  fontSize: mobile ? '0.68rem' : '1rem',
  whiteSpace: 'nowrap', transition: 'all 0.2s',
  minWidth: 0,
  lineHeight: 1,           // ✅ 줄높이 통일
  boxSizing: 'border-box', // ✅ 패딩 포함 크기 계산
});

const shortcutIconStyle = { fontSize: '2rem', color: '#444', marginRight: '12px', display: 'flex', alignItems: 'center', flexShrink: 0 };
const shortcutTitleStyle = { fontWeight: 'bold', fontSize: '1rem', color: '#333', marginBottom: '3px' };
const shortcutSubStyle = { fontSize: '0.85rem', color: '#777' };
const guideCardStyle = { display: 'flex', alignItems: 'flex-start', padding: '20px', background: '#fff', border: '1px solid #e9ecef', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' };
const adminCardStyle = { marginBottom: '20px', background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const contactRow = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', color: '#495057' };
const iconBtnStyle = (bg) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: bg, color: '#fff', borderRadius: '6px', fontSize: '1rem', textDecoration: 'none' });
const approveBtn = { background: '#4dabf7', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' };
const requestBtnStyle = { fontSize: '0.85rem', padding: '6px 12px', borderRadius: '20px', border: '1px solid #eee', background: '#fff', cursor: 'pointer', color: '#555', fontWeight: 'bold' };