"use client";

// 논문 관리 — 검색/연도 필터 + 표, 추가·수정은 오른쪽 슬라이드 패널.

import { useState, useEffect, useMemo } from "react";
import { FaPen, FaTrash, FaPlus } from "react-icons/fa6";
import { supabase } from "@/lib/supabaseClient";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import {
  Button, Input, Select, Field, Card, Toolbar, SearchInput, Table, td, Badge, Empty, FormGrid, span2,
  SlidePanel, RichTextInput, useToast, useConfirm,
} from "./ui";

function defaultForm() {
  return { year: new Date().getFullYear(), title: "", authors: "", journal: "", url: "", news: [] };
}
function formFromPaper(p) {
  return { year: p.year, title: p.title, authors: p.authors, journal: p.journal || "", url: p.url || "", news: p.news?.length ? p.news : [] };
}
const strip = (html) => String(html || "").replace(/<[^>]+>/g, "");

export default function PapersAdmin() {
  const toast = useToast();
  const confirm = useConfirm();

  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [panel, setPanel] = useState(null); // { id: null | string, form }
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("papers").select("*").order("seq", { ascending: false });
    setPapers(data || []);
    setIsLoading(false);
  }

  const years = useMemo(() => [...new Set(papers.map((p) => String(p.year)))].sort((a, b) => b - a), [papers]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return papers.filter((p) =>
      (year === "all" || String(p.year) === year) &&
      (!q || [strip(p.title), strip(p.authors), p.journal].some((v) => (v || "").toLowerCase().includes(q)))
    );
  }, [papers, search, year]);

  const setF = (k, v) => setPanel((p) => ({ ...p, form: { ...p.form, [k]: v } }));
  const setNews = (i, k, v) => setPanel((p) => ({ ...p, form: { ...p.form, news: p.form.news.map((n, j) => (j === i ? { ...n, [k]: v } : n)) } }));

  async function save() {
    const f = panel.form;
    if (!f.title.trim()) return toast.error("제목을 입력해주세요.");
    if (!f.authors.trim()) return toast.error("저자를 입력해주세요.");
    if (!f.year) return toast.error("연도를 입력해주세요.");
    setIsSaving(true);
    try {
      const payload = {
        year: f.year, title: f.title.trim(), authors: f.authors.trim(), journal: f.journal.trim(), url: f.url.trim(),
        news: f.news.filter((n) => n.name.trim() && n.url.trim()),
      };
      const res = await fetch("/api/papers", {
        method: panel.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(panel.id ? { id: panel.id, ...payload } : payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "저장 실패");
      toast.success(panel.id ? "논문을 수정했습니다." : "논문을 추가했습니다.");
      setPanel(null);
      load();
    } catch (e) {
      toast.error("실패: " + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(p) {
    if (!(await confirm({ title: "논문 삭제", message: `"${strip(p.title)}"\n삭제하면 되돌릴 수 없습니다.`, confirmText: "삭제", danger: true }))) return;
    const res = await fetch(`/api/papers?id=${p.id}`, { method: "DELETE" });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("삭제 실패: " + (result.error || ""));
    toast.success("삭제했습니다.");
    load();
  }

  return (
    <div>
      <Toolbar title="📄 논문" count={`${papers.length}건`}>
        <SearchInput value={search} onChange={setSearch} placeholder="제목 · 저자 · 저널 검색" />
        <Select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: "auto" }}>
          <option value="all">전체 연도</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Button onClick={() => setPanel({ id: null, form: defaultForm() })}><FaPlus size={11} /> 논문 추가</Button>
      </Toolbar>

      <Card tight>
        {isLoading ? <Empty>불러오는 중...</Empty> : visible.length === 0 ? <Empty>{papers.length === 0 ? "등록된 논문이 없습니다." : "검색 결과가 없습니다."}</Empty> : (
          <Table>
            <thead>
              <tr><th style={{ width: 70 }}>연도</th><th>제목 / 저자</th><th style={{ width: 220 }}>저널</th><th style={{ width: 70 }}>언론</th><th style={{ width: 90 }}></th></tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td className={td.muted}>{p.year}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#222", lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.title) }} />
                    <div style={{ fontSize: "0.78rem", color: "#8a94a0", marginTop: 2, lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.authors) }} />
                  </td>
                  <td className={td.muted} style={{ whiteSpace: "normal" }}>{p.journal || "-"}</td>
                  <td>{p.news?.length > 0 ? <Badge color="blue">{p.news.length}</Badge> : <span style={{ color: "#ccc" }}>-</span>}</td>
                  <td className={td.right}>
                    <span className={td.actions}>
                      <Button variant="ghost" size="icon" title="수정" onClick={() => setPanel({ id: p.id, form: formFromPaper(p) })}><FaPen size={11} /></Button>
                      <Button variant="danger" size="icon" title="삭제" onClick={() => remove(p)}><FaTrash size={11} /></Button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <SlidePanel
        open={!!panel}
        title={panel?.id ? "논문 수정" : "논문 추가"}
        onClose={() => !isSaving && setPanel(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setPanel(null)} disabled={isSaving}>취소</Button>
          <Button onClick={save} disabled={isSaving}>{isSaving ? "저장 중..." : "저장"}</Button>
        </>}
      >
        {panel && (
          <FormGrid>
            <Field label="연도" required><Input type="number" value={panel.form.year} onChange={(e) => setF("year", e.target.value)} /></Field>
            <Field label="저널" hint="예: Nature 641, 98-105"><Input value={panel.form.journal} onChange={(e) => setF("journal", e.target.value)} /></Field>
            <Field label="제목" required className={span2}><RichTextInput rows={2} value={panel.form.title} onChange={(v) => setF("title", v)} placeholder="예: Wafer-scale MoS<sub>2</sub> …" /></Field>
            <Field label="저자" required hint="랩 멤버 이름을 선택하고 [멤버] 버튼을 누르면 굵게+밑줄로 표시됩니다" className={span2}><RichTextInput rows={3} value={panel.form.authors} onChange={(v) => setF("authors", v)} /></Field>
            <Field label="논문 URL" hint="DOI 링크 등" className={span2}><Input value={panel.form.url} onChange={(e) => setF("url", e.target.value)} placeholder="https://doi.org/…" /></Field>
            <div className={span2}>
              <div style={{ fontSize: "0.78rem", color: "#5b6b7c", fontWeight: 600, marginBottom: 6 }}>언론 보도 (선택)</div>
              {panel.form.news.map((n, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <Input placeholder="매체명" value={n.name} onChange={(e) => setNews(i, "name", e.target.value)} style={{ width: 150 }} />
                  <Input placeholder="URL" value={n.url} onChange={(e) => setNews(i, "url", e.target.value)} />
                  <Button variant="danger" size="icon" onClick={() => setF("news", panel.form.news.filter((_, j) => j !== i))}><FaTrash size={11} /></Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setF("news", [...panel.form.news, { name: "", url: "" }])}><FaPlus size={10} /> 언론 링크 추가</Button>
            </div>
          </FormGrid>
        )}
      </SlidePanel>
    </div>
  );
}
