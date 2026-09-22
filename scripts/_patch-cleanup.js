// 정리 패스: apiFetch 채택, ClassMaterialAdmin 재로딩 꼼수 제거, equipment <img> → next/image, login alert → 인라인 에러
const fs = require("fs");
function patch(f, reps) {
  let s = fs.readFileSync(f, "utf8"); const eol = s.includes("\r\n") ? "\r\n" : "\n"; s = s.replace(/\r\n/g, "\n"); const bad = [];
  for (const [o, n, all] of reps) { const c = s.split(o).length - 1; if (c === 0 || (!all && c !== 1)) { bad.push(`${c}x: ${o.slice(0, 70)}`); continue; } s = all ? s.split(o).join(n) : s.replace(o, n); }
  if (bad.length) { console.log("✗", f, "\n  " + bad.join("\n  ")); process.exitCode = 1; return; }
  fs.writeFileSync(f, s.replace(/\n/g, eol)); console.log("✓", f, reps.length);
}

// ---- PapersAdmin ----
patch("src/components/PapersAdmin.js", [
  [`import { supabase } from "@/lib/supabaseClient";`, `import { supabase } from "@/lib/supabaseClient";\nimport { apiFetch } from "@/lib/apiClient";`],
  [`      const res = await fetch("/api/papers", {
        method: panel.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(panel.id ? { id: panel.id, ...payload } : payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "저장 실패");
      toast.success`, `      await apiFetch("/api/papers", { method: panel.id ? "PATCH" : "POST", body: panel.id ? { id: panel.id, ...payload } : payload });
      toast.success`],
  [`    const res = await fetch(\`/api/papers?id=\${p.id}\`, { method: "DELETE" });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("삭제 실패: " + (result.error || ""));
    toast.success("삭제했습니다.");
    load();`, `    try { await apiFetch(\`/api/papers?id=\${p.id}\`, { method: "DELETE" }); toast.success("삭제했습니다."); load(); }
    catch (e) { toast.error("삭제 실패: " + e.message); }`],
]);

// ---- PatentsAdmin ----
patch("src/components/PatentsAdmin.js", [
  [`import { supabase } from "@/lib/supabaseClient";`, `import { supabase } from "@/lib/supabaseClient";\nimport { apiFetch } from "@/lib/apiClient";`],
  [`      const res = await fetch("/api/patents", {
        method: panel.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(panel.id ? { id: panel.id, ...payload } : payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "저장 실패");
      toast.success`, `      await apiFetch("/api/patents", { method: panel.id ? "PATCH" : "POST", body: panel.id ? { id: panel.id, ...payload } : payload });
      toast.success`],
  [`    const res = await fetch(\`/api/patents?id=\${p.id}\`, { method: "DELETE" });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("삭제 실패: " + (result.error || ""));
    toast.success("삭제했습니다.");
    load();`, `    try { await apiFetch(\`/api/patents?id=\${p.id}\`, { method: "DELETE" }); toast.success("삭제했습니다."); load(); }
    catch (e) { toast.error("삭제 실패: " + e.message); }`],
]);

// ---- NewsAdmin ----
patch("src/components/NewsAdmin.js", [
  [`import { supabase } from "@/lib/supabaseClient";`, `import { supabase } from "@/lib/supabaseClient";\nimport { apiFetch } from "@/lib/apiClient";`],
  [`      const res = await fetch("/api/news", {
        method: panel.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(panel.id ? { id: panel.id, ...payload } : payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "저장 실패");
      toast.success`, `      await apiFetch("/api/news", { method: panel.id ? "PATCH" : "POST", body: panel.id ? { id: panel.id, ...payload } : payload });
      toast.success`],
  [`    const res = await fetch(\`/api/news?id=\${n.id}\`, { method: "DELETE" });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("삭제 실패: " + (result.error || ""));
    toast.success("삭제했습니다.");
    load();`, `    try { await apiFetch(\`/api/news?id=\${n.id}\`, { method: "DELETE" }); toast.success("삭제했습니다."); load(); }
    catch (e) { toast.error("삭제 실패: " + e.message); }`],
]);

// ---- AccountsAdmin ----
patch("src/components/AccountsAdmin.js", [
  [`import { ROLES, ROLE_LABELS, STATUS_LABELS } from "@/lib/roles";`, `import { apiFetch } from "@/lib/apiClient";\nimport { ROLES, ROLE_LABELS, STATUS_LABELS } from "@/lib/roles";`],
  [`    const res = await fetch("/api/admin/users?status=all");
    const data = await res.json().catch(() => ({}));
    setUsers(data.users || []);
    setIsLoading(false);`, `    try { setUsers((await apiFetch("/api/admin/users?status=all")).users || []); }
    catch (e) { toast.error(e.message); }
    finally { setIsLoading(false); }`],
  [`      const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, action, ...extra }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "실패");
      if (data.deleted)`, `      const data = await apiFetch("/api/admin/users", { method: "PATCH", body: { id: user.id, action, ...extra } });
      if (data.deleted)`],
]);

// ---- AchievementsAdmin ----
patch("src/components/AchievementsAdmin.js", [
  [`import { supabase } from "@/lib/supabaseClient";`, `import { supabase } from "@/lib/supabaseClient";\nimport { apiFetch } from "@/lib/apiClient";`],
  [`      fetch("/api/talks").then((r) => r.json()).catch(() => ({})),`, `      apiFetch("/api/talks").catch(() => ({})),`],
  [`        const res = await fetch("/api/papers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "저장 실패");
        toast.success("업적 정보를 저장했습니다.");`, `        await apiFetch("/api/papers", { method: "PATCH", body });
        toast.success("업적 정보를 저장했습니다.");`],
  [`        const res = await fetch("/api/talks", {
          method: panel.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(panel.id ? { id: panel.id, ...f } : f),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "저장 실패");
        toast.success(panel.id`, `        await apiFetch("/api/talks", { method: panel.id ? "PATCH" : "POST", body: panel.id ? { id: panel.id, ...f } : f });
        toast.success(panel.id`],
  [`    const res = await fetch(\`/api/talks?id=\${t.id}\`, { method: "DELETE" });
    if (!res.ok) return toast.error("삭제 실패");
    toast.success("삭제했습니다.");
    load();`, `    try { await apiFetch(\`/api/talks?id=\${t.id}\`, { method: "DELETE" }); toast.success("삭제했습니다."); load(); }
    catch (e) { toast.error("삭제 실패: " + e.message); }`],
]);

// ---- ClassMaterialAdmin: 로컬 api 헬퍼 → apiFetch, setTimeout 재로딩 → refreshKey ----
patch("src/components/ClassMaterialAdmin.js", [
  [`import { supabase } from "@/lib/supabaseClient";`, `import { supabase } from "@/lib/supabaseClient";\nimport { apiFetch } from "@/lib/apiClient";`],
  [`const api = async (url, method, body) => {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "요청 실패");
  return data;
};
`, `const api = (url, method, body) => apiFetch(url, { method, body });
`],
  [`  const [panel, setPanel] = useState(null); // { kind: 'material'|'semester'|'course', id, form }
  const [isSaving, setIsSaving] = useState(false);`, `  const [panel, setPanel] = useState(null); // { kind: 'material'|'semester'|'course', id, form }
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 과목/자료 변경 후 선택 학기 다시 불러오기`],
  [`    return () => { cancelled = true; };
  }, [semesterId]);

  async function reloadSemester() {
    const id = semesterId;
    setSemesterId(null);
    // 같은 id 로 다시 세팅해서 effect 재실행
    setTimeout(() => setSemesterId(id), 0);
  }`, `    return () => { cancelled = true; };
  }, [semesterId, refreshKey]);

  const reloadSemester = () => setRefreshKey((k) => k + 1);`],
]);

// ---- equipment: <img> → next/image (fill) ----
patch("src/app/equipment/page.js", [
  [`import { useState } from 'react';`, `import { useState } from 'react';\nimport Image from 'next/image';`],
  [`          <img
            src={item.image}
            alt={item.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease'
            }}
            className={isHovered ? "zoom-image" : ""}
          />`, `          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            style={{ objectFit: 'cover', transition: 'transform 0.5s ease', transform: isHovered ? 'scale(1.05)' : 'none' }}
          />`],
]);

// ---- login: alert → 인라인 에러/안내 메시지 ----
patch("src/app/login/page.js", [
  [`  const [isLoading, setIsLoading] = useState(false);
`, `  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error' | 'info', text }
`],
  [`  const resetToLogin = () => {
    setStep('login_input');`, `  const resetToLogin = () => {
    setMessage(null);
    setStep('login_input');`],
  [`      if (!res.ok) {
        alert(data.message || '로그인 실패');
        return;
      }
`, `      if (!res.ok) {
        setMessage({ type: 'error', text: data.message || '로그인 실패' });
        return;
      }
      setMessage(null);
`],
  [`      console.error(err);
      alert('서버 연결 오류');`, `      console.error(err);
      setMessage({ type: 'error', text: '서버에 연결할 수 없습니다.' });`],
  [`      alert(data.message || '인증번호가 틀렸습니다.');
      // 중간 토큰이 만료된 경우엔 처음부터
      if (res.status === 401 && /만료/.test(data.message || '')) resetToLogin();`, `      // 중간 토큰이 만료된 경우엔 처음부터
      if (res.status === 401 && /만료/.test(data.message || '')) { resetToLogin(); setMessage({ type: 'error', text: data.message }); return; }
      setMessage({ type: 'error', text: data.message || '인증번호가 틀렸습니다.' });`],
  [`      console.error("OTP Error:", error);
      alert('인증 오류 발생: 서버와 연결할 수 없습니다.');`, `      console.error("OTP Error:", error);
      setMessage({ type: 'error', text: '서버에 연결할 수 없습니다.' });`],
  [`      if (res.ok) {
        alert('가입 신청 완료! 관리자 승인을 기다려주세요.');
        setStep('login_input');
        setRegName(''); setRegID(''); setRegPW('');
      } else {
        alert(data.message || '가입 신청 실패');
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    }`, `      if (res.ok) {
        setStep('login_input');
        setRegName(''); setRegID(''); setRegPW('');
        setMessage({ type: 'info', text: '가입 신청 완료! 교수님 승인 후 로그인할 수 있습니다.' });
      } else {
        setMessage({ type: 'error', text: data.message || '가입 신청 실패' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '오류가 발생했습니다.' });
    }`],
  // 메시지 표시 영역 (헤더 아래)
  [`          <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Secure Access System</p>
        </div>
`, `          <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Secure Access System</p>
        </div>

        {message && (
          <div role="alert" style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'left', background: message.type === 'error' ? '#fce8e6' : '#e6f4ea', color: message.type === 'error' ? '#c5221f' : '#137333' }}>
            {message.text}
          </div>
        )}
`],
]);
