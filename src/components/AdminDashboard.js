"use client";

// Admin 첫 화면 — 처리할 일(승인 대기·수정 요청)과 콘텐츠 건수 요약. 카드를 누르면 해당 메뉴로 이동.

import { useState, useEffect } from "react";
import { FaUserClock, FaClipboardList, FaFileLines, FaLightbulb, FaNewspaper, FaUsers, FaBookOpen } from "react-icons/fa6";
import { supabase } from "@/lib/supabaseClient";
import { ROLE_LABELS } from "@/lib/roles";

export default function AdminDashboard({ user, pendingCount, requestsCount, onNavigate, mobile }) {
  const isAdmin = user.role === "admin";
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const count = (table, filter) => {
        let q = supabase.from(table).select("*", { count: "exact", head: true });
        if (filter) q = filter(q);
        return q.then((r) => r.count ?? 0);
      };
      const [papers, patents, news, semesters] = await Promise.all([
        count("papers"), count("patents"), count("news"),
        count("semesters", (q) => q.eq("is_current", true)),
      ]);
      let members = null;
      if (isAdmin) {
        const r = await fetch("/api/members?status=active").then((x) => x.json()).catch(() => ({}));
        members = r.members?.length ?? null;
      }
      if (!cancelled) setCounts({ papers, patents, news, hasSemester: semesters > 0, members });
    })();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const todo = isAdmin ? [
    { id: "approvals", icon: <FaUserClock />, label: "가입 승인 대기", value: pendingCount, urgent: pendingCount > 0 },
    { id: "requests", icon: <FaClipboardList />, label: "수정 요청", value: requestsCount, urgent: requestsCount > 0 },
  ] : [];

  const content = [
    { id: "papers", icon: <FaFileLines />, label: "논문", value: counts?.papers },
    { id: "patents", icon: <FaLightbulb />, label: "특허", value: counts?.patents },
    { id: "news", icon: <FaNewspaper />, label: "뉴스", value: counts?.news },
    ...(isAdmin ? [
      { id: "directory", icon: <FaUsers />, label: "Active 멤버", value: counts?.members },
      { id: "classmaterial", icon: <FaBookOpen />, label: "강의자료", value: counts ? (counts.hasSemester ? "현재 학기 설정됨" : "학기 없음") : undefined, text: true },
    ] : []),
  ];

  const Card = ({ item }) => (
    <button onClick={() => onNavigate(item.id)} style={{
      textAlign: "left", background: "#fff", border: `1px solid ${item.urgent ? "#ffd9a8" : "#e9ecef"}`,
      borderRadius: "12px", padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.03)", font: "inherit",
    }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: item.urgent ? "#fff4e5" : "#eef4ff", color: item.urgent ? "#b26a00" : "#004094", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
        {item.icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.8rem", color: "#777" }}>{item.label}</div>
        <div style={{ fontSize: item.text ? "0.95rem" : "1.5rem", fontWeight: 800, color: item.urgent ? "#b26a00" : "#222", lineHeight: 1.2 }}>
          {item.value === undefined ? <span style={{ color: "#ccc" }}>…</span> : item.value}
        </div>
      </div>
    </button>
  );

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "0.85rem", color: "#888" }}>{new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</div>
        <h3 style={{ margin: "4px 0 0", color: "#222" }}>{user.name} {ROLE_LABELS[user.role]}님, 안녕하세요</h3>
      </div>

      {todo.length > 0 && (
        <>
          <div style={sectionLabel}>처리할 일</div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            {todo.map((it) => <Card key={it.id} item={it} />)}
          </div>
        </>
      )}

      <div style={sectionLabel}>콘텐츠</div>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
        {content.map((it) => <Card key={it.id} item={it} />)}
      </div>
    </div>
  );
}

const sectionLabel = { fontSize: "0.75rem", fontWeight: 700, color: "#999", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px" };
