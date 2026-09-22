"use client";

// 특허 관리 — 검색/연도/구분 필터 + 표, 추가·수정은 슬라이드 패널.

import { useState, useEffect, useMemo } from "react";
import { FaPen, FaTrash, FaPlus } from "react-icons/fa6";
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/apiClient";
import {
  Button, Input, Select, Field, Card, Toolbar, SearchInput, Table, td, Badge, Empty, FormGrid, span2, Segment,
  SlidePanel, useToast, useConfirm,
} from "./ui";

function defaultForm() {
  return { year: new Date().getFullYear(), title: "", koreanTitle: "", inventors: "", type: "Application", applicationDate: "", applicationNumber: "", registrationDate: "", registrationNumber: "", url: "" };
}
function formFromPatent(p) {
  return {
    year: p.year, title: p.title, koreanTitle: p.korean_title || "", inventors: p.inventors, type: p.type,
    applicationDate: p.application_date || "", applicationNumber: p.application_number || "",
    registrationDate: p.registration_date || "", registrationNumber: p.registration_number || "", url: p.url || "",
  };
}

export default function PatentsAdmin() {
  const toast = useToast();
  const confirm = useConfirm();

  const [patents, setPatents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [type, setType] = useState("all");
  const [panel, setPanel] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("patents").select("*").order("seq", { ascending: false });
    setPatents(data || []);
    setIsLoading(false);
  }

  const years = useMemo(() => [...new Set(patents.map((p) => String(p.year)))].sort((a, b) => b - a), [patents]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patents.filter((p) =>
      (year === "all" || String(p.year) === year) && (type === "all" || p.type === type) &&
      (!q || [p.title, p.korean_title, p.inventors, p.application_number, p.registration_number].some((v) => (v || "").toLowerCase().includes(q)))
    );
  }, [patents, search, year, type]);

  const setF = (k, v) => setPanel((p) => ({ ...p, form: { ...p.form, [k]: v } }));

  async function save() {
    const f = panel.form;
    if (!f.title.trim()) return toast.error("제목을 입력해주세요.");
    if (!f.inventors.trim()) return toast.error("발명자를 입력해주세요.");
    if (!f.year) return toast.error("연도를 입력해주세요.");
    setIsSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
      await apiFetch("/api/patents", { method: panel.id ? "PATCH" : "POST", body: panel.id ? { id: panel.id, ...payload } : payload });
      toast.success(panel.id ? "특허를 수정했습니다." : "특허를 추가했습니다.");
      setPanel(null);
      load();
    } catch (e) {
      toast.error("실패: " + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(p) {
    if (!(await confirm({ title: "특허 삭제", message: `"${p.title}"\n삭제하면 되돌릴 수 없습니다.`, confirmText: "삭제", danger: true }))) return;
    try { await apiFetch(`/api/patents?id=${p.id}`, { method: "DELETE" }); toast.success("삭제했습니다."); load(); }
    catch (e) { toast.error("삭제 실패: " + e.message); }
  }

  const isReg = panel?.form.type === "Registered";

  return (
    <div>
      <Toolbar title="💡 특허" count={`${patents.length}건`}>
        <Segment value={type} onChange={setType} options={[["all", "전체"], ["Application", "출원"], ["Registered", "등록"]]} />
        <SearchInput value={search} onChange={setSearch} placeholder="제목 · 발명자 · 번호 검색" />
        <Select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: "auto" }}>
          <option value="all">전체 연도</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Button onClick={() => setPanel({ id: null, form: defaultForm() })}><FaPlus size={11} /> 특허 추가</Button>
      </Toolbar>

      <Card tight>
        {isLoading ? <Empty>불러오는 중...</Empty> : visible.length === 0 ? <Empty>{patents.length === 0 ? "등록된 특허가 없습니다." : "검색 결과가 없습니다."}</Empty> : (
          <Table>
            <thead>
              <tr><th style={{ width: 70 }}>연도</th><th>제목 / 발명자</th><th style={{ width: 80 }}>구분</th><th style={{ width: 200 }}>번호</th><th style={{ width: 90 }}></th></tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td className={td.muted}>{p.year}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#222", lineHeight: 1.4 }}>{p.title}</div>
                    {p.korean_title && <div style={{ fontSize: "0.78rem", color: "#666", marginTop: 1 }}>{p.korean_title}</div>}
                    <div style={{ fontSize: "0.78rem", color: "#8a94a0", marginTop: 2 }}>{p.inventors}</div>
                  </td>
                  <td><Badge color={p.type === "Registered" ? "green" : "orange"}>{p.type === "Registered" ? "등록" : "출원"}</Badge></td>
                  <td className={td.muted} style={{ whiteSpace: "normal", lineHeight: 1.5 }}>
                    {p.application_number && <div>출원 {p.application_number}</div>}
                    {p.registration_number && <div>등록 {p.registration_number}</div>}
                  </td>
                  <td className={td.right}>
                    <span className={td.actions}>
                      <Button variant="ghost" size="icon" title="수정" onClick={() => setPanel({ id: p.id, form: formFromPatent(p) })}><FaPen size={11} /></Button>
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
        title={panel?.id ? "특허 수정" : "특허 추가"}
        onClose={() => !isSaving && setPanel(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setPanel(null)} disabled={isSaving}>취소</Button>
          <Button onClick={save} disabled={isSaving}>{isSaving ? "저장 중..." : "저장"}</Button>
        </>}
      >
        {panel && (
          <FormGrid>
            <Field label="연도" required><Input type="number" value={panel.form.year} onChange={(e) => setF("year", e.target.value)} /></Field>
            <Field label="구분" required>
              <Select value={panel.form.type} onChange={(e) => setF("type", e.target.value)}>
                <option value="Application">Application (출원)</option>
                <option value="Registered">Registered (등록)</option>
              </Select>
            </Field>
            <Field label="제목 (영문)" required className={span2}><Input value={panel.form.title} onChange={(e) => setF("title", e.target.value)} /></Field>
            <Field label="제목 (한글)" className={span2}><Input value={panel.form.koreanTitle} onChange={(e) => setF("koreanTitle", e.target.value)} /></Field>
            <Field label="발명자" required hint="예: H. W. Jang, J. M. Suh" className={span2}><Input value={panel.form.inventors} onChange={(e) => setF("inventors", e.target.value)} /></Field>
            <Field label="출원일" hint="예: Jan 8, 2019"><Input value={panel.form.applicationDate} onChange={(e) => setF("applicationDate", e.target.value)} /></Field>
            <Field label="출원번호" hint="예: 10-2019-0002101"><Input value={panel.form.applicationNumber} onChange={(e) => setF("applicationNumber", e.target.value)} /></Field>
            <Field label="등록일" hint={isReg ? "" : "등록된 경우만"}><Input value={panel.form.registrationDate} onChange={(e) => setF("registrationDate", e.target.value)} disabled={!isReg} /></Field>
            <Field label="등록번호" hint={isReg ? "" : "등록된 경우만"}><Input value={panel.form.registrationNumber} onChange={(e) => setF("registrationNumber", e.target.value)} disabled={!isReg} /></Field>
            <Field label="URL" hint="없으면 비워두세요" className={span2}><Input value={panel.form.url} onChange={(e) => setF("url", e.target.value)} placeholder="https://…" /></Field>
          </FormGrid>
        )}
      </SlidePanel>
    </div>
  );
}
