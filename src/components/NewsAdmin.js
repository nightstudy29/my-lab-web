"use client";

// 뉴스 관리 — 검색/연도/카테고리 필터 + 표(썸네일), 추가·수정은 슬라이드 패널 (사진 드래그 업로드, 순서 지정).

import { useState, useEffect, useMemo } from "react";
import { FaPen, FaTrash, FaPlus, FaImage } from "react-icons/fa6";
import { supabase } from "@/lib/supabaseClient";
import FileUploader from "./FileUploader";
import { itemsFromUrls, uploadItems } from "@/lib/uploadClient";
import {
  Button, Input, Select, Textarea, Field, Card, Toolbar, SearchInput, Table, td, Badge, Empty, FormGrid, span2,
  SlidePanel, useToast, useConfirm,
} from "./ui";

const CATEGORY_OPTIONS = ["Announcement", "Award", "Paper Accepted", "Group Outing", "Event"];
const CATEGORY_COLOR = { Announcement: "red", Award: "orange", "Paper Accepted": "blue", "Group Outing": "green", Event: "green" };

function defaultForm() {
  return { date: new Date().toISOString().slice(0, 10), category: "Announcement", title: "", description: "", link: "", images: [] };
}
function formFromNews(n) {
  return { date: n.date, category: n.category, title: n.title, description: n.description, link: n.link || "", images: itemsFromUrls(n.images || []) };
}

export default function NewsAdmin() {
  const toast = useToast();
  const confirm = useConfirm();

  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [category, setCategory] = useState("all");
  const [panel, setPanel] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("news").select("*").order("date", { ascending: false });
    setNewsList(data || []);
    setIsLoading(false);
  }

  const years = useMemo(() => [...new Set(newsList.map((n) => (n.date || "").slice(0, 4)).filter(Boolean))].sort((a, b) => b - a), [newsList]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return newsList.filter((n) =>
      (year === "all" || (n.date || "").startsWith(year)) && (category === "all" || n.category === category) &&
      (!q || [n.title, n.description].some((v) => (v || "").toLowerCase().includes(q)))
    );
  }, [newsList, search, year, category]);

  const setF = (k, v) => setPanel((p) => ({ ...p, form: { ...p.form, [k]: v } }));

  async function save() {
    const f = panel.form;
    if (!f.title.trim()) return toast.error("제목을 입력해주세요.");
    if (!f.description.trim()) return toast.error("내용을 입력해주세요.");
    setIsSaving(true);
    try {
      // 새 사진은 R2에 직접 업로드 (장변 2000px 리사이즈). 진행률은 패널 안에 표시됨.
      const uploaded = await uploadItems(f.images, {
        folder: "news", resizeImages: true,
        onItemsChange: (items) => setPanel((p) => (p ? { ...p, form: { ...p.form, images: items } } : p)),
      });
      const payload = {
        date: f.date, category: f.category, title: f.title.trim(), description: f.description.trim(),
        link: f.link.trim() || null, images: uploaded.map((it) => it.url),
      };
      const res = await fetch("/api/news", {
        method: panel.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(panel.id ? { id: panel.id, ...payload } : payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "저장 실패");
      toast.success(panel.id ? "뉴스를 수정했습니다." : "뉴스를 추가했습니다. 홈과 News 페이지에 바로 반영됩니다.");
      setPanel(null);
      load();
    } catch (e) {
      toast.error("실패: " + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(n) {
    if (!(await confirm({ title: "뉴스 삭제", message: `"${n.title}"\n첨부된 사진 ${n.images?.length || 0}장도 함께 삭제됩니다.`, confirmText: "삭제", danger: true }))) return;
    const res = await fetch(`/api/news?id=${n.id}`, { method: "DELETE" });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("삭제 실패: " + (result.error || ""));
    toast.success("삭제했습니다.");
    load();
  }

  return (
    <div>
      <Toolbar title="📰 뉴스" count={`${newsList.length}건`}>
        <SearchInput value={search} onChange={setSearch} placeholder="제목 · 내용 검색" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "auto" }}>
          <option value="all">전체 카테고리</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: "auto" }}>
          <option value="all">전체 연도</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Button onClick={() => setPanel({ id: null, form: defaultForm() })}><FaPlus size={11} /> 뉴스 추가</Button>
      </Toolbar>

      <Card tight>
        {isLoading ? <Empty>불러오는 중...</Empty> : visible.length === 0 ? <Empty>{newsList.length === 0 ? "등록된 뉴스가 없습니다." : "검색 결과가 없습니다."}</Empty> : (
          <Table>
            <thead>
              <tr><th style={{ width: 110 }}>날짜</th><th>제목</th><th style={{ width: 130 }}>카테고리</th><th style={{ width: 60 }}>사진</th><th style={{ width: 90 }}></th></tr>
            </thead>
            <tbody>
              {visible.map((n) => (
                <tr key={n.id}>
                  <td className={td.muted}>{n.date}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {n.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element -- 관리자 목록 썸네일
                        <img src={n.images[0]} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, flexShrink: 0, background: "#f1f3f5" }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 6, background: "#f1f3f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#c5ccd6", flexShrink: 0 }}><FaImage /></div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</div>
                        <div style={{ fontSize: "0.78rem", color: "#8a94a0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480 }}>{n.description}</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge color={CATEGORY_COLOR[n.category] || "gray"}>{n.category}</Badge></td>
                  <td className={td.muted}>{n.images?.length > 0 ? `${n.images.length}장` : "-"}</td>
                  <td className={td.right}>
                    <span className={td.actions}>
                      <Button variant="ghost" size="icon" title="수정" onClick={() => setPanel({ id: n.id, form: formFromNews(n) })}><FaPen size={11} /></Button>
                      <Button variant="danger" size="icon" title="삭제" onClick={() => remove(n)}><FaTrash size={11} /></Button>
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
        title={panel?.id ? "뉴스 수정" : "뉴스 추가"}
        onClose={() => !isSaving && setPanel(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setPanel(null)} disabled={isSaving}>취소</Button>
          <Button onClick={save} disabled={isSaving}>{isSaving ? "저장 중..." : "저장"}</Button>
        </>}
      >
        {panel && (
          <FormGrid>
            <Field label="날짜" required><Input type="date" value={panel.form.date} onChange={(e) => setF("date", e.target.value)} /></Field>
            <Field label="카테고리" required>
              <Select value={panel.form.category} onChange={(e) => setF("category", e.target.value)}>
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="제목" required className={span2}><Input value={panel.form.title} onChange={(e) => setF("title", e.target.value)} /></Field>
            <Field label="내용" required className={span2}><Textarea rows={5} value={panel.form.description} onChange={(e) => setF("description", e.target.value)} /></Field>
            <Field label="관련 링크" className={span2}><Input value={panel.form.link} onChange={(e) => setF("link", e.target.value)} placeholder="https://…" /></Field>
            <Field label="사진" hint="위에서부터 표시 순서. 큰 사진은 자동으로 장변 2000px로 줄여서 올라갑니다." className={span2}>
              <FileUploader items={panel.form.images} onChange={(items) => setF("images", items)} accept="image/*" multiple disabled={isSaving} />
            </Field>
          </FormGrid>
        )}
      </SlidePanel>
    </div>
  );
}
