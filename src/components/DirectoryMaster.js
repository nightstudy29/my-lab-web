"use client";

// 멤버 관리 (admin 전용) — 멤버 전체 편집 + 계정 연결 + 단기 인턴 기록.

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { FaPen, FaTrash, FaPlus, FaUser } from "react-icons/fa6";
import FileUploader from "./FileUploader";
import { apiFetch } from "@/lib/apiClient";
import { itemsFromUrls, uploadItems } from "@/lib/uploadClient";
import { POSITIONS, POSITION_LABELS_KO, DEGREES } from "@/lib/memberConstants";
import {
  Button, Input, Select, Field, Card, Toolbar, SearchInput, Table, td, Badge, Empty, Segment, FormGrid, span2,
  SlidePanel, useToast, useConfirm,
} from "./ui";

const EMPTY_MEMBER = {
  name_kor: "", name_eng: "", email: "", phone: "", kakao_id: "", year_joined: "", current_position: "", co_advisor: "",
  cv_link: "", scholar_link: "", linkedin_link: "", orcid_link: "",
  position: "MS-PhD Student", degree: "TBD", status: "active", year_left: "", is_public: true, sort_order: "", user_id: "",
};
function formFromMember(m) {
  const f = {};
  for (const k of Object.keys(EMPTY_MEMBER)) f[k] = m.raw[k] ?? (typeof EMPTY_MEMBER[k] === "boolean" ? EMPTY_MEMBER[k] : "");
  f.is_public = !!m.raw.is_public;
  f.photo = itemsFromUrls(m.raw.photo_url ? [m.raw.photo_url] : []);
  return f;
}
const EMPTY_INTERN = () => ({ name_eng: "", name_kor: "", participations: [{ program: "", period: "" }], achievements: [] });

export default function DirectoryMaster() {
  const toast = useToast();
  const confirm = useConfirm();

  const [members, setMembers] = useState([]);
  const [unlinkedUsers, setUnlinkedUsers] = useState([]);
  const [interns, setInterns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [section, setSection] = useState("members"); // members | interns
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState(null); // { kind: 'member'|'intern', id, form }
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([apiFetch("/api/admin/members"), apiFetch("/api/admin/interns")]);
      setMembers(a.members || []); setUnlinkedUsers(a.unlinkedUsers || []); setInterns(b.interns || []);
    } catch (e) { toast.error(e.message); }
    finally { setIsLoading(false); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => (filter === "all" || m.status === filter) &&
      (!q || [m.nameKor, m.nameEng, m.email, m.userId].some((v) => (v || "").toLowerCase().includes(q))));
  }, [members, filter, search]);
  const counts = useMemo(() => members.reduce((a, m) => { a[m.status] = (a[m.status] || 0) + 1; return a; }, {}), [members]);

  const setF = (k, v) => setPanel((p) => ({ ...p, form: { ...p.form, [k]: v } }));

  // ---- 저장 ----
  async function save() {
    const { kind, id, form } = panel;
    setIsSaving(true);
    try {
      if (kind === "member") {
        if (!form.name_kor.trim()) throw new Error("이름(한글)은 필수입니다.");
        const uploaded = await uploadItems(form.photo, {
          folder: "members", resizeImages: true, resizeOptions: { maxEdge: 800, quality: 0.85 },
          onItemsChange: (items) => setPanel((p) => (p ? { ...p, form: { ...p.form, photo: items } } : p)),
        });
        const { photo, ...fields } = form;
        const payload = { ...fields, photo_url: uploaded[0]?.url || null, user_id: fields.user_id || null, sort_order: fields.sort_order === "" ? null : Number(fields.sort_order) };
        await apiFetch("/api/admin/members", { method: id ? "PATCH" : "POST", body: id ? { id, ...payload } : payload });
        toast.success(id ? "멤버 정보를 저장했습니다." : "멤버를 추가했습니다.");
      } else {
        if (!form.name_eng.trim()) throw new Error("영어 이름은 필수입니다.");
        await apiFetch("/api/admin/interns", { method: id ? "PATCH" : "POST", body: id ? { id, ...form } : form });
        toast.success("인턴 기록을 저장했습니다.");
      }
      setPanel(null);
      load();
    } catch (e) { toast.error("실패: " + e.message); }
    finally { setIsSaving(false); }
  }

  async function quickPatch(m, patch) {
    try {
      const { member } = await apiFetch("/api/admin/members", { method: "PATCH", body: { id: m.id, ...patch } });
      setMembers((prev) => prev.map((x) => (x.id === m.id ? member : x)));
      toast.success("변경했습니다.");
    } catch (e) { toast.error("실패: " + e.message); }
  }

  async function remove(kind, item) {
    const msg = kind === "member"
      ? { title: "멤버 삭제", message: `${item.nameKor} 멤버 정보를 삭제합니다. 휴가 기록도 함께 지워집니다. (포털 계정은 남습니다)` }
      : { title: "인턴 기록 삭제", message: `${item.name_eng} 인턴 기록을 삭제합니다.` };
    if (!(await confirm({ ...msg, confirmText: "삭제", danger: true }))) return;
    try {
      await apiFetch(`/api/admin/${kind === "member" ? "members" : "interns"}?id=${item.id}`, { method: "DELETE" });
      toast.success("삭제했습니다.");
      load();
    } catch (e) { toast.error("삭제 실패: " + e.message); }
  }

  if (isLoading) return <Empty>불러오는 중...</Empty>;

  const linkableUsers = panel?.kind === "member"
    ? [...unlinkedUsers, ...(panel.form.user_id && !unlinkedUsers.some((u) => u.userId === panel.form.user_id) ? [{ userId: panel.form.user_id, name: "(현재 연결)" }] : [])]
    : [];

  return (
    <div>
      <Toolbar title="🗂 멤버 관리">
        <Segment value={section} onChange={setSection} options={[["members", `멤버 ${members.length}`], ["interns", `단기 인턴 기록 ${interns.length}`]]} />
        {section === "members"
          ? <Button onClick={() => setPanel({ kind: "member", id: null, form: { ...EMPTY_MEMBER, photo: [] } })}><FaPlus size={11} /> 멤버 추가</Button>
          : <Button onClick={() => setPanel({ kind: "intern", id: null, form: EMPTY_INTERN() })}><FaPlus size={11} /> 인턴 기록 추가</Button>}
      </Toolbar>

      {/* ===== 멤버 ===== */}
      {section === "members" && (
        <>
          {unlinkedUsers.length > 0 && (
            <div style={{ background: "#fff4e5", border: "1px solid #ffd9a8", color: "#8a5200", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem", marginBottom: 12 }}>
              멤버 정보에 연결되지 않은 포털 계정: {unlinkedUsers.map((u) => `${u.name}(${u.userId})`).join(", ")} — 해당 멤버 행을 열어 「포털 계정」에서 연결해주세요.
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <Segment value={filter} onChange={setFilter} options={[["active", `Active ${counts.active || 0}`], ["graduated", `Graduated ${counts.graduated || 0}`], ["all", "전체"]]} />
            <SearchInput value={search} onChange={setSearch} placeholder="이름 · 이메일 · ID 검색" style={{ marginLeft: "auto" }} />
          </div>

          <Card tight>
            {visible.length === 0 ? <Empty>해당하는 멤버가 없습니다.</Empty> : (
              <Table>
                <thead><tr><th>이름</th><th style={{ width: 150 }}>신분</th><th style={{ width: 90 }}>학위</th><th style={{ width: 110 }}>상태</th><th style={{ width: 110 }}>입학 / 졸업</th><th style={{ width: 110 }}>계정</th><th style={{ width: 50 }}>공개</th><th style={{ width: 80 }}>수정</th><th style={{ width: 80 }}></th></tr></thead>
                <tbody>
                  {visible.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {m.photoUrl
                            ? <Image src={m.photoUrl} alt="" width={32} height={32} loading="lazy" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                            : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#eef1f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#adb5bd", flexShrink: 0 }}><FaUser size={12} /></div>}
                          <div><div style={{ fontWeight: 600, color: "#222" }}>{m.nameKor}</div><div style={{ color: "#8a94a0", fontSize: "0.76rem" }}>{m.nameEng || "-"}</div></div>
                        </div>
                      </td>
                      <td><Select value={m.position} onChange={(e) => quickPatch(m, { position: e.target.value })} style={sel}>{POSITIONS.map((p) => <option key={p} value={p}>{POSITION_LABELS_KO[p]}</option>)}</Select></td>
                      <td><Select value={m.degree} onChange={(e) => quickPatch(m, { degree: e.target.value })} style={sel}>{DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}</Select></td>
                      <td><Select value={m.status} onChange={(e) => quickPatch(m, { status: e.target.value })} style={{ ...sel, color: m.status === "active" ? "#137333" : "#c5221f", fontWeight: 700 }}><option value="active">Active</option><option value="graduated">Graduated</option></Select></td>
                      <td className={td.muted}>{m.yearJoined || "-"}{m.status === "graduated" && ` → ${m.yearLeft || "?"}`}</td>
                      <td>{m.userId ? <Badge color="green">{m.userId}</Badge> : <Badge color="orange">미연결</Badge>}</td>
                      <td><input type="checkbox" checked={m.isPublic} onChange={(e) => quickPatch(m, { is_public: e.target.checked })} title="공개 Members 페이지 표시" /></td>
                      <td className={td.muted}>{m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : "-"}</td>
                      <td className={td.right}>
                        <span className={td.actions}>
                          <Button variant="ghost" size="icon" title="편집" onClick={() => setPanel({ kind: "member", id: m.id, form: formFromMember(m) })}><FaPen size={11} /></Button>
                          <Button variant="danger" size="icon" title="삭제" onClick={() => remove("member", m)}><FaTrash size={11} /></Button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}

      {/* ===== 단기 인턴 ===== */}
      {section === "interns" && (
        <Card tight>
          <div style={{ padding: "10px 14px", fontSize: "0.82rem", color: "#666", borderBottom: "1px solid #eef0f3" }}>
            계정·Directory 없이 공개 페이지 Former Interns 에만 표시되는 기록입니다. 포털 계정을 준 장기 인턴은 멤버로 관리하세요 (position/degree = Intern).
          </div>
          {interns.length === 0 ? <Empty>기록이 없습니다.</Empty> : (
            <Table>
              <thead><tr><th>이름</th><th>참여</th><th style={{ width: 80 }}>성과</th><th style={{ width: 80 }}></th></tr></thead>
              <tbody>
                {interns.map((it) => (
                  <tr key={it.id}>
                    <td><div style={{ fontWeight: 600 }}>{it.name_eng}</div>{it.name_kor && <div style={{ color: "#8a94a0", fontSize: "0.76rem" }}>{it.name_kor}</div>}</td>
                    <td className={td.muted} style={{ whiteSpace: "normal" }}>{(it.participations || []).map((p) => `${p.program} · ${p.period}`).join(" / ") || "-"}</td>
                    <td>{(it.achievements || []).length > 0 ? <Badge color="blue">🏅 {it.achievements.length}</Badge> : <span style={{ color: "#ccc" }}>-</span>}</td>
                    <td className={td.right}>
                      <span className={td.actions}>
                        <Button variant="ghost" size="icon" onClick={() => setPanel({ kind: "intern", id: it.id, form: { name_eng: it.name_eng, name_kor: it.name_kor || "", participations: it.participations?.length ? it.participations : [{ program: "", period: "" }], achievements: it.achievements || [] } })}><FaPen size={11} /></Button>
                        <Button variant="danger" size="icon" onClick={() => remove("intern", it)}><FaTrash size={11} /></Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ===== 패널 ===== */}
      <SlidePanel
        open={!!panel}
        title={panel?.kind === "member" ? (panel.id ? `멤버 편집 — ${panel.form.name_kor}` : "새 멤버") : panel?.id ? "인턴 기록 편집" : "새 인턴 기록"}
        onClose={() => !isSaving && setPanel(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setPanel(null)} disabled={isSaving}>취소</Button>
          <Button onClick={save} disabled={isSaving}>{isSaving ? "저장 중..." : "저장"}</Button>
        </>}
      >
        {panel?.kind === "member" && <MemberForm form={panel.form} set={setF} linkableUsers={linkableUsers} disabled={isSaving} />}
        {panel?.kind === "intern" && <InternForm form={panel.form} set={setF} />}
      </SlidePanel>
    </div>
  );
}

function MemberForm({ form, set, linkableUsers, disabled }) {
  const T = (k, label, extra = {}) => <Field label={label}><Input value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} disabled={disabled} {...extra} /></Field>;
  return (
    <>
      <Card style={{ background: "#fff4e5", borderColor: "#ffd9a8", padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: "0.76rem", color: "#8a5200", fontWeight: 700, marginBottom: 8 }}>교수님 전용</div>
        <FormGrid cols={3}>
          <Field label="신분 (position)"><Select value={form.position} onChange={(e) => set("position", e.target.value)}>{POSITIONS.map((p) => <option key={p} value={p}>{POSITION_LABELS_KO[p]} ({p})</option>)}</Select></Field>
          <Field label="최종 학위 (degree)"><Select value={form.degree} onChange={(e) => set("degree", e.target.value)}>{DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}</Select></Field>
          <Field label="상태"><Select value={form.status} onChange={(e) => set("status", e.target.value)}><option value="active">Active</option><option value="graduated">Graduated</option></Select></Field>
          {T("year_joined", "입학/합류 시기", { placeholder: "예: 2026-1" })}
          {T("year_left", "졸업/퇴소 연도", { placeholder: "graduated 로 바꾸면 자동" })}
          {T("current_position", "현재 소속·직위", { placeholder: "졸업 후 소속 등" })}
          {T("co_advisor", "Co-advisor", { placeholder: "예: Prof. Tae Heon Kim (KIST)" })}
          <Field label="포털 계정">
            <Select value={form.user_id || ""} onChange={(e) => set("user_id", e.target.value)}>
              <option value="">(연결 안 함)</option>
              {linkableUsers.map((u) => <option key={u.userId} value={u.userId}>{u.userId} {u.name}</option>)}
            </Select>
          </Field>
          {T("sort_order", "수동 순서", { type: "number", placeholder: "비우면 자동" })}
          <Field label="공개 페이지 표시"><label style={{ display: "flex", alignItems: "center", gap: 6, height: 36, fontSize: "0.85rem" }}><input type="checkbox" checked={!!form.is_public} onChange={(e) => set("is_public", e.target.checked)} /> 표시</label></Field>
        </FormGrid>
      </Card>
      <FormGrid>
        <Field label="프로필 사진" className={span2}><FileUploader items={form.photo} onChange={(items) => set("photo", items)} multiple={false} accept="image/*" disabled={disabled} /></Field>
        {T("name_kor", "이름 (한글) *")}{T("name_eng", "이름 (영문)")}
        {T("email", "E-mail")}{T("phone", "전화번호")}
        {T("kakao_id", "Kakao ID")}
        <div />
        {T("cv_link", "CV 링크")}{T("scholar_link", "Google Scholar")}
        {T("linkedin_link", "LinkedIn")}{T("orcid_link", "ORCID")}
      </FormGrid>
    </>
  );
}

function InternForm({ form, set }) {
  const setRow = (key, i, k, v) => set(key, form[key].map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <>
      <FormGrid>
        <Field label="영어 이름" required><Input autoFocus value={form.name_eng} onChange={(e) => set("name_eng", e.target.value)} /></Field>
        <Field label="한글 이름"><Input value={form.name_kor} onChange={(e) => set("name_kor", e.target.value)} /></Field>
      </FormGrid>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: "0.78rem", color: "#5b6b7c", fontWeight: 600, marginBottom: 6 }}>참여 (프로그램 · 기간)</div>
        {form.participations.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <Input placeholder="MSE Intern" value={p.program} onChange={(e) => setRow("participations", i, "program", e.target.value)} />
            <Input placeholder="Summer 2025" value={p.period} onChange={(e) => setRow("participations", i, "period", e.target.value)} />
            <Button variant="danger" size="icon" onClick={() => set("participations", form.participations.filter((_, j) => j !== i))}><FaTrash size={11} /></Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => set("participations", [...form.participations, { program: "", period: "" }])}><FaPlus size={10} /> 참여 추가</Button>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: "0.78rem", color: "#5b6b7c", fontWeight: 600, marginBottom: 6 }}>성과 (수상 / 논문 링크)</div>
        {form.achievements.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <Select value={a.type} onChange={(e) => setRow("achievements", i, "type", e.target.value)} style={{ width: 110 }}><option value="award">🏆 수상</option><option value="paper">📄 논문</option></Select>
            <Input placeholder="제목" value={a.title} onChange={(e) => setRow("achievements", i, "title", e.target.value)} />
            <Input placeholder="https://…" value={a.url} onChange={(e) => setRow("achievements", i, "url", e.target.value)} />
            <Button variant="danger" size="icon" onClick={() => set("achievements", form.achievements.filter((_, j) => j !== i))}><FaTrash size={11} /></Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => set("achievements", [...form.achievements, { type: "award", title: "", url: "" }])}><FaPlus size={10} /> 성과 추가</Button>
      </div>
    </>
  );
}

const sel = { padding: "4px 6px", fontSize: "0.8rem" };
