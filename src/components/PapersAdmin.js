"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

function emptyNewsRow() {
  return { name: "", url: "" };
}

function defaultForm() {
  return {
    year: new Date().getFullYear(),
    title: "",
    authors: "",
    journal: "",
    url: "",
    news: [],
    isSubmitting: false,
  };
}

function formFromPaper(p) {
  return {
    year: p.year,
    title: p.title,
    authors: p.authors,
    journal: p.journal || "",
    url: p.url || "",
    news: p.news && p.news.length > 0 ? p.news : [],
    isSubmitting: false,
  };
}

export default function PapersAdmin() {
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(defaultForm());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null이면 "새로 추가" 모드

  useEffect(() => {
    loadPapers();
  }, []);

  async function loadPapers() {
    setIsLoading(true);
    const { data } = await supabase
      .from("papers")
      .select("*")
      .order("seq", { ascending: false });
    setPapers(data || []);
    setIsLoading(false);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateNewsRow(index, field, value) {
    setForm((prev) => {
      const news = [...prev.news];
      news[index] = { ...news[index], [field]: value };
      return { ...prev, news };
    });
  }

  function addNewsRow() {
    setForm((prev) => ({ ...prev, news: [...prev.news, emptyNewsRow()] }));
  }

  function removeNewsRow(index) {
    setForm((prev) => ({ ...prev, news: prev.news.filter((_, i) => i !== index) }));
  }

  function openAddForm() {
    setEditingId(null);
    setForm(defaultForm());
    setShowForm(true);
  }

  function openEditForm(paper) {
    setEditingId(paper.id);
    setForm(formFromPaper(paper));
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm());
  }

  async function handleSavePaper() {
    if (!form.title.trim()) return alert("제목을 입력해주세요.");
    if (!form.authors.trim()) return alert("저자를 입력해주세요.");
    if (!form.year) return alert("연도를 입력해주세요.");

    updateField("isSubmitting", true);

    try {
      const cleanedNews = form.news.filter((n) => n.name.trim() && n.url.trim());
      const payload = {
        year: form.year,
        title: form.title.trim(),
        authors: form.authors.trim(),
        journal: form.journal.trim(),
        url: form.url.trim(),
        news: cleanedNews,
      };

      const res = await fetch("/api/papers", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "저장 실패");

      closeForm();
      loadPapers();
    } catch (err) {
      alert("실패: " + err.message);
      updateField("isSubmitting", false);
    }
  }

  async function handleDeletePaper(id, title) {
    if (!confirm(`"${title}" 논문을 삭제하시겠습니까?`)) return;

    const res = await fetch(`/api/papers?id=${id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) return alert("실패: " + result.error);

    loadPapers();
  }

  if (isLoading) return <p style={{ color: "#888" }}>불러오는 중...</p>;

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ color: "#333", margin: 0 }}>📄 논문 관리 ({papers.length}건)</h3>
        <button onClick={showForm ? closeForm : openAddForm} style={primaryBtn}>
          {showForm ? "취소" : "+ 새 논문 추가"}
        </button>
      </div>

      {/* ===== 추가/수정 폼 ===== */}
      {showForm && (
        <div style={boxStyle}>
          <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: "8px" }}>
            {editingId ? "논문 수정 중" : "새 논문 추가"}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            <input
              type="number"
              placeholder="연도"
              value={form.year}
              onChange={(e) => updateField("year", e.target.value)}
              style={{ ...inputStyle, width: "100px" }}
            />
            <input
              type="text"
              placeholder="저널명 (예: Nature 641, 98-105)"
              value={form.journal}
              onChange={(e) => updateField("journal", e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: "200px" }}
            />
          </div>

          <input
            type="text"
            placeholder="논문 제목 (아래첨자는 <sub>...</sub> 태그 사용 가능)"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            style={{ ...inputStyle, width: "100%", marginBottom: "10px", boxSizing: "border-box" }}
          />

          <textarea
            placeholder="저자 (본인/랩 멤버 이름은 <b><u>이름</u></b>으로 감싸면 굵게+밑줄로 표시됩니다)"
            value={form.authors}
            onChange={(e) => updateField("authors", e.target.value)}
            style={{ ...inputStyle, width: "100%", height: "70px", marginBottom: "10px", boxSizing: "border-box", resize: "vertical" }}
          />

          <input
            type="text"
            placeholder="논문 URL (DOI 링크 등)"
            value={form.url}
            onChange={(e) => updateField("url", e.target.value)}
            style={{ ...inputStyle, width: "100%", marginBottom: "10px", boxSizing: "border-box" }}
          />

          {/* 언론 보도 (선택) */}
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "6px" }}>언론 보도 링크 (선택)</div>
            {form.news.map((row, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                <input
                  type="text"
                  placeholder="매체명 (예: MIT News)"
                  value={row.name}
                  onChange={(e) => updateNewsRow(i, "name", e.target.value)}
                  style={{ ...inputStyle, width: "150px" }}
                />
                <input
                  type="text"
                  placeholder="URL"
                  value={row.url}
                  onChange={(e) => updateNewsRow(i, "url", e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={() => removeNewsRow(i)} style={dangerBtnSmall}>삭제</button>
              </div>
            ))}
            <button onClick={addNewsRow} style={secondaryBtnSmall}>+ 언론 링크 추가</button>
          </div>

          <button
            onClick={handleSavePaper}
            disabled={form.isSubmitting}
            style={{ ...primaryBtn, opacity: form.isSubmitting ? 0.6 : 1 }}
          >
            {form.isSubmitting ? "저장 중..." : editingId ? "수정 저장" : "논문 저장"}
          </button>
        </div>
      )}

      {/* ===== 논문 목록 ===== */}
      <div style={boxStyle}>
        {papers.map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f1f3f5", gap: "10px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.85rem", color: "#888" }}>{p.year} · {p.journal}</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "bold" }} dangerouslySetInnerHTML={{ __html: p.title }} />
            </div>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button onClick={() => openEditForm(p)} style={secondaryBtnSmall}>수정</button>
              <button onClick={() => handleDeletePaper(p.id, p.title.replace(/<[^>]+>/g, ""))} style={dangerBtnSmall}>삭제</button>
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