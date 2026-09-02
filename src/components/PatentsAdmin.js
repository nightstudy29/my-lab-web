"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

function defaultForm() {
  return {
    year: new Date().getFullYear(),
    title: "",
    koreanTitle: "",
    inventors: "",
    type: "Application",
    applicationDate: "",
    applicationNumber: "",
    registrationDate: "",
    registrationNumber: "",
    url: "",
    isSubmitting: false,
  };
}

function formFromPatent(p) {
  return {
    year: p.year,
    title: p.title,
    koreanTitle: p.korean_title || "",
    inventors: p.inventors,
    type: p.type,
    applicationDate: p.application_date || "",
    applicationNumber: p.application_number || "",
    registrationDate: p.registration_date || "",
    registrationNumber: p.registration_number || "",
    url: p.url || "",
    isSubmitting: false,
  };
}

export default function PatentsAdmin() {
  const [patents, setPatents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(defaultForm());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadPatents();
  }, []);

  async function loadPatents() {
    setIsLoading(true);
    const { data } = await supabase
      .from("patents")
      .select("*")
      .order("seq", { ascending: false });
    setPatents(data || []);
    setIsLoading(false);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function openAddForm() {
    setEditingId(null);
    setForm(defaultForm());
    setShowForm(true);
  }

  function openEditForm(patent) {
    setEditingId(patent.id);
    setForm(formFromPatent(patent));
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm());
  }

  async function handleSavePatent() {
    if (!form.title.trim()) return alert("제목을 입력해주세요.");
    if (!form.inventors.trim()) return alert("발명자를 입력해주세요.");
    if (!form.year) return alert("연도를 입력해주세요.");

    updateField("isSubmitting", true);

    try {
      const payload = {
        year: form.year,
        title: form.title.trim(),
        koreanTitle: form.koreanTitle.trim(),
        inventors: form.inventors.trim(),
        type: form.type,
        applicationDate: form.applicationDate.trim(),
        applicationNumber: form.applicationNumber.trim(),
        registrationDate: form.registrationDate.trim(),
        registrationNumber: form.registrationNumber.trim(),
        url: form.url.trim(),
      };

      const res = await fetch("/api/patents", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "저장 실패");

      closeForm();
      loadPatents();
    } catch (err) {
      alert("실패: " + err.message);
      updateField("isSubmitting", false);
    }
  }

  async function handleDeletePatent(id, title) {
    if (!confirm(`"${title}" 특허를 삭제하시겠습니까?`)) return;

    const res = await fetch(`/api/patents?id=${id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) return alert("실패: " + result.error);

    loadPatents();
  }

  if (isLoading) return <p style={{ color: "#888" }}>불러오는 중...</p>;

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ color: "#333", margin: 0 }}>💡 특허 관리 ({patents.length}건)</h3>
        <button onClick={showForm ? closeForm : openAddForm} style={primaryBtn}>
          {showForm ? "취소" : "+ 새 특허 추가"}
        </button>
      </div>

      {/* ===== 추가/수정 폼 ===== */}
      {showForm && (
        <div style={boxStyle}>
          <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: "8px" }}>
            {editingId ? "특허 수정 중" : "새 특허 추가"}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            <input
              type="number"
              placeholder="연도"
              value={form.year}
              onChange={(e) => updateField("year", e.target.value)}
              style={{ ...inputStyle, width: "100px" }}
            />
            <select value={form.type} onChange={(e) => updateField("type", e.target.value)} style={inputStyle}>
              <option value="Application">Application (출원)</option>
              <option value="Registered">Registered (등록)</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="제목 (영문)"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            style={{ ...inputStyle, width: "100%", marginBottom: "10px", boxSizing: "border-box" }}
          />

          <input
            type="text"
            placeholder="한글 제목 (선택)"
            value={form.koreanTitle}
            onChange={(e) => updateField("koreanTitle", e.target.value)}
            style={{ ...inputStyle, width: "100%", marginBottom: "10px", boxSizing: "border-box" }}
          />

          <input
            type="text"
            placeholder="발명자 (예: H. W. Jang, J. M. Suh)"
            value={form.inventors}
            onChange={(e) => updateField("inventors", e.target.value)}
            style={{ ...inputStyle, width: "100%", marginBottom: "10px", boxSizing: "border-box" }}
          />

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="출원일 (예: Jan 8, 2019)"
              value={form.applicationDate}
              onChange={(e) => updateField("applicationDate", e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: "160px" }}
            />
            <input
              type="text"
              placeholder="출원번호 (예: 10-2019-0002101)"
              value={form.applicationNumber}
              onChange={(e) => updateField("applicationNumber", e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: "160px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="등록일 (등록된 경우만, 예: Nov 16, 2020)"
              value={form.registrationDate}
              onChange={(e) => updateField("registrationDate", e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: "160px" }}
            />
            <input
              type="text"
              placeholder="등록번호 (등록된 경우만)"
              value={form.registrationNumber}
              onChange={(e) => updateField("registrationNumber", e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: "160px" }}
            />
          </div>

          <input
            type="text"
            placeholder="URL (없으면 비워두세요 → 자동으로 링크 없음 처리)"
            value={form.url}
            onChange={(e) => updateField("url", e.target.value)}
            style={{ ...inputStyle, width: "100%", marginBottom: "10px", boxSizing: "border-box" }}
          />

          <button
            onClick={handleSavePatent}
            disabled={form.isSubmitting}
            style={{ ...primaryBtn, opacity: form.isSubmitting ? 0.6 : 1 }}
          >
            {form.isSubmitting ? "저장 중..." : editingId ? "수정 저장" : "특허 저장"}
          </button>
        </div>
      )}

      {/* ===== 특허 목록 ===== */}
      <div style={boxStyle}>
        {patents.map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f1f3f5", gap: "10px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.85rem", color: "#888" }}>{p.year} · {p.type}</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "bold" }}>{p.title}</div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button onClick={() => openEditForm(p)} style={secondaryBtnSmall}>수정</button>
              <button onClick={() => handleDeletePatent(p.id, p.title)} style={dangerBtnSmall}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const boxStyle = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: "10px",
  padding: "16px",
  marginBottom: "16px",
};

const inputStyle = {
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "0.9rem",
};

const primaryBtn = {
  background: "#004094",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "0.85rem",
  whiteSpace: "nowrap",
};

const secondaryBtnSmall = {
  background: "#e7f5ff",
  color: "#004094",
  border: "none",
  padding: "5px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: "bold",
};

const dangerBtnSmall = {
  background: "#fce8e6",
  color: "#c5221f",
  border: "none",
  padding: "4px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: "bold",
  flexShrink: 0,
};