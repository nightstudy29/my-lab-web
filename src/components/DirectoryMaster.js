"use client";

// 멤버 관리 (admin 전용) — 멤버 전체 편집 + 계정 연결 + 단기 인턴 기록.

import { useState, useEffect } from "react";
import FileUploader from "./FileUploader";
import { itemsFromUrls, uploadItems } from "@/lib/uploadClient";
import { POSITIONS, POSITION_LABELS_KO, DEGREES, STATUSES } from "@/lib/memberConstants";
import { boxStyle, inputStyle, primaryBtn, secondaryBtnSmall, dangerBtnSmall } from "./adminStyles";

const EMPTY_MEMBER = {
  name_kor: "", name_eng: "", email: "", phone: "", kakao_id: "", year_joined: "", current_position: "",
  cv_link: "", scholar_link: "", linkedin_link: "", orcid_link: "", research_area: "",
  position: "MS-PhD Student", degree: "TBD", status: "active", year_left: "", co_advisor: "", is_public: true, sort_order: "", user_id: "",
};

function formFromMember(m) {
  const r = m.raw;
  const f = {};
  for (const k of Object.keys(EMPTY_MEMBER)) f[k] = r[k] ?? (typeof EMPTY_MEMBER[k] === "boolean" ? EMPTY_MEMBER[k] : "");
  f.is_public = !!r.is_public;
  f.photo = itemsFromUrls(r.photo_url ? [r.photo_url] : []);
  return f;
}

export default function DirectoryMaster() {
  const [members, setMembers] = useState([]);
  const [unlinkedUsers, setUnlinkedUsers] = useState([]);
  const [interns, setInterns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);   // { id|null, form }
  const [isSaving, setIsSaving] = useState(false);
  const [section, setSection] = useState("members"); // members | interns
  const [editingIntern, setEditingIntern] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setIsLoading(true);
    const [a, b] = await Promise.all([fetch("/api/admin/members"), fetch("/api/admin/interns")]);
    const da = await a.json().catch(() => ({})), db = await b.json().catch(() => ({}));
    setMembers(da.members || []);
    setUnlinkedUsers(da.unlinkedUsers || []);
    setInterns(db.interns || []);
    setIsLoading(false);
  }

  // ===== 멤버 저장/삭제 =====
  async function saveMember() {
    const { form, id } = editing;
    if (!form.name_kor.trim()) return alert("이름(한글)은 필수입니다.");
    setIsSaving(true);
    try {
      const uploaded = await uploadItems(form.photo, {
        folder: "members", resizeImages: true, resizeOptions: { maxEdge: 800, quality: 0.85 },
        onItemsChange: (items) => setEditing((p) => ({ ...p, form: { ...p.form, photo: items } })),
      });
      const { photo, ...fields } = form;
      const payload = { ...fields, photo_url: uploaded[0]?.url || null, user_id: fields.user_id || null, sort_order: fields.sort_order === "" ? null : Number(fields.sort_order) };
      const res = await fetch("/api/admin/members", {
        method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장 실패");
      setEditing(null);
      load();
    } catch (e) {
      alert("실패: " + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteMember(m) {
    if (!confirm(`${m.nameKor} 멤버 정보를 삭제하시겠습니까? 휴가 기록도 함께 지워집니다. (포털 계정은 남습니다)`)) return;
    const res = await fetch(`/api/admin/members?id=${m.id}`, { method: "DELETE" });
    if (!res.ok) return alert("삭제 실패");
    load();
  }

  async function quickPatch(m, patch) {
    const res = await fetch("/api/admin/members", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: m.id, ...patch }) });
    const data = await res.json();
    if (!res.ok) return alert("실패: " + data.error);
    setMembers((prev) => prev.map((x) => (x.id === m.id ? data.member : x)));
  }

  // ===== 인턴 저장/삭제 =====
  async function saveIntern() {
    const it = editingIntern;
    if (!it.name_eng.trim()) return alert("영어 이름은 필수입니다.");
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/interns", {
        method: it.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(it),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장 실패");
      setEditingIntern(null);
      load();
    } catch (e) { alert("실패: " + e.message); } finally { setIsSaving(false); }
  }
  async function deleteIntern(it) {
    if (!confirm(`${it.name_eng} 인턴 기록을 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/interns?id=${it.id}`, { method: "DELETE" });
    if (!res.ok) return alert("삭제 실패");
    load();
  }

  if (isLoading) return <p style={{ color: "#888" }}>불러오는 중...</p>;

  const q = search.trim().toLowerCase();
  const visible = members.filter((m) => (filter === "all" || m.status === filter) &&
    (!q || [m.nameKor, m.nameEng, m.email, m.userId].some((v) => (v || "").toLowerCase().includes(q))));
  const counts = members.reduce((a, m) => { a[m.status] = (a[m.status] || 0) + 1; return a; }, {});
  const linkableUsers = editing ? [...unlinkedUsers, ...(editing.form.user_id ? [{ userId: editing.form.user_id, name: "(현재 연결)" }] : [])] : [];

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h3 style={{ color: "#333", margin: 0, display: "flex", gap: "8px", alignItems: "center" }}>
          🗂 멤버 관리
          <button onClick={() => setSection("members")} style={{ ...secondaryBtnSmall, background: section === "members" ? "#004094" : "#e7f5ff", color: section === "members" ? "#fff" : "#004094" }}>멤버 {members.length}</button>
          <button onClick={() => setSection("interns")} style={{ ...secondaryBtnSmall, background: section === "interns" ? "#004094" : "#e7f5ff", color: section === "interns" ? "#fff" : "#004094" }}>단기 인턴 기록 {interns.length}</button>
        </h3>
        {section === "members" ? (
          <button onClick={() => setEditing({ id: null, form: { ...EMPTY_MEMBER, photo: [] } })} style={primaryBtn}>+ 멤버 추가</button>
        ) : (
          <button onClick={() => setEditingIntern({ name_eng: "", name_kor: "", participations: [{ program: "", period: "" }], achievements: [] })} style={primaryBtn}>+ 인턴 기록 추가</button>
        )}
      </div>

      {unlinkedUsers.length > 0 && section === "members" && (
        <div style={{ background: "#fff4e5", border: "1px solid #ffd9a8", color: "#8a5200", borderRadius: "8px", padding: "10px 14px", fontSize: "0.85rem", marginBottom: "14px" }}>
          멤버 정보에 연결되지 않은 포털 계정: {unlinkedUsers.map((u) => `${u.name}(${u.userId})`).join(", ")} — 해당 멤버 행을 열어 「포털 계정」에서 연결해주세요.
        </div>
      )}

      {/* ===== 멤버 ===== */}
      {section === "members" && (
        <>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px", alignItems: "center" }}>
            {[["active", "Active"], ["graduated", "Graduated"], ["all", "전체"]].map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)} style={{ ...secondaryBtnSmall, background: filter === k ? "#004094" : "#e7f5ff", color: filter === k ? "#fff" : "#004094" }}>
                {label}{k !== "all" && counts[k] ? ` ${counts[k]}` : ""}
              </button>
            ))}
            <input type="text" placeholder="이름/이메일/ID 검색" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, marginLeft: "auto", minWidth: "200px" }} />
          </div>

          <div style={{ ...boxStyle, padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", minWidth: "820px" }}>
              <thead>
                <tr style={{ background: "#f8f9fa", color: "#555", textAlign: "left" }}>
                  <th style={th}>이름</th><th style={th}>신분</th><th style={th}>학위</th><th style={th}>상태</th><th style={th}>입학 / 졸업</th><th style={th}>계정</th><th style={th}>공개</th><th style={th}>수정</th><th style={{ ...th, textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => (
                  <tr key={m.id} style={{ borderTop: "1px solid #f1f3f5" }}>
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {m.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.photoUrl} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                        ) : <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e9ecef", flexShrink: 0 }} />}
                        <div>
                          <div style={{ fontWeight: "bold", color: "#333" }}>{m.nameKor}</div>
                          <div style={{ color: "#888", fontSize: "0.78rem" }}>{m.nameEng || "-"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={td}>
                      <select value={m.position} onChange={(e) => quickPatch(m, { position: e.target.value })} style={sel}>
                        {POSITIONS.map((p) => <option key={p} value={p}>{POSITION_LABELS_KO[p]} ({p})</option>)}
                      </select>
                    </td>
                    <td style={td}>
                      <select value={m.degree} onChange={(e) => quickPatch(m, { degree: e.target.value })} style={sel}>
                        {DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </td>
                    <td style={td}>
                      <select value={m.status} onChange={(e) => quickPatch(m, { status: e.target.value })} style={{ ...sel, color: m.status === "active" ? "#137333" : "#c5221f", fontWeight: "bold" }}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s === "active" ? "Active" : "Graduated"}</option>)}
                      </select>
                    </td>
                    <td style={{ ...td, color: "#555", whiteSpace: "nowrap" }}>{m.yearJoined || "-"}{m.status === "graduated" && ` → ${m.yearLeft || "?"}`}</td>
                    <td style={{ ...td, fontSize: "0.8rem", color: m.userId ? "#137333" : "#c5221f" }}>{m.userId || "미연결"}</td>
                    <td style={td}>
                      <input type="checkbox" checked={m.isPublic} onChange={(e) => quickPatch(m, { is_public: e.target.checked })} title="공개 Members 페이지 표시" />
                    </td>
                    <td style={{ ...td, fontSize: "0.78rem", color: "#999", whiteSpace: "nowrap" }}>{m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : "-"}</td>
                    <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button onClick={() => setEditing({ id: m.id, form: formFromMember(m) })} style={secondaryBtnSmall}>편집</button>{" "}
                      <button onClick={() => deleteMember(m)} style={dangerBtnSmall}>삭제</button>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && <tr><td colSpan={9} style={{ padding: "20px", textAlign: "center", color: "#888" }}>해당하는 멤버가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ===== 단기 인턴 ===== */}
      {section === "interns" && (
        <div style={boxStyle}>
          <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "#666" }}>
            계정·Directory 없이 공개 페이지 Former Interns 에만 표시되는 기록입니다. 포털 계정을 준 장기 인턴은 멤버로 관리하세요 (position/degree = Intern).
          </p>
          {interns.map((it) => (
            <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderTop: "1px solid #f1f3f5", gap: "10px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "bold" }}>{it.name_eng} {it.name_kor && <span style={{ color: "#888", fontWeight: "normal" }}>({it.name_kor})</span>}</div>
                <div style={{ fontSize: "0.82rem", color: "#666" }}>
                  {(it.participations || []).map((p) => `${p.program} · ${p.period}`).join(" / ") || "-"}
                  {(it.achievements || []).length > 0 && <span style={{ marginLeft: "8px", color: "#004094" }}>🏅 {it.achievements.length}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button onClick={() => setEditingIntern({ ...it, participations: it.participations?.length ? it.participations : [{ program: "", period: "" }], achievements: it.achievements || [] })} style={secondaryBtnSmall}>편집</button>
                <button onClick={() => deleteIntern(it)} style={dangerBtnSmall}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== 멤버 편집 모달 ===== */}
      {editing && (
        <div style={backdrop}>
          <div style={{ ...modal, maxWidth: "760px" }}>
            <h3 style={{ marginTop: 0 }}>{editing.id ? `멤버 편집 — ${editing.form.name_kor}` : "새 멤버"}</h3>
            <MemberForm form={editing.form} setForm={(f) => setEditing((p) => ({ ...p, form: typeof f === "function" ? f(p.form) : f }))} linkableUsers={linkableUsers} disabled={isSaving} />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={() => setEditing(null)} disabled={isSaving} style={secondaryBtnSmall}>취소</button>
              <button onClick={saveMember} disabled={isSaving} style={{ ...primaryBtn, opacity: isSaving ? 0.6 : 1 }}>{isSaving ? "저장 중..." : "저장"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 인턴 편집 모달 ===== */}
      {editingIntern && (
        <div style={backdrop}>
          <div style={{ ...modal, maxWidth: "600px" }}>
            <h3 style={{ marginTop: 0 }}>{editingIntern.id ? "인턴 기록 편집" : "새 인턴 기록"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <Field label="영어 이름 *"><input value={editingIntern.name_eng} onChange={(e) => setEditingIntern((p) => ({ ...p, name_eng: e.target.value }))} style={full} /></Field>
              <Field label="한글 이름"><input value={editingIntern.name_kor || ""} onChange={(e) => setEditingIntern((p) => ({ ...p, name_kor: e.target.value }))} style={full} /></Field>
            </div>
            <Field label="참여 (프로그램 · 기간)">
              {editingIntern.participations.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                  <input placeholder="MSE Intern" value={p.program} onChange={(e) => setEditingIntern((s) => ({ ...s, participations: s.participations.map((x, j) => (j === i ? { ...x, program: e.target.value } : x)) }))} style={{ ...inputStyle, flex: 1 }} />
                  <input placeholder="Summer 2025" value={p.period} onChange={(e) => setEditingIntern((s) => ({ ...s, participations: s.participations.map((x, j) => (j === i ? { ...x, period: e.target.value } : x)) }))} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => setEditingIntern((s) => ({ ...s, participations: s.participations.filter((_, j) => j !== i) }))} style={dangerBtnSmall}>✕</button>
                </div>
              ))}
              <button onClick={() => setEditingIntern((s) => ({ ...s, participations: [...s.participations, { program: "", period: "" }] }))} style={secondaryBtnSmall}>+ 참여 추가</button>
            </Field>
            <Field label="성과 (수상 / 논문 링크)">
              {editingIntern.achievements.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                  <select value={a.type} onChange={(e) => setEditingIntern((s) => ({ ...s, achievements: s.achievements.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)) }))} style={inputStyle}>
                    <option value="award">🏆 수상</option><option value="paper">📄 논문</option>
                  </select>
                  <input placeholder="제목" value={a.title} onChange={(e) => setEditingIntern((s) => ({ ...s, achievements: s.achievements.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) }))} style={{ ...inputStyle, flex: 1 }} />
                  <input placeholder="https://…" value={a.url} onChange={(e) => setEditingIntern((s) => ({ ...s, achievements: s.achievements.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) }))} style={{ ...inputStyle, flex: 2 }} />
                  <button onClick={() => setEditingIntern((s) => ({ ...s, achievements: s.achievements.filter((_, j) => j !== i) }))} style={dangerBtnSmall}>✕</button>
                </div>
              ))}
              <button onClick={() => setEditingIntern((s) => ({ ...s, achievements: [...s.achievements, { type: "award", title: "", url: "" }] }))} style={secondaryBtnSmall}>+ 성과 추가</button>
            </Field>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={() => setEditingIntern(null)} disabled={isSaving} style={secondaryBtnSmall}>취소</button>
              <button onClick={saveIntern} disabled={isSaving} style={{ ...primaryBtn, opacity: isSaving ? 0.6 : 1 }}>{isSaving ? "저장 중..." : "저장"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem", color: "#555", marginBottom: "8px" }}>
      <span>{label}</span>{children}
    </label>
  );
}

function MemberForm({ form, setForm, linkableUsers, disabled }) {
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const T = (k, label, extra = {}) => <Field label={label}><input value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} style={full} disabled={disabled} {...extra} /></Field>;
  return (
    <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "4px" }}>
      <div style={{ ...boxStyle, background: "#fff4e5", border: "1px solid #ffd9a8" }}>
        <div style={{ fontSize: "0.8rem", color: "#8a5200", fontWeight: "bold", marginBottom: "8px" }}>교수님 전용</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>
          <Field label="신분 (position)"><select value={form.position} onChange={(e) => set("position", e.target.value)} style={full}>{POSITIONS.map((p) => <option key={p} value={p}>{POSITION_LABELS_KO[p]} ({p})</option>)}</select></Field>
          <Field label="최종 학위 (degree)"><select value={form.degree} onChange={(e) => set("degree", e.target.value)} style={full}>{DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
          <Field label="상태"><select value={form.status} onChange={(e) => set("status", e.target.value)} style={full}><option value="active">Active</option><option value="graduated">Graduated</option></select></Field>
          {T("year_joined", "입학/합류 시기", { placeholder: "예: 2026-1" })}
          {T("year_left", "졸업/퇴소 연도", { placeholder: "graduated 로 바꾸면 자동" })}
          {T("current_position", "현재 소속·직위", { placeholder: "졸업 후 소속 등" })}
          {T("co_advisor", "Co-advisor", { placeholder: "예: Prof. Tae Heon Kim (KIST)" })}
          <Field label="포털 계정">
            <select value={form.user_id || ""} onChange={(e) => set("user_id", e.target.value)} style={full}>
              <option value="">(연결 안 함)</option>
              {linkableUsers.map((u) => <option key={u.userId} value={u.userId}>{u.userId} {u.name}</option>)}
            </select>
          </Field>
          {T("sort_order", "수동 순서", { type: "number", placeholder: "비우면 자동" })}
          <Field label="공개 페이지 표시"><label style={{ display: "flex", alignItems: "center", gap: "6px", height: "34px" }}><input type="checkbox" checked={!!form.is_public} onChange={(e) => set("is_public", e.target.checked)} /> 표시</label></Field>
        </div>
      </div>

      <Field label="프로필 사진"><FileUploader items={form.photo} onChange={(items) => set("photo", items)} multiple={false} accept="image/*" disabled={disabled} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        {T("name_kor", "이름 (한글) *")}{T("name_eng", "이름 (영문)")}
        {T("email", "E-mail")}{T("phone", "전화번호")}
        {T("kakao_id", "Kakao ID")}
      </div>
      {T("research_area", "연구 분야 (한 줄)")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        {T("cv_link", "CV 링크")}{T("scholar_link", "Google Scholar")}
        {T("linkedin_link", "LinkedIn")}{T("orcid_link", "ORCID")}
      </div>
    </div>
  );
}

const th = { padding: "10px 12px", borderBottom: "2px solid #eee", fontWeight: "600", whiteSpace: "nowrap", fontSize: "0.82rem" };
const td = { padding: "8px 12px", verticalAlign: "middle" };
const sel = { ...inputStyle, padding: "4px 6px", fontSize: "0.82rem" };
const full = { ...inputStyle, width: "100%", boxSizing: "border-box" };
const backdrop = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px", boxSizing: "border-box" };
const modal = { background: "#fff", padding: "24px", borderRadius: "12px", width: "100%", boxShadow: "0 5px 20px rgba(0,0,0,0.2)" };
