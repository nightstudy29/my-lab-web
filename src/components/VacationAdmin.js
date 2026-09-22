"use client";

// 휴가 관리 (admin) — 연도별 7일 체크 + 메모. (/api/admin/vacations)

import { useState, useEffect } from "react";
import { FaPlaneDeparture, FaCheck } from "react-icons/fa6";
import { apiFetch } from "@/lib/apiClient";
import { POSITION_LABELS_KO } from "@/lib/memberConstants";
import { Select, Card, Toolbar, Input, Empty, useToast } from "./ui";

export default function VacationAdmin({ mobile }) {
  const toast = useToast();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [memoDraft, setMemoDraft] = useState({}); // memberId -> 입력 중인 메모

  // 로딩 표시는 연도 select 핸들러에서 켜고, 여기서는 결과만 반영
  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/admin/vacations?year=${year}`)
      .then((d) => { if (!cancelled) { setRows(d.rows || []); setMemoDraft({}); } })
      .catch((e) => { if (!cancelled) toast.error(e.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [year, toast]);

  async function patch(memberId, body) {
    setIsSaving(true);
    try {
      const { row } = await apiFetch("/api/admin/vacations", { method: "PATCH", body: { memberId, year, ...body } });
      setRows((prev) => prev.map((r) => (r.memberId === memberId ? { ...r, days: row.days, memo: row.memo } : r)));
    } catch (e) {
      toast.error("실패: " + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  const toggleDay = (memberId, dayIndex) => {
    setRows((prev) => prev.map((r) => (r.memberId === memberId ? { ...r, days: r.days.map((d, i) => (i === dayIndex ? !d : d)) } : r))); // 낙관적 반영
    patch(memberId, { dayIndex });
  };
  const saveMemo = (memberId) => {
    const draft = memoDraft[memberId];
    const row = rows.find((r) => r.memberId === memberId);
    if (draft === undefined || draft === row?.memo) return;
    patch(memberId, { memo: draft });
  };

  return (
    <div>
      <Toolbar title={<><FaPlaneDeparture size={16} color="#004094" /> 연구원 휴가 관리</>}>
        {isSaving && <span style={{ fontSize: "0.8rem", color: "#004094", fontWeight: 600 }}>저장 중…</span>}
        <Select value={year} onChange={(e) => { setIsLoading(true); setYear(Number(e.target.value)); }} style={{ width: "auto" }}>
          {[thisYear + 1, thisYear, thisYear - 1, thisYear - 2].map((y) => <option key={y} value={y}>{y}년</option>)}
        </Select>
      </Toolbar>

      {isLoading ? <Card><Empty>불러오는 중...</Empty></Card> : rows.length === 0 ? <Card><Empty>Active 상태의 연구원이 없습니다.</Empty></Card> : (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          {rows.map((r) => {
            const used = r.days.filter(Boolean).length;
            const remain = 7 - used;
            return (
              <Card key={r.memberId} style={{ padding: "14px 16px", borderTop: `3px solid ${remain === 0 ? "#d32f2f" : "#4dabf7"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "#222" }}>{r.nameKor}</span>
                    <span style={{ fontSize: "0.75rem", color: "#8a94a0", marginLeft: 6 }}>{POSITION_LABELS_KO[r.position] || r.position}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: remain === 0 ? "#d32f2f" : "#004094", whiteSpace: "nowrap" }}>
                    {remain}일 남음 <span style={{ fontWeight: 400, color: "#a5adb8", fontSize: "0.75rem" }}>({used}/7)</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                  {r.days.map((checked, i) => (
                    <button key={i} type="button" onClick={() => toggleDay(r.memberId, i)} aria-label={`${i + 1}일차 ${checked ? "사용" : "미사용"}`}
                      style={{ flex: 1, height: 36, background: checked ? "#4dabf7" : "#fff", border: `2px solid ${checked ? "#4dabf7" : "#dee2e6"}`, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "all 0.15s" }}>
                      {checked && <FaCheck size={11} />}
                    </button>
                  ))}
                </div>
                <Input placeholder="휴가일자 기록 (예: 8/15-18)" value={memoDraft[r.memberId] ?? r.memo}
                  onChange={(e) => setMemoDraft((p) => ({ ...p, [r.memberId]: e.target.value }))}
                  onBlur={() => saveMemo(r.memberId)} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
