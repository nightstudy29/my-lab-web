'use client';

// Lab Portal — 로그인한 멤버용. Newbie Guide / Lab Rules / Lab Wiki / Directory / Account, 관리자는 Admin 탭.
// 인증은 httpOnly 세션 쿠키(/api/session)로 서버가 확인하고, 관리자 API 는 서버에서 별도로 role 을 검사합니다.

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import rulesData from '@/data/rules.json';
import guideData from '@/data/newbieGuide.json';
import wikiData from '@/data/labwiki.json';
import * as FaIcons from "react-icons/fa";
import { SiKakaotalk, SiSlack } from "react-icons/si";
import { MdAdminPanelSettings } from "react-icons/md";
import ClassMaterialAdmin from '@/components/ClassMaterialAdmin';
import PapersAdmin from '@/components/PapersAdmin';
import NewsAdmin from '@/components/NewsAdmin';
import PatentsAdmin from '@/components/PatentsAdmin';
import AccountsAdmin from '@/components/AccountsAdmin';
import AdminDashboard from '@/components/AdminDashboard';
import AchievementsAdmin from '@/components/AchievementsAdmin';
import ApprovalsAdmin from '@/components/ApprovalsAdmin';
import RequestsAdmin from '@/components/RequestsAdmin';
import DirectoryMaster from '@/components/DirectoryMaster';
import VacationAdmin from '@/components/VacationAdmin';
import MemberDirectory from '@/components/MemberDirectory';
import MyProfileForm, { missingProfileFields } from '@/components/MyProfileForm';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import useIsMobile from '@/hooks/useIsMobile';
import { apiFetch } from '@/lib/apiClient';
import { ROLE_LABELS, canManageContent } from '@/lib/roles';
import { ToastProvider, ConfirmProvider, Button, Textarea, SlidePanel, useToast } from '@/components/ui';

// roles: 이 메뉴를 볼 수 있는 역할 (manager 는 논문/특허/뉴스만). group: 왼쪽 메뉴 묶음. badge: 상위에서 내려주는 건수 키.
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

const PORTAL_TABS = [
  { id: 'manual', label: 'Newbie Guide', icon: <FaIcons.FaBookOpen /> },
  { id: 'rules', label: 'Lab Rules', icon: <FaIcons.FaGavel /> },
  { id: 'wiki', label: 'Lab Wiki', icon: <FaIcons.FaBook /> },
  { id: 'directory', label: 'Directory', icon: <FaIcons.FaAddressBook /> },
  { id: 'profile', label: 'Account', icon: <FaIcons.FaIdCard /> },
];

const GUIDE_ICONS = {
  1: <FaIcons.FaSignInAlt />, 2: <FaIcons.FaDesktop />, 3: <FaIcons.FaBoxOpen />, 4: <FaIcons.FaHardHat />,
  5: <FaIcons.FaShieldAlt />, 6: <FaIcons.FaCalendarAlt />, 7: <FaIcons.FaDoorOpen />, 8: <FaIcons.FaFlask />,
  9: <FaIcons.FaPrint />, 10: <FaIcons.FaChalkboardTeacher />, 11: <FaIcons.FaHeartbeat />, 12: <FaIcons.FaDumbbell />,
};
const WIKI_ICONS = {
  Equipment: <FaIcons.FaTools />, Research: <FaIcons.FaBookOpen />, Admin: <FaIcons.FaClipboardList />,
  Ethics: <FaIcons.FaBalanceScale />, Software: <FaIcons.FaLaptopCode />, Data: <FaIcons.FaChartBar />,
};

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
  const isMobile = useIsMobile(768);
  const mobile = isMobile !== false;

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("rules");
  const [myMember, setMyMember] = useState(undefined); // undefined = 아직 안 불러옴, null = 연결 없음
  const [adminSubTab, setAdminSubTab] = useState('dashboard');
  const [counts, setCounts] = useState({ pending: 0, requests: 0 }); // 메뉴 배지 / 대시보드
  const [requestModal, setRequestModal] = useState(null); // { category, content }
  const [isSaving, setIsSaving] = useState(false);

  // 역할별로 보이는 Admin 메뉴. 현재 선택이 안 보이는 탭이면 첫 탭으로.
  const visibleSubTabs = user ? ADMIN_SUB_TABS.filter(t => t.roles.includes(user.role)) : [];
  const activeSubTab = visibleSubTabs.some(t => t.id === adminSubTab) ? adminSubTab : visibleSubTabs[0]?.id;

  // 로그인 체크
  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/session')
      .then((data) => { if (cancelled) return; if (!data?.user) { router.replace('/login'); return; } setUser(data.user); })
      .catch(() => { if (!cancelled) router.replace('/login'); });
    return () => { cancelled = true; };
  }, [router]);

  // 내 멤버 정보 (배너용)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiFetch('/api/members/me')
      .then((d) => { if (!cancelled) setMyMember(d.member ?? null); })
      .catch(() => { if (!cancelled) setMyMember(null); });
    return () => { cancelled = true; };
  }, [user]);

  // Admin 배지 건수 (승인 대기 / 미처리 요청) — 하위 컴포넌트가 변경하면 onChanged → refreshCounts 로 다시 읽음
  const [countsVersion, setCountsVersion] = useState(0);
  const refreshCounts = useCallback(() => setCountsVersion((v) => v + 1), []);
  useEffect(() => {
    if (!(activeTab === 'admin' && user?.role === 'admin')) return;
    let cancelled = false;
    Promise.all([apiFetch('/api/admin/users?status=pending'), apiFetch('/api/requests?status=open')])
      .then(([a, b]) => { if (!cancelled) setCounts({ pending: a.users?.length || 0, requests: b.requests?.length || 0 }); })
      .catch(() => { /* 배지는 실패해도 화면에 영향 없음 */ });
    return () => { cancelled = true; };
  }, [activeTab, user, countsVersion]);

  const submitRequest = async () => {
    if (!requestModal.content.trim()) return toast.error("내용을 입력해주세요.");
    setIsSaving(true);
    try {
      await apiFetch('/api/requests', { method: 'POST', body: { category: requestModal.category, content: requestModal.content } });
      setRequestModal(null);
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
  const showProfileBanner = activeTab !== 'profile' && myMember !== undefined && (myMember === null || missingProfile.length > 0);
  const badgeOf = (t) => (t.badge ? counts[t.badge] : 0);

  return (
    <div style={{ padding: mobile ? '30px 16px' : '60px 20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', minHeight: '100vh' }}>

      {/* ===== Header ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: mobile ? 'flex-start' : 'center', flexDirection: mobile ? 'column' : 'row', gap: mobile ? '12px' : '0', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: mobile ? '1.6rem' : '2.2rem', fontWeight: '800' }}>SMID Lab Portal</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#666', fontWeight: 'bold', fontSize: mobile ? '0.9rem' : '1rem' }}>
            {user.name} <span style={{ color: user.role === 'admin' ? '#d32f2f' : user.role === 'manager' ? '#004094' : '#888', fontWeight: 'normal', fontSize: '0.85rem' }}>({ROLE_LABELS[user.role] || user.role})</span>
          </span>
          <Button variant="ghost" onClick={handleLogout}><FaIcons.FaSignOutAlt /> Sign Out</Button>
        </div>
      </div>

      {/* ===== Account 채우기 배너 ===== */}
      {showProfileBanner && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: '#fff4e5', border: '1px solid #ffd9a8', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.9rem', color: '#8a5200' }}>
          <FaIcons.FaUserEdit />
          <span style={{ flex: 1 }}>
            {myMember === null
              ? '계정에 연결된 멤버 정보가 아직 없습니다. 교수님이 연결하면 「Account」에서 채울 수 있어요.'
              : '「Account」에 아직 비어 있는 항목이 있어요 — 채워두면 홈페이지 Members 와 Directory 에 자동 반영됩니다.'}
          </span>
          {myMember !== null && <Button size="sm" onClick={() => setActiveTab('profile')}>Account에서 채우기</Button>}
        </div>
      )}

      {/* ===== Shortcuts ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: mobile ? '10px' : '20px', marginBottom: '40px' }}>
        {[
          ['https://smidlab.slack.com', <SiSlack key="s" />, 'Slack', '공식 소통 채널'],
          ['https://open.kakao.com/o/gYhxuwci', <SiKakaotalk key="k1" />, 'Kakao (전체)', '교수님 포함 톡방'],
          ['https://open.kakao.com/o/g62RoPAi', <SiKakaotalk key="k2" />, 'Kakao (학생)', '교수님 미포함 톡방'],
        ].map(([href, icon, title, sub]) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer" style={cardLinkStyle(mobile)}>
            <div style={shortcutIconStyle}>{icon}</div>
            <div>
              <div style={shortcutTitleStyle}>{title}</div>
              <div style={shortcutSubStyle}>{sub}</div>
            </div>
          </a>
        ))}
      </div>

      {/* ===== Tabs ===== */}
      <div style={{ display: 'flex', gap: mobile ? '0px' : '20px', marginBottom: '30px', borderBottom: '2px solid #f1f3f5', overflowX: 'auto', scrollbarWidth: 'none', padding: mobile ? '0 4px' : '0' }}>
        {PORTAL_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabBtnStyle(activeTab === t.id, mobile)}>
            {t.icon}<span style={{ fontSize: mobile ? '0.68rem' : '1rem' }}>{t.label}</span>
          </button>
        ))}
        {canManageContent(user.role) && (
          <button onClick={() => setActiveTab('admin')} style={tabBtnStyle(activeTab === 'admin', mobile)}>
            <FaIcons.FaUserShield /><span style={{ fontSize: mobile ? '0.68rem' : '1rem' }}>{user.role === 'admin' ? 'Admin' : 'Manage'}</span>
          </button>
        )}
      </div>

      <div style={{ minHeight: '500px' }}>

        {/* ===== Newbie Guide ===== */}
        {activeTab === 'manual' && (
          <div>
            <SectionHeader title="👋 Newbie Guide" onRequest={() => setRequestModal({ category: 'Newbie Guide', content: '' })} />
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
              {guideData.map((item) => (
                <div key={item.id} style={wikiCardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ color: '#004094', fontSize: '1.1rem', marginRight: '10px', flexShrink: 0 }}>{GUIDE_ICONS[item.id] || <FaIcons.FaInfoCircle />}</div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#333', fontWeight: '700' }}>{item.title}</h3>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: item.desc }} />
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
            <SectionHeader title="📚 Lab Wiki" onRequest={() => setRequestModal({ category: 'Lab Wiki', content: '' })} />
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
              {wikiData.map((item) => (
                <div key={item.id} style={wikiCardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ color: '#004094', fontSize: '1.1rem', marginRight: '10px' }}>{WIKI_ICONS[item.category] || <FaIcons.FaInfoCircle />}</div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>{item.title}</h3>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.6', whiteSpace: 'pre-wrap', flex: 1 }}>{item.content}</div>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#004094', textDecoration: 'none', fontWeight: 'bold' }}>
                      🔗 바로가기 <FaIcons.FaExternalLinkAlt size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Directory / Account ===== */}
        {activeTab === 'directory' && <MemberDirectory mobile={mobile} />}
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

        {/* ===== Admin ===== */}
        {activeTab === 'admin' && canManageContent(user.role) && (
          <div>
            <h2 style={{ color: '#004094', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MdAdminPanelSettings size={24} /> {user.role === 'admin' ? 'Admin' : '콘텐츠 관리'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '190px minmax(0, 1fr)', gap: mobile ? '16px' : '28px', alignItems: 'start' }}>
              {/* 왼쪽 메뉴 (데스크톱) / 가로 칩 (모바일) */}
              {mobile ? (
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
                  {visibleSubTabs.map(t => (
                    <button key={t.id} onClick={() => setAdminSubTab(t.id)} style={adminChipStyle(activeSubTab === t.id)}>
                      {t.label}{badgeOf(t) > 0 && <span style={menuBadge}>{badgeOf(t)}</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <nav style={{ position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {ADMIN_GROUPS.map(g => {
                    const items = visibleSubTabs.filter(t => t.group === g);
                    if (items.length === 0) return null;
                    return (
                      <div key={g ?? 'top'} style={{ marginBottom: '10px' }}>
                        {g && <div style={menuGroupLabel}>{g}</div>}
                        {items.map(t => (
                          <button key={t.id} onClick={() => setAdminSubTab(t.id)} style={adminMenuItemStyle(activeSubTab === t.id)}>
                            <span>{t.label}</span>{badgeOf(t) > 0 && <span style={menuBadge}>{badgeOf(t)}</span>}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </nav>
              )}

              {/* 내용 */}
              <div style={{ minWidth: 0 }}>
                {activeSubTab === 'dashboard' && <AdminDashboard user={user} mobile={mobile} pendingCount={counts.pending} requestsCount={counts.requests} onNavigate={setAdminSubTab} />}
                {activeSubTab === 'approvals' && <ApprovalsAdmin onChanged={refreshCounts} />}
                {activeSubTab === 'accounts' && <AccountsAdmin currentUserId={user.userID} />}
                {activeSubTab === 'directory' && <DirectoryMaster />}
                {activeSubTab === 'requests' && <RequestsAdmin onChanged={refreshCounts} />}
                {activeSubTab === 'vacation' && <VacationAdmin mobile={mobile} />}
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

      {/* ===== 수정 요청 패널 ===== */}
      <SlidePanel
        open={!!requestModal}
        title={requestModal ? `✏️ ${requestModal.category} 수정/추가 요청` : ''}
        onClose={() => !isSaving && setRequestModal(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setRequestModal(null)} disabled={isSaving}>취소</Button>
          <Button onClick={submitRequest} disabled={isSaving}>{isSaving ? '전송 중...' : '전송하기'}</Button>
        </>}
      >
        {requestModal && (
          <>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 12px' }}>내용이 틀렸거나, 새로 추가하고 싶은 정보가 있다면 자유롭게 적어주세요. 교수님께 전달됩니다.</p>
            <Textarea rows={6} autoFocus value={requestModal.content} onChange={(e) => setRequestModal((r) => ({ ...r, content: e.target.value }))}
              placeholder="예: 장비 목록에 3D 프린터 모델명(Ultimaker) 추가 부탁드립니다." />
          </>
        )}
      </SlidePanel>

      <style jsx>{`div[style*="overflowX: auto"]::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

function SectionHeader({ title, onRequest }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
      <h2 style={{ color: '#333', margin: 0 }}>{title}</h2>
      <Button variant="ghost" size="sm" onClick={onRequest}>✏️ 수정 요청</Button>
    </div>
  );
}

// ===== 스타일 =====
const cardLinkStyle = (mobile) => ({
  display: 'flex', alignItems: 'center',
  flexDirection: mobile ? 'column' : 'row', textAlign: mobile ? 'center' : 'left', gap: mobile ? '6px' : 0,
  padding: mobile ? '14px 8px' : '25px',
  backgroundColor: '#fff', borderRadius: '12px', textDecoration: 'none',
  border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'pointer',
});
const shortcutIconStyle = { fontSize: '2rem', color: '#444', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const shortcutTitleStyle = { fontWeight: 'bold', fontSize: 'clamp(0.8rem, 3vw, 1rem)', color: '#333', marginBottom: '3px' };
const shortcutSubStyle = { fontSize: 'clamp(0.7rem, 2.5vw, 0.85rem)', color: '#777' };

const tabBtnStyle = (isActive, mobile) => ({
  padding: mobile ? '10px 0' : '12px 5px', border: 'none', background: 'none', fontWeight: 'bold',
  color: isActive ? '#004094' : '#adb5bd', borderBottom: isActive ? '3px solid #004094' : '3px solid transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center', flexDirection: mobile ? 'column' : 'row',
  flex: mobile ? '1 1 0' : 'unset', justifyContent: 'center', gap: mobile ? '3px' : '8px',
  fontSize: mobile ? '0.68rem' : '1rem', whiteSpace: 'nowrap', transition: 'all 0.2s', minWidth: 0, lineHeight: 1, boxSizing: 'border-box',
});

const wikiCardStyle = { display: 'flex', flexDirection: 'column', padding: '20px', background: '#fff', border: '1px solid #e9ecef', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' };
const adminCardStyle = { marginBottom: '20px', background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };

// Admin 왼쪽 세로 메뉴 (데스크톱) / 가로 칩 (모바일)
const adminMenuItemStyle = (isActive) => ({
  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '8px 12px', border: 'none', borderRadius: '8px', textAlign: 'left', font: 'inherit',
  background: isActive ? '#eef4ff' : 'transparent', color: isActive ? '#004094' : '#4a5a6d',
  fontWeight: isActive ? 700 : 500, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.15s',
});
const menuGroupLabel = { fontSize: '0.7rem', fontWeight: 700, color: '#aab2bd', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 12px 4px' };
const menuBadge = { minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '9px', background: '#d32f2f', color: '#fff', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: '6px' };
const adminChipStyle = (isActive) => ({
  padding: '7px 12px', border: '1px solid', borderColor: isActive ? '#004094' : '#e3e7ed', borderRadius: '20px',
  background: isActive ? '#004094' : '#fff', color: isActive ? '#fff' : '#555',
  fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center',
});
