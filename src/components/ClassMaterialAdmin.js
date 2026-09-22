"use client";

// 강의자료 관리 — 학기 드롭다운(과거 학기도 선택·편집) → 과목 탭 → 자료 표.
// 자료/학기/과목 추가·수정은 슬라이드 패널. 메인 Lecture 페이지에는 is_current 학기만 노출됩니다.

import { useState, useEffect, useMemo } from "react";
import { FaPlus, FaPen, FaTrash, FaArrowUpRightFromSquare, FaCheck, FaRotate } from "react-icons/fa6";
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/apiClient";
import FileUploader from "./FileUploader";
import { itemsFromUrls, uploadItems } from "@/lib/uploadClient";
import {
  Button, Input, Select, Field, Card, Toolbar, Table, td, Badge, Empty, Segment, FormGrid, span2,
  SlidePanel, useToast, useConfirm,
} from "./ui";

const TYPES = [["slide", "강의자료"], ["notice", "공지"], ["grade", "성적"]];
const TYPE_LABEL = Object.fromEntries(TYPES);
const TYPE_COLOR = { slide: "blue", notice: "orange", grade: "green" };

const api = (url, method, body) => apiFetch(url, { method, body });

export default function ClassMaterialAdmin() {
  const toast = useToast();
  const confirm = useConfirm();

  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState(null);
  const [materials, setMaterials] = useState([]); // 선택 학기의 전체 자료
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [panel, setPanel] = useState(null); // { kind: 'material'|'semester'|'course', id, form }
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 과목/자료 변경 후 선택 학기 다시 불러오기

  // ---- 로딩 ----
  useEffect(() => { loadSemesters(); }, []);

  async function loadSemesters(preferId) {
    const { data } = await supabase.from("semesters").select("*").order("created_at", { ascending: false });
    const list = data || [];
    setSemesters(list);
    const pick = list.find((s) => s.id === preferId) || list.find((s) => s.is_current) || list[0] || null;
    setSemesterId(pick?.id ?? null);
    setIsLoading(false);
  }

  useEffect(() => {
    if (!semesterId) { setCourses([]); setMaterials([]); return; }
    let cancelled = false;
    (async () => {
      const { data: courseRows } = await supabase.from("courses").select("*").eq("semester_id", semesterId).order("sort_order", { ascending: true });
      if (cancelled) return;
      const cs = courseRows || [];
      setCourses(cs);
      setCourseId((prev) => (cs.some((c) => c.id === prev) ? prev : cs[0]?.id ?? null));
      if (cs.length) {
        const { data: mats } = await supabase.from("materials").select("*").in("course_id", cs.map((c) => c.id));
        if (!cancelled) setMaterials(mats || []);
      } else setMaterials([]);
    })();
    return () => { cancelled = true; };
  }, [semesterId, refreshKey]);

  const reloadSemester = () => setRefreshKey((k) => k + 1);

  const semester = semesters.find((s) => s.id === semesterId) || null;
  const course = courses.find((c) => c.id === courseId) || null;
  const visibleMaterials = useMemo(() =>
    materials.filter((m) => m.course_id === courseId && (typeFilter === "all" || m.type === typeFilter))
      .sort((a, b) => new Date(b.date) - new Date(a.date) || b.seq - a.seq),
  [materials, courseId, typeFilter]);
  const countByCourse = useMemo(() => materials.reduce((a, m) => { a[m.course_id] = (a[m.course_id] || 0) + 1; return a; }, {}), [materials]);

  const setF = (k, v) => setPanel((p) => ({ ...p, form: { ...p.form, [k]: v } }));

  // ---- 학기 ----
  async function switchSemester() {
    if (!(await confirm({ title: "학기 전환", message: `"${semester.label}" 학기를 현재 학기로 전환합니다.\n학생들에게 이 학기 자료가 보이게 됩니다.`, confirmText: "전환" }))) return;
    try { await api("/api/semesters", "PATCH", { id: semester.id, action: "switch" }); toast.success(`${semester.label} 학기로 전환했습니다.`); loadSemesters(semester.id); }
    catch (e) { toast.error(e.message); }
  }
  async function deleteSemester() {
    if (!(await confirm({ title: "학기 삭제", message: `"${semester.label}" 학기를 완전히 삭제합니다.\n과목 ${courses.length}개, 자료 ${materials.length}개가 함께 삭제되며 되돌릴 수 없습니다.`, confirmText: "삭제", danger: true }))) return;
    try { await api(`/api/semesters?id=${semester.id}`, "DELETE"); toast.success("학기를 삭제했습니다."); loadSemesters(); }
    catch (e) { toast.error(e.message); }
  }

  // ---- 과목 ----
  async function deleteCourse() {
    const n = countByCourse[course.id] || 0;
    if (!(await confirm({ title: "과목 삭제", message: `"${course.name}" 과목과 자료 ${n}개를 삭제합니다. 되돌릴 수 없습니다.`, confirmText: "삭제", danger: true }))) return;
    try { await api(`/api/courses?id=${course.id}`, "DELETE"); toast.success("과목을 삭제했습니다."); reloadSemester(); }
    catch (e) { toast.error(e.message); }
  }

  // ---- 자료 ----
  async function deleteMaterial(m) {
    if (!(await confirm({ title: "자료 삭제", message: `"${m.title}"${m.is_external_link ? "" : "\n업로드된 파일도 함께 삭제됩니다."}`, confirmText: "삭제", danger: true }))) return;
    try { await api(`/api/classmaterials?id=${m.id}`, "DELETE"); toast.success("자료를 삭제했습니다."); setMaterials((prev) => prev.filter((x) => x.id !== m.id)); }
    catch (e) { toast.error(e.message); }
  }

  // ---- 패널 저장 ----
  async function save() {
    const { kind, id, form } = panel;
    setIsSaving(true);
    try {
      if (kind === "semester") {
        if (!form.label.trim()) throw new Error("학기 이름을 입력해주세요 (예: 2027-1)");
        if (id) { await api("/api/semesters", "PATCH", { id, action: "rename", label: form.label.trim() }); toast.success("학기 이름을 바꿨습니다."); loadSemesters(id); }
        else { const d = await api("/api/semesters", "POST", { label: form.label.trim() }); toast.success(`"${form.label.trim()}" 학기를 시작했습니다. 학생들에게 이 학기가 보입니다.`); loadSemesters(d.semester?.id); }
      } else if (kind === "course") {
        if (!form.name.trim()) throw new Error("과목명을 입력해주세요.");
        if (id) { await api("/api/courses", "PATCH", { id, name: form.name.trim() }); toast.success("과목명을 바꿨습니다."); }
        else { const d = await api("/api/courses", "POST", { semester_id: semesterId, name: form.name.trim(), sort_order: courses.length }); toast.success("과목을 추가했습니다."); setCourseId(d.course?.id); }
        reloadSemester();
      } else {
        if (!form.title.trim()) throw new Error("제목을 입력해주세요.");
        let fileUrl = form.externalUrl.trim();
        if (form.isExternalLink) {
          if (!fileUrl) throw new Error("외부 링크 URL을 입력해주세요.");
        } else if (!id) {
          if (form.files.length === 0) throw new Error("파일을 선택해주세요.");
          const up = await uploadItems(form.files, { folder: "classmaterial", onItemsChange: (items) => setPanel((p) => (p ? { ...p, form: { ...p.form, files: items } } : p)) });
          fileUrl = up[0].url;
        }
        const body = { type: form.type, date: form.date, title: form.title.trim(), is_external_link: form.isExternalLink };
        if (id) { await api("/api/classmaterials", "PATCH", { id, ...body, file_url: form.isExternalLink ? fileUrl : undefined }); toast.success("자료를 수정했습니다."); }
        else { await api("/api/classmaterials", "POST", { course_id: courseId, ...body, file_url: fileUrl }); toast.success("자료를 추가했습니다."); }
        reloadSemester();
      }
      setPanel(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  }

  const openMaterial = (m) => setPanel({
    kind: "material", id: m?.id ?? null,
    form: m
      ? { type: m.type, date: m.date, title: m.title, isExternalLink: !!m.is_external_link, externalUrl: m.is_external_link ? m.file_url : "", files: m.is_external_link ? [] : itemsFromUrls([m.file_url]) }
      : { type: "slide", date: new Date().toISOString().slice(0, 10), title: "", isExternalLink: false, externalUrl: "", files: [] },
  });

  if (isLoading) return <Empty>불러오는 중...</Empty>;

  return (
    <div>
      {/* ===== 학기 ===== */}
      <Toolbar title="📚 강의자료">
        <Select value={semesterId || ""} onChange={(e) => setSemesterId(e.target.value)} style={{ width: "auto", minWidth: 160, fontWeight: 600 }}>
          {semesters.length === 0 && <option value="">학기 없음</option>}
          {semesters.map((s) => <option key={s.id} value={s.id}>{s.label}{s.is_current ? "  (현재)" : ""}</option>)}
        </Select>
        {semester && !semester.is_current && <Button variant="secondary" size="sm" onClick={switchSemester}><FaRotate size={10} /> 이 학기로 전환</Button>}
        {semester && <Button variant="ghost" size="sm" onClick={() => setPanel({ kind: "semester", id: semester.id, form: { label: semester.label } })}><FaPen size={10} /> 이름</Button>}
        {semester && <Button variant="danger" size="sm" onClick={deleteSemester}><FaTrash size={10} /></Button>}
        <Button size="sm" onClick={() => setPanel({ kind: "semester", id: null, form: { label: "" } })}><FaPlus size={10} /> 새 학기</Button>
      </Toolbar>

      {!semester ? (
        <Card><Empty>학기가 없습니다. 「새 학기」로 시작하세요.</Empty></Card>
      ) : (
        <>
          {semester.is_current
            ? <div style={{ fontSize: "0.78rem", color: "#137333", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><FaCheck size={10} /> 현재 학기 — 메인 Lecture 페이지에 노출 중</div>
            : <div style={{ fontSize: "0.78rem", color: "#b26a00", marginBottom: 10 }}>지난 학기 — 편집은 되지만 메인 페이지에는 보이지 않습니다</div>}

          {/* ===== 과목 탭 ===== */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            {courses.map((c) => (
              <button key={c.id} type="button" onClick={() => setCourseId(c.id)} style={tabStyle(c.id === courseId)}>
                {c.name}<span style={{ marginLeft: 6, fontSize: "0.72rem", opacity: 0.7 }}>{countByCourse[c.id] || 0}</span>
              </button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setPanel({ kind: "course", id: null, form: { name: "" } })}><FaPlus size={10} /> 과목</Button>
          </div>

          {!course ? (
            <Card><Empty>과목이 없습니다. 「+ 과목」으로 추가하세요.</Empty></Card>
          ) : (
            <Card tight>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: "1px solid #eef0f3", flexWrap: "wrap" }}>
                <strong style={{ fontSize: "0.95rem", color: "#222" }}>{course.name}</strong>
                <Button variant="ghost" size="icon" title="과목명 변경" onClick={() => setPanel({ kind: "course", id: course.id, form: { name: course.name } })}><FaPen size={10} /></Button>
                <Button variant="danger" size="icon" title="과목 삭제" onClick={deleteCourse}><FaTrash size={10} /></Button>
                <div style={{ flex: 1 }} />
                <Segment value={typeFilter} onChange={setTypeFilter} options={[["all", "전체"], ...TYPES]} />
                <Button size="sm" onClick={() => openMaterial(null)}><FaPlus size={10} /> 자료 추가</Button>
              </div>
              {visibleMaterials.length === 0 ? <Empty>{typeFilter === "all" ? "등록된 자료가 없습니다." : "해당 유형의 자료가 없습니다."}</Empty> : (
                <Table>
                  <thead><tr><th style={{ width: 110 }}>날짜</th><th style={{ width: 90 }}>유형</th><th>제목</th><th style={{ width: 90 }}></th></tr></thead>
                  <tbody>
                    {visibleMaterials.map((m) => (
                      <tr key={m.id}>
                        <td className={td.muted}>{m.date}</td>
                        <td><Badge color={TYPE_COLOR[m.type] || "gray"}>{TYPE_LABEL[m.type] || m.type}</Badge></td>
                        <td>
                          <a href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ color: "#222", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {m.title}<FaArrowUpRightFromSquare size={10} color="#a5adb8" />
                          </a>
                          {m.is_external_link && <span style={{ marginLeft: 8, fontSize: "0.72rem", color: "#a5adb8" }}>외부 링크</span>}
                        </td>
                        <td className={td.right}>
                          <span className={td.actions}>
                            <Button variant="ghost" size="icon" title="수정" onClick={() => openMaterial(m)}><FaPen size={11} /></Button>
                            <Button variant="danger" size="icon" title="삭제" onClick={() => deleteMaterial(m)}><FaTrash size={11} /></Button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          )}
        </>
      )}

      {/* ===== 패널 ===== */}
      <SlidePanel
        open={!!panel}
        title={panel?.kind === "semester" ? (panel.id ? "학기 이름 변경" : "새 학기 시작") : panel?.kind === "course" ? (panel.id ? "과목명 변경" : "과목 추가") : panel?.id ? "자료 수정" : "자료 추가"}
        onClose={() => !isSaving && setPanel(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setPanel(null)} disabled={isSaving}>취소</Button>
          <Button onClick={save} disabled={isSaving}>{isSaving ? "저장 중..." : panel?.kind === "semester" && !panel.id ? "학기 시작" : "저장"}</Button>
        </>}
      >
        {panel?.kind === "semester" && (
          <>
            <Field label="학기 이름" required hint="예: 2027-1"><Input autoFocus value={panel.form.label} onChange={(e) => setF("label", e.target.value)} /></Field>
            {!panel.id && <p style={{ fontSize: "0.82rem", color: "#b26a00", marginTop: 12 }}>새 학기를 시작하면 자동으로 현재 학기가 되고, 기존 학기는 지난 학기로 바뀝니다 (자료는 그대로 보관).</p>}
          </>
        )}
        {panel?.kind === "course" && (
          <Field label="과목명" required hint="예: 결정학 기초 (Basics of Crystallography) — 괄호 앞부분이 탭에 짧게 표시됩니다"><Input autoFocus value={panel.form.name} onChange={(e) => setF("name", e.target.value)} /></Field>
        )}
        {panel?.kind === "material" && (
          <FormGrid>
            <Field label="유형" required>
              <Select value={panel.form.type} onChange={(e) => setF("type", e.target.value)}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
            </Field>
            <Field label="날짜" required><Input type="date" value={panel.form.date} onChange={(e) => setF("date", e.target.value)} /></Field>
            <Field label="제목" required className={span2}><Input autoFocus value={panel.form.title} onChange={(e) => setF("title", e.target.value)} placeholder="예: Lecture 3 – Bravais lattice" /></Field>
            <div className={span2}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "#333" }}>
                <input type="checkbox" checked={panel.form.isExternalLink} disabled={!!panel.id} onChange={(e) => setF("isExternalLink", e.target.checked)} /> 외부 링크로 등록 (강의계획서, 구글 드라이브 등)
              </label>
            </div>
            {panel.form.isExternalLink ? (
              <Field label="URL" required className={span2}><Input value={panel.form.externalUrl} onChange={(e) => setF("externalUrl", e.target.value)} placeholder="https://…" /></Field>
            ) : panel.id ? (
              <Field label="파일" hint="업로드된 파일 자체를 바꾸려면 삭제 후 새로 추가해주세요." className={span2}>
                <a href={panel.form.files[0]?.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem", color: "#004094" }}>{panel.form.files[0]?.name}</a>
              </Field>
            ) : (
              <Field label="파일" required hint="PDF, PPT, HWP, ZIP 등 · 최대 200MB" className={span2}>
                <FileUploader items={panel.form.files} onChange={(items) => setF("files", items)} multiple={false} disabled={isSaving} />
              </Field>
            )}
          </FormGrid>
        )}
      </SlidePanel>
    </div>
  );
}

const tabStyle = (active) => ({
  padding: "7px 14px", borderRadius: 8, border: "1px solid", borderColor: active ? "#004094" : "#e3e7ed",
  background: active ? "#004094" : "#fff", color: active ? "#fff" : "#4a5a6d", fontWeight: 600, fontSize: "0.85rem",
  cursor: "pointer", font: "inherit", display: "inline-flex", alignItems: "center",
});
