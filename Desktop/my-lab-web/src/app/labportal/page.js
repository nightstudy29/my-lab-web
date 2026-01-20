"use client";

import { useState, useEffect } from 'react';
import internalData from '../../data/internal.json'; 
import { 
  FaLock, FaSignOutAlt, FaSlack, FaBook, FaGavel, FaBullhorn, 
  FaCheckSquare, FaAddressBook, FaFileExcel, FaPhoneAlt, FaEnvelope, 
  FaIdCard, FaExclamationTriangle, FaCalendarAlt, FaPlane, FaMicroscope, FaGraduationCap, FaCoins
} from "react-icons/fa";
import { SiGoogle, SiLinkedin, SiOrcid, SiKakaotalk } from "react-icons/si"; 

const PORTAL_PASSWORD = "smid"; 
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZFKBBsoaoqe9PV4aOz92jS-k5yMr6ynih1NBSFr7490KdMFkRHKsSwyBRha0CTgP-_WlvIiOoUwwh/pub?gid=0&single=true&output=csv"; 

export default function LabPortalPage() {
  const [inputPw, setInputPw] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // [기존 로직 유지] Member Directory 데이터 페칭
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
          if (headerIdx === -1) { setIsLoading(false); return; }
          const dataRows = rows.slice(headerIdx + 1);
          const parsedData = dataRows.map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
            let offset = 0;
            if (cols[0] && !isNaN(cols[0]) && cols[0].length < 3) { offset = -1; }
            return {
              nameKor: cols[2 + offset], nameEng: cols[3 + offset], kakao: cols[4 + offset], 
              year: cols[5 + offset], email: cols[6 + offset], phone: cols[7 + offset], 
              links: { cv: cols[8 + offset], scholar: cols[9 + offset], linkedin: cols[10 + offset], orcid: cols[11 + offset] },
              role: cols[12 + offset],
            };
          });
          setMembers(parsedData.filter(m => m.nameKor && m.nameKor !== ''));
          setIsLoading(false);
        }).catch(() => { setFetchError(true); setIsLoading(false); });
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
    } else alert("Incorrect Password");
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("smid_portal_auth");
    setInputPw("");
  };

  if (!isAuthenticated) return (
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

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}>
      
      {/* [기존 디자인 유지] Header & Quick Cards */}
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
            <div><h3>Address Book (Edit)</h3><p>주소록 데이터 수정</p></div>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid #eee', overflowX: 'auto', paddingBottom: '5px' }}>
          {[
            { id: 'manual', label: 'Newbie Guide', icon: <FaBook /> },
            { id: 'rules', label: 'Lab Rules', icon: <FaGavel /> },
            { id: 'vacation', label: 'Vacation Info', icon: <FaPlane /> },
            { id: 'notices', label: 'Fixed Notices', icon: <FaBullhorn /> },
            { id: 'directory', label: 'Member Directory', icon: <FaAddressBook /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 15px', fontSize: '1rem', fontWeight: 'bold',
                color: activeTab === tab.id ? '#004094' : '#888',
                border: 'none', borderBottom: activeTab === tab.id ? '3px solid #004094' : '3px solid transparent',
                backgroundColor: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ minHeight: '400px' }}>
          
          {/* 1. Newbie Guide - 업데이트됨 */}
          {activeTab === 'manual' && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '20px' }}>👋 Newbie Guide</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                <CheckItem title="개인용 컴퓨터 지원" desc="신입생 150만원 한도 내 컴퓨터 풀세트 지원 (본체, 모니터, 주변기기 포함)" />
                <CheckItem title="예절 및 정숙" desc="학부 교수님들께 인사 및 33동 교수님 연구실 통행 시 절대 정숙 유지" />
                <CheckItem title="소통 채널 가입" desc="Slack 가입 및 이메일 발송 시 지도교수 참조(cc) 원칙 필수 준수" />
                <CheckItem title="출입 등록" desc="301동 행정실 방문 및 지문 등록, 데이터베이스 정보 최신화" />
              </div>
            </div>
          )}

          {/* 2. Lab Rules - 업데이트됨 (상세 내용 반영) */}
          {activeTab === 'rules' && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '20px' }}>⚖️ Lab Rules</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
                <RuleCard icon={<FaCalendarAlt />} title="복무 및 출퇴근" content={
                  <ul style={listStyle}>
                    <li><strong>시간:</strong> 09:00 - 21:00 기본 (자율성을 존중하되 실험 일정 우선)</li>
                    <li><strong>부재 시:</strong> 병원 등 개인 용무는 반드시 <strong>방장에게 미리 공지</strong></li>
                    <li><strong>소통:</strong> 09-18시 사이는 Slack 등으로 교수님과 상시 소통 가능해야 함</li>
                  </ul>
                }/>
                <RuleCard icon={<FaMicroscope />} title="연구 활동 및 보고" content={
                  <ul style={listStyle}>
                    <li><strong>연구노트:</strong> 매일 작성 필수 (실험방법, 시편정보, 아이디어). OneNote 권장</li>
                    <li><strong>정기 발표:</strong> 분기별 1회 <strong>20분 영어 발표</strong> (리뷰, 결과, 향후 계획)</li>
                    <li><strong>리포트:</strong> 분기별 영문 A4 3장 이내 논문 형식 제출 (단순 결과 나열 금지)</li>
                    <li><strong>장비 관리:</strong> 정/부 책임자 운영, 매뉴얼 및 사용일지(로그) 비치</li>
                  </ul>
                }/>
                <RuleCard icon={<FaGraduationCap />} title="졸업 요건 및 주제" content={
                  <ul style={listStyle}>
                    <li><strong>논문:</strong> 통합 5년 내 주저자 7편, JCR 상위 5% 이내 2편 필수 게재</li>
                    <li><strong>페널티:</strong> 통합 7년차부터 졸업 지연 시 <strong>인건비 50% 삭감</strong> 원칙</li>
                    <li><strong>주제:</strong> 1인 1 Topic 원칙. 사수/부사수 관계없음 (졸업 시 후임 인수인계)</li>
                    <li><strong>변경:</strong> 석사졸업으로 중도 변경 시 6학기 이후 졸업 가능</li>
                  </ul>
                }/>
                <RuleCard icon={<FaCoins />} title="인건비 및 학회" content={
                  <ul style={listStyle}>
                    <li><strong>급여:</strong> 석사 120 / 박사 150 원칙 (과제 규모에 따라 연구수당 차등)</li>
                    <li><strong>학회:</strong> 통합 2년차 이상 매년 국내/외 <strong>구두 발표</strong> 각 1회 권장</li>
                    <li><strong>지원:</strong> 권위 있는 학회(MRS, E-MRS, ECS, ACS, IEDM 등) 위주 지원</li>
                  </ul>
                }/>
                <RuleCard icon={<FaExclamationTriangle />} title="무관용 징계 (Zero Tolerance)" highlight={true} content={
                  <div style={{ color: '#d32f2f' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>사안 발생 시 경고 없이 즉각 방출:</p>
                    <ul style={listStyle}>
                      <li>연구 윤리 위반 (데이터 위조, 변조, 표절)</li>
                      <li>미발표 데이터 및 아이디어 외부 무단 유출</li>
                      <li>폭행, 절도, 성희롱, 성폭행, 지속적 괴롭힘 및 가혹 행위</li>
                      <li>연구비 횡령, 연구실 내 도박 및 음주 사고</li>
                    </ul>
                  </div>
                }/>
                <RuleCard icon={<FaBullhorn />} title="연구실 에티켓" content={
                  <ul style={listStyle}>
                    <li><strong>이메일:</strong> 대외 메일 발송 시 <strong>지도교수 참조(cc)</strong> 필수</li>
                    <li><strong>전화:</strong> 응대 시 "OOO 교수님 연구실(SMID Lab)입니다" 명시</li>
                    <li><strong>보안:</strong> 외부인 방문 시 사전 허가, 졸업 전 모든 데이터 아카이빙</li>
                  </ul>
                }/>
              </div>
            </div>
          )}

          {/* 3. Vacation Info - 업데이트됨 */}
          {activeTab === 'vacation' && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '20px' }}>📅 Vacation Request</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #eee' }}>
                  <h3 style={{ marginTop: 0 }}><FaPlane /> 휴가 신청서</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    <div><label style={{ fontSize: '0.9rem', color: '#666' }}>성함</label><input type="text" style={inputStyle} /></div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '0.9rem', color: '#666' }}>시작일</label><input type="date" style={inputStyle} /></div>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '0.9rem', color: '#666' }}>종료일</label><input type="date" style={inputStyle} /></div>
                    </div>
                    <div><label style={{ fontSize: '0.9rem', color: '#666' }}>사유 (병가/경조사/정기휴가)</label><input type="text" placeholder="예: 정기 여름 휴가" style={inputStyle} /></div>
                    <button style={{ padding: '12px', backgroundColor: '#004094', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>지도교수님께 신청 발송</button>
                  </div>
                </div>
                <div style={{ backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '15px' }}>
                  <h3>📌 휴가 규정 요약</h3>
                  <ul style={listStyle}>
                    <li>연 정기 휴가: <strong>7일</strong> (공휴일/주말 제외)</li>
                    <li>본인 결혼 특별 휴가: <strong>5일</strong> 부여</li>
                    <li>병가/경조사: 별도 인정 (교수님께 즉시 보고)</li>
                    <li><strong>주의:</strong> 모든 휴가는 실험 일정을 최우선으로 조정해야 함</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 4. Fixed Notices - 기존 로직 유지 */}
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
          
          {/* 5. Member Directory - [기존 로직 및 디자인 100% 동일 유지] */}
          {activeTab === 'directory' && (
            <div className="animate-fade-in">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>📖 Member Directory</h2>
                <a href="https://docs.google.com/spreadsheets/d/1AwKmN6tcea_8_CDlvfwTEtAiBNQFiAiR6tRQVOgdMQM/edit?usp=sharing" target="_blank" style={{ fontSize: '0.9rem', color: '#004094', textDecoration: 'none', fontWeight: 'bold' }}>
                  <FaFileExcel /> 시트 수정하기
                </a>
              </div>
              {isLoading ? <p>Loading...</p> : (
                <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #eee' }}>
                        <th style={{ padding: '15px' }}>Profile</th>
                        <th style={{ padding: '15px' }}>Contact Info</th>
                        <th style={{ padding: '15px' }}>Academic Links</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((person, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '15px' }}>
                            <strong>{person.nameKor}</strong> <span style={{ color: '#888' }}>{person.nameEng}</span>
                            <div style={{ color: '#004094', fontSize: '0.85rem' }}>{person.role}</div>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ fontSize: '0.9rem' }}>{person.email}</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{person.phone}</div>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              {person.links?.cv && <LinkBadge href={person.links.cv} label="CV" color="#d32f2f" icon={<FaIdCard />} />}
                              {person.links?.scholar && <LinkBadge href={person.links.scholar} label="Scholar" color="#4285F4" icon={<SiGoogle />} />}
                              {person.links?.linkedin && <LinkBadge href={person.links.linkedin} label="LinkedIn" color="#0077B5" icon={<SiLinkedin />} />}
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
        .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// --- Helper Components ---
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginTop: '5px', outline: 'none' };
const listStyle = { margin: 0, paddingLeft: '1.2rem', lineHeight: '1.8', fontSize: '0.9rem', color: '#555' };

function RuleCard({ icon, title, content, highlight = false }) {
  return (
    <div style={{ padding: '20px', backgroundColor: highlight ? '#fff5f5' : '#fff', borderRadius: '12px', border: highlight ? '1px solid #ffcdd2' : '1px solid #eee' }}>
      <h3 style={{ margin: '0 0 10px 0', color: highlight ? '#d32f2f' : '#004094', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {typeof icon === 'string' ? icon : icon} {title}
      </h3>
      <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>{content}</div>
    </div>
  );
}

function LinkBadge({ href, label, color, icon }) {
  if (!href || href === "" || href === "#") return null;
  return (
    <a href={href} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', padding: '3px 6px', borderRadius: '4px', backgroundColor: color, color: '#fff', textDecoration: 'none' }}>
      {icon} <span>{label}</span>
    </a>
  );
}

function CheckItem({ title, desc }) {
  return (
    <div style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #eee' }}>
      <FaCheckSquare size={20} color="#004094" />
      <div><h3 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>{title}</h3><p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{desc}</p></div>
    </div>
  );
}