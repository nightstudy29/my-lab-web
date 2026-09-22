"use client";

// 업적 (admin 전용) — 논문 업적 요약/표/입력, 학술발표 CRUD, CSV 내보내기.
// 논문 데이터는 papers 테이블(업적 컬럼 포함), 발표는 talks 테이블.

import { useState, useEffect, useMemo } from "react";
import { FaPen, FaTrash, FaPlus, FaFileCsv, FaTriangleExclamation } from "react-icons/fa6";
import { supabase } from "@/lib/supabaseClient";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import PaperAchievementFields, { achievementFromPaper } from "./PaperAchievementFields";
import {
  Button, Input, Select, Textarea, Field, Card, Toolbar, SearchInput, Table, td, Badge, Empty, Segment, FormGrid, span2,
  SlidePanel, useToast, useConfirm,
} from "./ui";
import {
  ACH_FIELDS, ACH_NUMERIC, TALK_FIELDS, TALK_LABELS, isLeadRole, hasAchievement, toCsv, downloadCsv, fmtSheetDate,
} from "@/lib/achievementConstants";

const strip = (html) => String(html || "").replace(/<[^>]+>/g, "");
const ROLE_COLOR = { "제1저자": "blue", "교신저자": "green", "공동저자": "gray" };

export default function AchievementsAdmin() {
  const toast = useToast();
  const confirm = useConfirm();

  const [section, setSection] = useState("papers"); // papers | talks
  const [papers, setPapers] = useState([]);
  const [talks, setTalks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 필터
  const [search, setSearch] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");   // all | lead | 제1저자 | 교신저자 | 공동저자 | missing
  const [typeFilter, setTypeFilter] = useState("all");

  const [panel, setPanel] = useState(null); // { kind: 'paper'|'talk', id, form, title }
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    const [{ data: p }, t] = await Promise.all([
      supabase.from("papers").select("*").order("year", { ascending: false }).order("seq", { ascending: false }),
      fetch("/api/talks").then((r) => r.json()).catch(() => ({})),
    ]);
    setPapers(p || []);
    setTalks(t.talks || []);
    setIsLoading(false);
  }

  // ---- 논문 필터/요약 ----
  const years = useMemo(() => [...new Set(papers.map((p) => String(p.year)))].sort((a, b) => b - a), [papers]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return papers.filter((p) =>
      (!yearFrom || p.year >= Number(yearFrom)) && (!yearTo || p.year <= Number(yearTo)) &&
      (roleFilter === "all" || (roleFilter === "lead" ? isLeadRole(p.role) : roleFilter === "missing" ? !hasAchievement(p) : p.role === roleFilter)) &&
      (typeFilter === "all" || (p.pub_type || "미분류") === typeFilter) &&
      (!q || [strip(p.title), p.journal, p.institution, p.funding].some((v) => (v || "").toLowerCase().includes(q)))
    );
  }, [papers, search, yearFrom, yearTo, roleFilter, typeFilter]);

  const summary = useMemo(() => {
    const s = { total: filtered.length, lead: 0, first: 0, corr: 0, co: 0, scie: 0, q1: 0, missing: 0, thisYear: 0, ifSum: 0, ifN: 0 };
    const y = new Date().getFullYear();
    for (const p of filtered) {
      if (isLeadRole(p.role)) s.lead++;
      if (p.role === "제1저자") s.first++; else if (p.role === "교신저자") s.corr++; else if (p.role === "공동저자") s.co++;
      if (p.pub_type === "SCIE") s.scie++;
      if (p.quartile_publish === "Q1") s.q1++;
      if (!hasAchievement(p)) s.missing++;
      if (p.year === y) s.thisYear++;
      if (p.if_publish != null) { s.ifSum += Number(p.if_publish); s.ifN++; }
    }
    return s;
  }, [filtered]);

  // ---- 저장 ----
  const setF = (k, v) => setPanel((p) => ({ ...p, form: { ...p.form, [k]: v } }));

  async function save() {
    setIsSaving(true);
    try {
      if (panel.kind === "paper") {
        const body = { id: panel.id, url: (panel.form.url || "").trim() };
        for (const k of ACH_FIELDS) {
          const v = panel.form[k];
          body[k] = v === "" || v == null ? null : ACH_NUMERIC.includes(k) ? Number(v) : v;
        }
        const res = await fetch("/api/papers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "저장 실패");
        toast.success("업적 정보를 저장했습니다.");
      } else {
        const f = panel.form;
        if (!f.conference.trim() || !f.title.trim()) throw new Error("학술대회명과 발표제목은 필수입니다.");
        const res = await fetch("/api/talks", {
          method: panel.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(panel.id ? { id: panel.id, ...f } : f),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "저장 실패");
        toast.success(panel.id ? "발표를 수정했습니다." : "발표를 추가했습니다.");
      }
      setPanel(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function removeTalk(t) {
    if (!(await confirm({ title: "발표 삭제", message: `"${t.title}"\n삭제하면 되돌릴 수 없습니다.`, confirmText: "삭제", danger: true }))) return;
    const res = await fetch(`/api/talks?id=${t.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("삭제 실패");
    toast.success("삭제했습니다.");
    load();
  }

  // ---- 내보내기 (업적정리 시트와 같은 컬럼 순서) ----
  function exportPapers() {
    const headers = ["#", "게재지구분", "기관", "투고년월", "발표년월", "서지년도", "제목", "게재지명", "권/호/쪽", "ISSN", "EISSN", "DOI", "저자수", "역할", "사사", "IF (Submit)", "JCR", "Quartile", "IF (Publish)", "JCR", "Quartile", "메모"];
    const rows = [...filtered].sort((a, b) => a.year - b.year || a.seq - b.seq).map((p, i) => [
      i + 1, p.pub_type || "", p.institution || "", fmtSheetDate(p.submitted_on), fmtSheetDate(p.published_on), p.year, strip(p.title), p.journal || "",
      p.volume_pages || "", p.issn || "", p.eissn || "", p.url || "", p.author_count ?? "", p.role || "", p.funding || "-",
      p.if_submit ?? "", p.jcr_submit || "", p.quartile_submit || "", p.if_publish ?? "", p.jcr_publish || "", p.quartile_publish || "", p.notes || "",
    ]);
    const range = [yearFrom, yearTo].filter(Boolean).join("-") || "all";
    downloadCsv(`papers_${range}_${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
    toast.success(`논문 ${rows.length}편을 CSV로 내보냈습니다.`);
  }
  function exportTalks() {
    const headers = TALK_FIELDS.map((k) => TALK_LABELS[k]);
    const rows = talks.map((t) => TALK_FIELDS.map((k) => (k.endsWith("_on") || k.startsWith("period") ? fmtSheetDate(t[k]) : t[k] ?? "")));
    downloadCsv(`talks_${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
    toast.success(`발표 ${rows.length}건을 CSV로 내보냈습니다.`);
  }

  const openPaper = (p) => setPanel({ kind: "paper", id: p.id, title: strip(p.title), form: { ...achievementFromPaper(p), url: p.url || "" } });
  const openTalk = (t) => setPanel({
    kind: "talk", id: t?.id ?? null,
    form: Object.fromEntries(TALK_FIELDS.map((k) => [k, t?.[k] ?? ""])),
  });

  if (isLoading) return <Empty>불러오는 중...</Empty>;

  return (
    <div>
      <Toolbar title="🏅 업적">
        <Segment value={section} onChange={setSection} options={[["papers", `논문 ${papers.length}`], ["talks", `학술발표 ${talks.length}`]]} />
      </Toolbar>

      {/* ===================== 논문 ===================== */}
      {section === "papers" && (
        <>
          {/* 필터 */}
          <Card style={{ marginBottom: 12, padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <SearchInput value={search} onChange={setSearch} placeholder="제목 · 저널 · 기관 · 사사" style={{ flex: 1, minWidth: 180 }} />
              <Select value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} style={{ width: "auto" }}><option value="">시작 연도</option>{[...years].reverse().map((y) => <option key={y} value={y}>{y}</option>)}</Select>
              <span style={{ color: "#a5adb8" }}>~</span>
              <Select value={yearTo} onChange={(e) => setYearTo(e.target.value)} style={{ width: "auto" }}><option value="">끝 연도</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</Select>
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: "auto" }}>
                <option value="all">모든 역할</option><option value="lead">주저자 (제1+교신)</option><option value="제1저자">제1저자</option><option value="교신저자">교신저자</option><option value="공동저자">공동저자</option><option value="missing">⚠ 업적 미입력</option>
              </Select>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: "auto" }}>
                <option value="all">모든 구분</option>{["SCIE", "ESCI", "SCOPUS", "KCI", "기타", "미분류"].map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Button variant="secondary" onClick={exportPapers}><FaFileCsv size={12} /> CSV 내보내기 ({filtered.length})</Button>
            </div>
          </Card>

          {/* 요약 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 12 }}>
            {[
              ["총 편수", summary.total], ["주저자", summary.lead, `1저자 ${summary.first} · 교신 ${summary.corr}`], ["공저자", summary.co],
              ["SCIE", summary.scie], ["Q1", summary.q1, summary.total ? `${Math.round((summary.q1 / summary.total) * 100)}%` : ""],
              ["평균 IF", summary.ifN ? (summary.ifSum / summary.ifN).toFixed(2) : "-", `${summary.ifN}편 기준`],
              ["올해", summary.thisYear], ["업적 미입력", summary.missing, "", summary.missing > 0],
            ].map(([label, value, sub, warn]) => (
              <Card key={label} style={{ padding: "12px 14px", borderColor: warn ? "#ffd9a8" : undefined }}>
                <div style={{ fontSize: "0.72rem", color: "#8a94a0" }}>{label}</div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: warn ? "#b26a00" : "#222", lineHeight: 1.2 }}>{value}</div>
                {sub && <div style={{ fontSize: "0.7rem", color: "#a5adb8", marginTop: 2 }}>{sub}</div>}
              </Card>
            ))}
          </div>

          {/* 표 */}
          <Card tight>
            {filtered.length === 0 ? <Empty>조건에 맞는 논문이 없습니다.</Empty> : (
              <Table>
                <thead><tr><th style={{ width: 60 }}>연도</th><th>제목 / 저널</th><th style={{ width: 80 }}>역할</th><th style={{ width: 70 }}>구분</th><th style={{ width: 70 }}>IF</th><th style={{ width: 50 }}>Q</th><th style={{ width: 70 }}>기관</th><th style={{ width: 60 }}></th></tr></thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} style={{ background: hasAchievement(p) ? undefined : "#fffaf3" }}>
                      <td className={td.muted}>{p.year}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#222", lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.title) }} />
                        <div style={{ fontSize: "0.76rem", color: "#8a94a0", marginTop: 1 }}>{p.journal}{p.volume_pages ? ` · ${p.volume_pages}` : ""}{p.published_on ? ` · ${fmtSheetDate(p.published_on)}` : ""}</div>
                        <div style={{ fontSize: "0.72rem", marginTop: 1 }}>
                          {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: "#6b7785", textDecoration: "none" }}>{p.url.replace(/^https?:\/\/(doi\.org\/)?/, "")}</a> : <span style={{ color: "#b26a00" }}>DOI 없음</span>}
                        </div>
                      </td>
                      <td>{p.role ? <Badge color={ROLE_COLOR[p.role]}>{p.role}</Badge> : <Badge color="orange"><FaTriangleExclamation size={9} /> 미입력</Badge>}</td>
                      <td className={td.muted}>{p.pub_type || "-"}</td>
                      <td className={td.muted}>{p.if_publish ?? "-"}</td>
                      <td className={td.muted}>{p.quartile_publish || "-"}</td>
                      <td className={td.muted}>{p.institution || "-"}</td>
                      <td className={td.right}><Button variant="ghost" size="icon" title="업적 정보 편집" onClick={() => openPaper(p)}><FaPen size={11} /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}

      {/* ===================== 학술발표 ===================== */}
      {section === "talks" && (
        <>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 12 }}>
            <Button variant="secondary" onClick={exportTalks} disabled={talks.length === 0}><FaFileCsv size={12} /> CSV 내보내기</Button>
            <Button onClick={() => openTalk(null)}><FaPlus size={11} /> 발표 추가</Button>
          </div>
          <Card tight>
            {talks.length === 0 ? <Empty>등록된 학술발표가 없습니다.</Empty> : (
              <Table>
                <thead><tr><th style={{ width: 100 }}>발표일</th><th>발표제목 / 학술대회</th><th style={{ width: 160 }}>장소</th><th style={{ width: 60 }}>저자수</th><th style={{ width: 160 }}>과제</th><th style={{ width: 90 }}></th></tr></thead>
                <tbody>
                  {talks.map((t) => (
                    <tr key={t.id}>
                      <td className={td.muted}>{t.presented_on || "-"}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#222" }}>{t.title}</div>
                        <div style={{ fontSize: "0.76rem", color: "#8a94a0", marginTop: 1 }}>{t.conference}{t.organizer ? ` · ${t.organizer}` : ""}{t.period_start ? ` · ${t.period_start}${t.period_end ? ` ~ ${t.period_end}` : ""}` : ""}</div>
                      </td>
                      <td className={td.muted} style={{ whiteSpace: "normal" }}>{[t.venue, t.country].filter(Boolean).join(", ") || "-"}</td>
                      <td className={td.muted}>{t.author_count ?? "-"}</td>
                      <td className={td.muted} style={{ whiteSpace: "normal" }}>{t.project || "-"}{t.travel_project ? <div style={{ fontSize: "0.72rem" }}>출장: {t.travel_project}</div> : null}</td>
                      <td className={td.right}>
                        <span className={td.actions}>
                          <Button variant="ghost" size="icon" title="수정" onClick={() => openTalk(t)}><FaPen size={11} /></Button>
                          <Button variant="danger" size="icon" title="삭제" onClick={() => removeTalk(t)}><FaTrash size={11} /></Button>
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

      {/* ===================== 패널 ===================== */}
      <SlidePanel
        open={!!panel}
        title={panel?.kind === "paper" ? "업적 정보" : panel?.id ? "발표 수정" : "발표 추가"}
        onClose={() => !isSaving && setPanel(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setPanel(null)} disabled={isSaving}>취소</Button>
          <Button onClick={save} disabled={isSaving}>{isSaving ? "저장 중..." : "저장"}</Button>
        </>}
      >
        {panel?.kind === "paper" && (
          <>
            <div style={{ fontSize: "0.88rem", color: "#333", fontWeight: 600, marginBottom: 14, lineHeight: 1.4 }}>{panel.title}</div>
            <div style={{ marginBottom: 14 }}>
              <Field label="DOI / URL" hint="공개 Publications 페이지 링크이자 CSV 의 DOI 열. 예: https://doi.org/10.1021/…">
                <Input value={panel.form.url ?? ""} onChange={(e) => setF("url", e.target.value)} placeholder="https://doi.org/…" />
              </Field>
            </div>
            <PaperAchievementFields form={panel.form} onChange={setF} />
          </>
        )}
        {panel?.kind === "talk" && (
          <FormGrid>
            <Field label={TALK_LABELS.title} required className={span2}><Input autoFocus value={panel.form.title} onChange={(e) => setF("title", e.target.value)} /></Field>
            <Field label={TALK_LABELS.conference} required className={span2}><Input value={panel.form.conference} onChange={(e) => setF("conference", e.target.value)} /></Field>
            <Field label={TALK_LABELS.organizer}><Input value={panel.form.organizer} onChange={(e) => setF("organizer", e.target.value)} /></Field>
            <Field label={TALK_LABELS.country}><Input value={panel.form.country} onChange={(e) => setF("country", e.target.value)} placeholder="대한민국 / USA …" /></Field>
            <Field label={TALK_LABELS.venue} className={span2}><Input value={panel.form.venue} onChange={(e) => setF("venue", e.target.value)} placeholder="도시, 시설명" /></Field>
            <Field label={TALK_LABELS.period_start}><Input type="date" value={panel.form.period_start} onChange={(e) => setF("period_start", e.target.value)} /></Field>
            <Field label={TALK_LABELS.period_end}><Input type="date" value={panel.form.period_end} onChange={(e) => setF("period_end", e.target.value)} /></Field>
            <Field label={TALK_LABELS.presented_on}><Input type="date" value={panel.form.presented_on} onChange={(e) => setF("presented_on", e.target.value)} /></Field>
            <Field label={TALK_LABELS.author_count}><Input type="number" min={1} value={panel.form.author_count} onChange={(e) => setF("author_count", e.target.value)} /></Field>
            <Field label={TALK_LABELS.project}><Input value={panel.form.project} onChange={(e) => setF("project", e.target.value)} /></Field>
            <Field label={TALK_LABELS.travel_project}><Input value={panel.form.travel_project} onChange={(e) => setF("travel_project", e.target.value)} /></Field>
            <Field label={TALK_LABELS.notes} className={span2}><Textarea rows={2} value={panel.form.notes} onChange={(e) => setF("notes", e.target.value)} /></Field>
          </FormGrid>
        )}
      </SlidePanel>
    </div>
  );
}
