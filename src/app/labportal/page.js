'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import rulesData from '@/data/rules.json';
import guideData from '@/data/newbieGuide.json';
import wikiData from '@/data/labwiki.json';
import * as FaIcons from "react-icons/fa";
import { SiKakaotalk, SiSlack } from "react-icons/si";
import { MdAdminPanelSettings, MdPendingActions, MdPlaylistAddCheck } from "react-icons/md";
import ClassMaterialAdmin from '@/components/ClassMaterialAdmin';
import PapersAdmin from '@/components/PapersAdmin';
import NewsAdmin from '@/components/NewsAdmin';
import PatentsAdmin from '@/components/PatentsAdmin';
import AccountsAdmin from '@/components/AccountsAdmin';
import AdminDashboard from '@/components/AdminDashboard';
import AchievementsAdmin from '@/components/AchievementsAdmin';
import DirectoryMaster from '@/components/DirectoryMaster';
import VacationAdmin from '@/components/VacationAdmin';
import MemberDirectory from '@/components/MemberDirectory';
import MyProfileForm, { missingProfileFields } from '@/components/MyProfileForm';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import useIsMobile from '@/hooks/useIsMobile';
import { ROLE_LABELS, canManageContent } from '@/lib/roles';
import { ToastProvider, ConfirmProvider, useToast, useConfirm } from '@/components/ui';

// roles: 이 메뉴를 볼 수 있는 역할 (manager 는 논문/특허/뉴스만). group: 왼쪽 메뉴 묶음.
const ADMIN_SUB_TABS = [
  { id: 'dashboard', label: '대시보드', roles: ['admin', 'manager'], group: null },
  { id: 'papers', label: '논문', roles: ['admin', 'manager'], group: '콘텐츠' },
  { id: 'patents', label: '특허', roles: ['admin', 'manager'], group: '콘텐츠' },
  { id: 'news', label: '뉴스', roles: ['admin', 'manager'], group: '콘텐츠' },
  { id: 'classmaterial', label: '강의자료', roles: ['admin'], group: '콘텐츠' },
  { id: 'achievements', label: '업적', roles: ['admin'], group: '콘텐츠' },
  { id: 'approvals', label: '가입 승인', roles: ['admin'], group: '사람', badge: 'pending' },
  { id: 'accounts', label: '계정 관리', roles: ['admin'], group: '사람' },
  { id: 'directory', label: '멤버 관리', roles: ['admin'], group: '사람' },
  { id: 'vacation', label: '휴가 관리', roles: ['admin'], group: '사람' },
  { id: 'requests', label: '수정 요청', roles: ['admin'], group: '기타', badge: 'requests' },
];
const ADMIN_GROUPS = [null, '콘텐츠', '사람', '기타'];

export default function LabPortalPage() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <LabPortalInner />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function LabPortalInner() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("rules");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile(768);
  const mobile = isMobile !== false;

  // 내 멤버 정보 (필수 항목 비어 있으면 배너)
  const [myMember, setMyMember] = useState(undefined); // undefined = 아직 안 불러옴, null = 연결 없음

  const [pendingUsers, setPendingUsers] = useState([]);
  const [contentRequests, setContentRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestCategory, setRequestCategory] = useState("");
  const [requestContent, setRequestContent] = useState("");
  const [adminSubTab, setAdminSubTab] = useState('dashboard');
  const [rejectTarget, setRejectTarget] = useState(null);   // 거절 모달 대상 (pending user)
  const [rejectReason, setRejectReason] = useState("");

  // 역할별로 보이는 Admin 서브탭. 현재 선택이 안 보이는 탭이면 첫 탭으로.
  const visibleSubTabs = user ? ADMIN_SUB_TABS.filter(t => t.roles.includes(user.role)) : [];
  const activeSubTab = visibleSubTabs.some(t => t.id === adminSubTab) ? adminSubTab : visibleSubTabs[0]?.id;

  // 로그인 체크 — httpOnly 세션 쿠키를 서버(/api/session)에서 검증합니다.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/session')
      .then(async (res) => {
        if (cancelled) return;
        const data = res.ok ? await res.json() : null;
        if (!data?.user) { router.replace('/login'); return; }
        setUser(data.user);
      })
      .catch(() => { if (!cancelled) router.replace('/login'); });
    return () => { cancelled = true; };
  }, [router]);

  // 내 멤버 정보 (배너용)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch('/api/members/me')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setMyMember(d.member ?? null); })
      .catch(() => { if (!cancelled) setMyMember(null); });
    return () => { cancelled = true; };
  }, [user]);

  // Admin 데이터 로딩
  useEffect(() => {
    if (activeTab === 'admin' && user?.role === 'admin') fetchAdminData();
  }, [activeTab, user]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [res1, res2] = await Promise.all([
        fetch('/api/admin/users?status=pending'),
        fetch('/api/requests?status=open'),
      ]);
      if (res1.ok) setPendingUsers((await res1.json()).users || []);
      if (res2.ok) setContentRequests((await res2.json()).requests || []);
    } catch (e) {
      console.error("데이터 로딩 실패:", e);
      toast.error("데이터를 불러오지 못했습니다.");
    }
    setIsLoading(false);
  };

  const patchUser = async (id, action, extra = {}) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '실패');
    return data;
  };

  const handleApproveUser = async (u) => {
    if (!(await confirm({ title: '가입 승인', message: `${u.name} (${u.userId}) 계정을 승인합니다.\n멤버 정보(Directory) 행이 자동으로 만들어집니다.`, confirmText: '승인' }))) return;
    setIsSaving(true);
    try {
      await patchUser(u.id, 'approve');
      setPendingUsers(prev => prev.filter(p => p.id !== u.id));
      toast.success(`${u.name} 계정을 승인했습니다.`);
    } catch (e) { toast.error("승인 실패: " + e.message); }
    setIsSaving(false);
  };

  const handleRejectUser = async () => {
    if (!rejectTarget) return;
    setIsSaving(true);
    try {
      await patchUser(rejectTarget.id, 'reject', { reason: rejectReason.trim() || null });
      setPendingUsers(prev => prev.filter(p => p.id !== rejectTarget.id));
      setRejectTarget(null);
      setRejectReason("");
      toast.success('가입 신청을 거절했습니다.');
    } catch (e) { toast.error("거절 실패: " + e.message); }
    setIsSaving(false);
  };

  const handleResolveRequest = async (req) => {
    if (!(await confirm({ title: '처리 완료', message: '이 요청을 처리 완료로 표시합니다.', confirmText: '완료' }))) return;
    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: req.id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || '실패');
      setContentRequests(prev => prev.filter(r => r.id !== req.id));
      toast.success('처리 완료로 표시했습니다.');
    } catch (e) { console.error(e); toast.error("오류가 발생했습니다: " + e.message); }
  };

  const openRequestModal = (category) => {
    setRequestCategory(category);
    setRequestContent("");
    setIsModalOpen(true);
  };

  const submitRequest = async () => {
    if (!requestContent.trim()) return toast.error("내용을 입력해주세요.");
    setIsSaving(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: requestCategory, content: requestContent }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || '실패');
      setIsModalOpen(false);
      toast.success("요청사항이 전달되었습니다.");
    } catch (e) { toast.error("전송 실패: " + e.message); }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await fetch('/api/session', { method: 'DELETE' }).catch(() => {});
    router.replace('/login');
  };

  if (!user) return null;

  // 관리자가 초기화한 임시 비밀번호로 들어온 상태면 새 비밀번호를 먼저 설정해야 함
  if (user.mustChangePassword) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '20px' }}>
        <div style={{ padding: '40px', background: '#fff', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ margin: '0 0 8px', color: '#333', fontSize: '1.3rem' }}>🔑 새 비밀번호 설정</h2>
          <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 16px' }}>임시 비밀번호로 로그인했습니다. 계속하려면 본인만 아는 새 비밀번호로 바꿔주세요.</p>
          <ChangePasswordForm forced currentLabel="임시 비밀번호" onSuccess={() => setUser(prev => ({ ...prev, mustChangePassword: false }))} />
        </div>
      </div>
    );
  }

  const missingProfile = myMember ? missingProfileFields(myMember) : [];
  const showProfileBanner = activeTab !== 'profile' && (myMember === null || missingProfile.length > 0);

  return (
    <div style={{ padding: mobile ? '30px 16px' : '60px 20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', minHeight: '100vh' }}>

      {/* ===== Header ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: mobile ? 'flex-start' : 'center', flexDirection: mobile ? 'column' : 'row', gap: mobile ? '12px' : '0', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: mobile ? '1.6rem' : '2.2rem', fontWeight: '800' }}>SMID Lab Portal</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#666', fontWeight: 'bold', fontSize: mobile ? '0.9rem' : '1rem' }}>
            {user.name} <span style={{ color: user.role === 'admin' ? '#d32f2f' : user.role === 'manager' ? '#004094' : '#888', fontWeight: 'normal', fontSize: '0.85rem' }}>({ROLE_LABELS[user.role] || user.role})</span>
          </span>
          <button onClick={handleLogout} style={{ cursor: 'pointer', border: '1px solid #ddd', background: '#fff', padding: '8px 15px', borderRadius: '20px', color: '#555', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
            <FaIcons.FaSignOutAlt /> Sign Out
          </button>
        </div>
      </div>

      {/* ===== 내 정보 채우기 배너 ===== */}
      {showProfileBanner && myMember !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: '#fff4e5', border: '1px solid #ffd9a8', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.9rem', color: '#8a5200' }}>
          <FaIcons.FaUserEdit />
          <span style={{ flex: 1 }}>
            {myMember === null
              ? '계정에 연결된 멤버 정보가 아직 없습니다. 교수님이 연결하면 「Account」에서 채울 수 있어요.'
              : `「Account」에 아직 비어 있는 항목이 있어요 — 채워두면 홈페이지 Members 와 Directory 에 자동 반영됩니다.`}
          </span>
          {myMember !== null && <button onClick={() => setActiveTab('profile')} style={{ ...requestBtnStyle, background: '#004094', color: '#fff', border: 'none' }}>Account에서 채우기</button>}
        </div>
      )}

      {/* ===== Shortcuts ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: mobile ? '10px' : '20px', marginBottom: '40px' }}>
        <a href="https://smidlab.slack.com" target="_blank" rel="noopener noreferrer" style={cardLinkStyle(mobile)}>
          <div style={shortcutIconStyle}><SiSlack /></div>
          <div>
            <div style={shortcutTitleStyle}>Slack</div>
            <div style={shortcutSubStyle}>공식 소통 채널</div>
          </div>
        </a>
        <a href="https://open.kakao.com/o/gYhxuwci" target="_blank" rel="noopener noreferrer" style={cardLinkStyle(mobile)}>
          <div style={shortcutIconStyle}><SiKakaotalk /></div>
          <div>
            <div style={shortcutTitleStyle}>Kakao (전체)</div>
            <div style={shortcutSubStyle}>교수님 포함 톡방</div>
          </div>
        </a>
        <a href="https://open.kakao.com/o/g62RoPAi" target="_blank" rel="noopener noreferrer" style={cardLinkStyle(mobile)}>
          <div style={shortcutIconStyle}><SiKakaotalk /></div>
          <div>
            <div style={shortcutTitleStyle}>Kakao (학생)</div>
            <div style={shortcutSubStyle}>교수님 미포함 톡방</div>
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
          { id: 'profile', label: 'Account', icon: <FaIcons.FaIdCard /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabBtnStyle(activeTab === t.id, false, mobile)}>
            {t.icon}
            <span style={{ fontSize: mobile ? '0.68rem' : '1rem' }}>{t.label}</span>
          </button>
        ))}
        {canManageContent(user.role) && (
          <button onClick={() => setActiveTab('admin')} style={tabBtnStyle(activeTab === 'admin', true, mobile)}>
            <FaIcons.FaUserShield />
            <span style={{ fontSize: mobile ? '0.68rem' : '1rem' }}>{user.role === 'admin' ? 'Admin' : 'Manage'}</span>
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
              {guideData.map((item) => {
                const guideIconMap = {
                  1: <FaIcons.FaSignInAlt />, 2: <FaIcons.FaDesktop />, 3: <FaIcons.FaBoxOpen />, 4: <FaIcons.FaHardHat />,
                  5: <FaIcons.FaShieldAlt />, 6: <FaIcons.FaCalendarAlt />, 7: <FaIcons.FaDoorOpen />, 8: <FaIcons.FaFlask />,
                  9: <FaIcons.FaPrint />, 10: <FaIcons.FaChalkboardTeacher />, 11: <FaIcons.FaHeartbeat />, 12: <FaIcons.FaDumbbell />,
                };
                return (
                  <div key={item.id} style={wikiCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ color: '#004094', fontSize: '1.1rem', marginRight: '10px', flexShrink: 0 }}>
                        {guideIconMap[item.id] || <FaIcons.FaInfoCircle />}
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: '#333', fontWeight: '700' }}>{item.title}</h3>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: item.desc }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== Lab Rules ===== */}
        {activeTab === 'rules' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>⚖️ Laboratory Rules</h2>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))', gap: '16px' }}>
              {rulesData.map(rule => (
                <div key={rule.id} style={{ ...wikiCardStyle, borderLeft: rule.highlight ? '4px solid #d32f2f' : '4px solid #004094' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ color: rule.highlight ? '#d32f2f' : '#004094', fontSize: '1.1rem', marginRight: '10px', flexShrink: 0 }}>
                      {FaIcons[rule.icon] ? React.createElement(FaIcons[rule.icon]) : <FaIcons.FaCheckCircle />}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: rule.highlight ? '#d32f2f' : '#333', fontWeight: '700' }}>{rule.title}</h3>
                  </div>
                  <ul style={{ paddingLeft: '18px', lineHeight: '1.8', color: '#555', fontSize: '0.9rem', margin: 0 }}>
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
                  <div key={item.id} style={wikiCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ color: '#004094', fontSize: '1.1rem', marginRight: '10px' }}>{categoryIcon}</div>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>{item.title}</h3>
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.6', whiteSpace: 'pre-wrap', flex: 1 }}>{item.content}</div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#004094', textDecoration: 'none', fontWeight: 'bold' }}>
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
        {activeTab === 'directory' && <MemberDirectory mobile={mobile} />}

        {/* ===== Account: 내 정보 + 비밀번호 변경 ===== */}
        {activeTab === 'profile' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '6px' }}>🪪 Account</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 20px' }}>
              여기 입력한 내용은 홈페이지 <strong>Members</strong> 페이지(공개)와 포털 <strong>Directory</strong>(멤버만)에 자동 반영됩니다. 전화번호·Kakao ID는 공개되지 않습니다.
            </p>
            <div style={adminCardStyle}>
              <MyProfileForm onSaved={(m) => setMyMember(m)} showPassword userId={user.userID} />
            </div>
          </div>
        )}

        {/* ===== Admin Dashboard ===== */}
        {activeTab === 'admin' && canManageContent(user.role) && (
          <div>
            <h2 style={{ color: '#004094', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MdAdminPanelSettings size={24} /> {user.role === 'admin' ? 'Admin' : '콘텐츠 관리'}
            </h2>

            {/* ===== 2단: 왼쪽 세로 메뉴(데스크톱) / 가로 칩(모바일) + 오른쪽 내용 ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '190px minmax(0, 1fr)', gap: mobile ? '16px' : '28px', alignItems: 'start' }}>
              {mobile ? (
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
                  {visibleSubTabs.map(t => {
                    const badge = t.badge === 'pending' ? pendingUsers.length : t.badge === 'requests' ? contentRequests.length : 0;
                    return (
                      <button key={t.id} onClick={() => setAdminSubTab(t.id)} style={adminChipStyle(activeSubTab === t.id)}>
                        {t.label}{badge > 0 && <span style={menuBadge}>{badge}</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <nav style={{ position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {ADMIN_GROUPS.map(g => {
                    const items = visibleSubTabs.filter(t => t.group === g);
                    if (items.length === 0) return null;
                    return (
                      <div key={g ?? 'top'} style={{ marginBottom: '10px' }}>
                        {g && <div style={menuGroupLabel}>{g}</div>}
                        {items.map(t => {
                          const badge = t.badge === 'pending' ? pendingUsers.length : t.badge === 'requests' ? contentRequests.length : 0;
                          return (
                            <button key={t.id} onClick={() => setAdminSubTab(t.id)} style={adminMenuItemStyle(activeSubTab === t.id)}>
                              <span>{t.label}</span>
                              {badge > 0 && <span style={menuBadge}>{badge}</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </nav>
              )}

              <div style={{ minWidth: 0 }}>
            {/* 대시보드 */}
            {activeSubTab === 'dashboard' && (
              <AdminDashboard user={user} mobile={mobile} pendingCount={pendingUsers.length} requestsCount={contentRequests.length} onNavigate={setAdminSubTab} />
            )}

            {/* 가입 승인 대기 */}
            {activeSubTab === 'approvals' && (
              <div style={adminCardStyle}>
                <h3 style={{ marginTop: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MdPendingActions size={22} color="#d32f2f" /> 가입 승인 대기 ({pendingUsers.length})
                </h3>
                {isLoading ? (
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>불러오는 중...</p>
                ) : pendingUsers.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>대기 중인 가입 요청이 없습니다.</p>
                ) : mobile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                    {pendingUsers.map((u) => (
                      <div key={u.id} style={{ background: '#f8f9fa', border: '1px solid #eee', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#888' }}>{u.userId}</div>
                          <div style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(u.createdAt).toLocaleString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button onClick={() => handleApproveUser(u)} disabled={isSaving} style={approveBtn}>승인</button>
                          <button onClick={() => { setRejectTarget(u); setRejectReason(""); }} disabled={isSaving} style={rejectBtn}>거절</button>
                        </div>
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
                          <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>신청일</th>
                          <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #eee' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingUsers.map((u) => (
                          <tr key={u.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                            <td style={{ padding: '12px', color: '#333' }}>{u.userId}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#333' }}>{u.name}</td>
                            <td style={{ padding: '12px', color: '#666', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleString()}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button onClick={() => handleApproveUser(u)} disabled={isSaving} style={approveBtn}>승인</button>
                                <button onClick={() => { setRejectTarget(u); setRejectReason(""); }} disabled={isSaving} style={rejectBtn}>거절</button>
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

            {/* 계정 관리 */}
            {activeSubTab === 'accounts' && <AccountsAdmin currentUserId={user.userID} />}

            {/* 멤버 관리 */}
            {activeSubTab === 'directory' && <DirectoryMaster />}

            {/* 콘텐츠 수정 요청 */}
            {activeSubTab === 'requests' && (
              <div style={adminCardStyle}>
                <h3 style={{ marginTop: 0, color: '#1565c0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MdPlaylistAddCheck size={26} color="#1565c0" /> 콘텐츠 수정/추가 요청 ({contentRequests.length})
                </h3>
                {contentRequests.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>접수된 요청사항이 없습니다.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                    {contentRequests.map((req) => (
                      <div key={req.id} style={{ border: '1px solid #e9ecef', borderRadius: '8px', padding: '15px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: mobile ? 'wrap' : 'nowrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '0.75rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>{req.category}</span>
                            <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>{new Date(req.createdAt).toLocaleString()}</span>
                          </div>
                          <p style={{ color: '#495057', fontSize: '0.95rem', margin: '0 0 8px 0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{req.content}</p>
                          <div style={{ fontSize: '0.85rem', color: '#868e96' }}>From: <span style={{ fontWeight: '600', color: '#495057' }}>{req.requesterName}</span></div>
                        </div>
                        <button onClick={() => handleResolveRequest(req)} style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          처리 완료
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 휴가 관리 */}
            {activeSubTab === 'vacation' && (
              <div style={adminCardStyle}>
                <VacationAdmin mobile={mobile} />
              </div>
            )}

            {/* 강의자료 / 논문 / 특허 / 뉴스 */}
            {activeSubTab === 'classmaterial' && <ClassMaterialAdmin />}
            {activeSubTab === 'papers' && <PapersAdmin />}
            {activeSubTab === 'patents' && <PatentsAdmin />}
            {activeSubTab === 'news' && <NewsAdmin />}
            {activeSubTab === 'achievements' && <AchievementsAdmin />}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== 가입 거절 모달 ===== */}
      {rejectTarget && (
        <div style={modalBackdrop}>
          <div style={modalBox(mobile)}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#333' }}>가입 거절 — {rejectTarget.name} ({rejectTarget.userId})</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '12px' }}>사유는 선택입니다. 거절된 ID로는 다시 가입 신청할 수 있습니다.</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="예: 연구실 구성원이 아님"
              style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.95rem', resize: 'vertical', marginBottom: '16px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectTarget(null)} style={modalCancelBtn}>취소</button>
              <button onClick={handleRejectUser} disabled={isSaving} style={{ ...modalPrimaryBtn, background: '#d32f2f', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? '처리 중...' : '거절'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Request Modal ===== */}
      {isModalOpen && (
        <div style={modalBackdrop}>
          <div style={modalBox(mobile)}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#333' }}>✏️ {requestCategory} 수정/추가 요청</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '12px' }}>내용이 틀렸거나, 새로 추가하고 싶은 정보가 있다면 자유롭게 적어주세요.</p>
            <textarea value={requestContent} onChange={(e) => setRequestContent(e.target.value)}
              placeholder="예: 장비 목록에 3D 프린터 모델명(Ultimaker) 추가 부탁드립니다."
              style={{ width: '100%', height: '120px', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.95rem', resize: 'vertical', marginBottom: '16px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsModalOpen(false)} style={modalCancelBtn}>취소</button>
              <button onClick={submitRequest} disabled={isSaving} style={{ ...modalPrimaryBtn, opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? '전송 중...' : '전송하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        div[style*="overflowX: auto"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

// ===== 스타일 헬퍼 =====
const cardLinkStyle = (mobile) => ({
  display: 'flex', alignItems: 'center',
  flexDirection: mobile ? 'column' : 'row', textAlign: mobile ? 'center' : 'left', gap: mobile ? '6px' : 0,
  padding: mobile ? '14px 8px' : '25px',
  backgroundColor: '#fff', borderRadius: '12px', textDecoration: 'none',
  border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'pointer',
});

const tabBtnStyle = (isActive, isAdmin, mobile) => ({
  padding: mobile ? '10px 0' : '12px 5px',
  border: 'none', background: 'none', fontWeight: 'bold',
  color: isActive ? '#004094' : '#adb5bd',
  borderBottom: isActive ? '3px solid #004094' : '3px solid transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  flexDirection: mobile ? 'column' : 'row',
  flex: mobile ? '1 1 0' : 'unset',
  justifyContent: 'center',
  gap: mobile ? '3px' : '8px',
  fontSize: mobile ? '0.68rem' : '1rem',
  whiteSpace: 'nowrap', transition: 'all 0.2s',
  minWidth: 0, lineHeight: 1, boxSizing: 'border-box',
});

// Admin 왼쪽 세로 메뉴 (데스크톱)
const adminMenuItemStyle = (isActive) => ({
  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '8px 12px', border: 'none', borderRadius: '8px', textAlign: 'left', font: 'inherit',
  background: isActive ? '#eef4ff' : 'transparent',
  color: isActive ? '#004094' : '#4a5a6d',
  fontWeight: isActive ? 700 : 500, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.15s',
});
const menuGroupLabel = { fontSize: '0.7rem', fontWeight: 700, color: '#aab2bd', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 12px 4px' };
const menuBadge = { minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '9px', background: '#d32f2f', color: '#fff', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: '6px' };
// Admin 가로 칩 (모바일)
const adminChipStyle = (isActive) => ({
  padding: '7px 12px', border: '1px solid', borderColor: isActive ? '#004094' : '#e3e7ed', borderRadius: '20px',
  background: isActive ? '#004094' : '#fff', color: isActive ? '#fff' : '#555',
  fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center',
});

const shortcutIconStyle = { fontSize: '2rem', color: '#444', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const shortcutTitleStyle = { fontWeight: 'bold', fontSize: 'clamp(0.8rem, 3vw, 1rem)', color: '#333', marginBottom: '3px' };
const shortcutSubStyle = { fontSize: 'clamp(0.7rem, 2.5vw, 0.85rem)', color: '#777' };
const wikiCardStyle = { display: 'flex', flexDirection: 'column', padding: '20px', background: '#fff', border: '1px solid #e9ecef', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' };
const adminCardStyle = { marginBottom: '20px', background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const approveBtn = { background: '#4dabf7', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' };
const rejectBtn = { background: '#fce8e6', color: '#c5221f', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' };
const requestBtnStyle = { fontSize: '0.85rem', padding: '6px 12px', borderRadius: '20px', border: '1px solid #eee', background: '#fff', cursor: 'pointer', color: '#555', fontWeight: 'bold' };
const modalBackdrop = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' };
const modalBox = (mobile) => ({ background: '#fff', padding: mobile ? '20px' : '30px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 5px 20px rgba(0,0,0,0.2)' });
const modalCancelBtn = { padding: '10px 15px', background: '#f1f3f5', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#555' };
const modalPrimaryBtn = { padding: '10px 15px', background: '#004094', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#fff' };
