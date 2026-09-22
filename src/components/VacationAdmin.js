"use client";

// 휴가 관리 (admin) — 연도별 7일 체크 + 메모. (/api/admin/vacations)

import { useState, useEffect } from "react";
import * as FaIcons from "react-icons/fa";
import { POSITION_LABELS_KO } from "@/lib/memberConstants";

export default function VacationAdmin({ mobile }) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [memoDraft, setMemoDraft] = useState({}); // memberId -> 입력 중인 메모

  // 로딩 표시는 연도 select 핸들러에서 켜고, 여기서는 결과만 반영
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/vacations?year=${year}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { setRows(d.rows || []); setMemoDraft({}); } })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [year]);

  async function patch(memberId, body) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/vacations", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, year, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장 실패");
      setRows((prev) => prev.map((r) => (r.memberId === memberId ? { ...r, days: data.row.days, memo: data.row.memo } : r)));
    } catch (e) {
      alert("실패: " + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  const toggleDay = (memberId, dayIndex) => {
    // 낙관적 반영
    setRows((prev) => prev.map((r) => (r.memberId === memberId ? { ...r, days: r.days.map((d, i) => (i === dayIndex ? !d : d)) } : r)));
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
        <h3 style={{ margin: 0, color: "#333", display: "flex", alignItems: "center", gap: "8px" }}>
          <FaIcons.FaPlane size={20} color="#004094" /> 연구원 휴가 관리
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isSaving && <span style={{ fontSize: "0.85rem", color: "#004094", fontWeight: "bold" }}>💾 Saving...</span>}
          <select value={year} onChange={(e) => { setIsLoading(true); setYear(Number(e.target.value)); }} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.9rem" }}>
            {[thisYear + 1, thisYear, thisYear - 1, thisYear - 2].map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>데이터 로딩 중...</div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Active 상태의 연구원이 없습니다.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {rows.map((r) => {
            const used = r.days.filter(Boolean).length;
            const remain = 7 - used;
            return (
              <div key={r.memberId} style={{ padding: "16px", background: "#fff", border: "1px solid #e9ecef", borderRadius: "12px", borderTop: remain === 0 ? "4px solid #d32f2f" : "4px solid #4dabf7", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div>
                    <span style={{ fontSize: "1rem", fontWeight: "bold", color: "#333" }}>{r.nameKor}</span>
                    <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "6px" }}>{POSITION_LABELS_KO[r.position] || r.position}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: remain === 0 ? "#d32f2f" : "#004094", whiteSpace: "nowrap", marginLeft: "8px" }}>
                    {remain}일 남음 <span style={{ fontWeight: "normal", color: "#999", fontSize: "0.75rem" }}>({used}/7)</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
                  {r.days.map((checked, i) => (
                    <button key={i} type="button" onClick={() => toggleDay(r.memberId, i)} aria-label={`${i + 1}일차 ${checked ? "사용" : "미사용"}`}
                      style={{ flex: 1, height: "40px", backgroundColor: checked ? "#4dabf7" : "#fff", border: checked ? "2px solid #4dabf7" : "2px solid #dee2e6", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "all 0.2s" }}>
                      {checked && <FaIcons.FaCheck size={12} />}
                    </button>
                  ))}
                </div>
                <input type="text" placeholder="휴가일자 기록 (예: 8/15-18)"
                  value={memoDraft[r.memberId] ?? r.memo}
                  onChange={(e) => setMemoDraft((p) => ({ ...p, [r.memberId]: e.target.value }))}
                  onBlur={() => saveMemo(r.memberId)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #eee", background: "#f8f9fa", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", color: "#555" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
