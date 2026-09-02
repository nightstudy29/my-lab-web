"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const CATEGORY_OPTIONS = ["Announcement", "Award", "Paper Accepted", "Group Outing", "Event"];

function defaultForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    category: "Announcement",
    title: "",
    description: "",
    link: "",
    existingImages: [], // 수정 중일 때, 이미 올라가 있는 이미지 URL들 (개별 삭제 가능)
    newFiles: [], // 새로 추가할 로컬 파일들 (업로드 전)
    isSubmitting: false,
  };
}

function formFromNews(n) {
  return {
    date: n.date,
    category: n.category,
    title: n.title,
    description: n.description,
    link: n.link || "",
    existingImages: n.images || [],
    newFiles: [],
    isSubmitting: false,
  };
}

export default function NewsAdmin() {
  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(defaultForm());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setIsLoading(true);
    const { data } = await supabase
      .from("news")
      .select("*")
      .order("date", { ascending: false });
    setNewsList(data || []);
    setIsLoading(false);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFilesSelected(e) {
    updateField("newFiles", Array.from(e.target.files));
  }

  function removeExistingImage(url) {
    setForm((prev) => ({ ...prev, existingImages: prev.existingImages.filter((u) => u !== url) }));
  }

  function openAddForm() {
    setEditingId(null);
    setForm(defaultForm());
    setShowForm(true);
  }

  function openEditForm(newsItem) {
    setEditingId(newsItem.id);
    setForm(formFromNews(newsItem));
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm());
  }

  async function handleSaveNews() {
    if (!form.title.trim()) return alert("제목을 입력해주세요.");
    if (!form.description.trim()) return alert("내용을 입력해주세요.");

    updateField("isSubmitting", true);

    try {
      // 새로 선택한 이미지 파일들을 R2에 업로드
      const newlyUploadedUrls = [];
      for (const file of form.newFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.error || "이미지 업로드 실패");
        newlyUploadedUrls.push(uploadResult.url);
      }

      // 최종 이미지 배열 = (수정 중이면) 남아있는 기존 이미지 + 새로 올린 이미지
      const finalImages = [...form.existingImages, ...newlyUploadedUrls];

      const payload = {
        date: form.date,
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        link: form.link.trim() || null,
        images: finalImages,
      };

      const res = await fetch("/api/news", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "저장 실패");

      closeForm();
      loadNews();
    } catch (err) {
      alert("실패: " + err.message);
      updateField("isSubmitting", false);
    }
  }

  async function handleDeleteNews(id, title) {
    if (!confirm(`"${title}" 뉴스를 삭제하시겠습니까? 첨부된 이미지도 함께 삭제됩니다.`)) return;

    const res = await fetch(`/api/news?id=${id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) return alert("실패: " + result.error);

    loadNews();
  }

  if (isLoading) return <p style={{ color: "#888" }}>불러오는 중...</p>;

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ color: "#333", margin: 0 }}>📰 뉴스 관리 ({newsList.length}건)</h3>
        <button onClick={showForm ? closeForm : openAddForm} style={primaryBtn}>
          {showForm ? "취소" : "+ 새 뉴스 추가"}
        </button>
      </div>

      {/* ===== 추가/수정 폼 ===== */}
      {showForm && (
        <div style={boxStyle}>
          <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: "8px" }}>
            {editingId ? "뉴스 수정 중" : "새 뉴스 추가"}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              style={inputStyle}
            />
            <select value={form.category} onChange={(e) => updateField("category", e.target.value)} style={inputStyle}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="제목"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            style={{ ...inputStyle, width: "100%", marginBottom: "10px", boxSizing: "border-box" }}
          />

          <textarea
            placeholder="내용"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            style={{ ...inputStyle, width: "100%", height: "80px", marginBottom: "10px", boxSizing: "border-box", resize: "vertical" }}
          />

          <input
            type="text"
            placeholder="관련 링크 (선택)"
            value={form.link}
            onChange={(e) => updateField("link", e.target.value)}
            style={{ ...inputStyle, width: "100%", marginBottom: "10px", boxSizing: "border-box" }}
          />

          {/* 기존 이미지 (수정 모드일 때만) */}
          {editingId && form.existingImages.length > 0 && (
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "6px" }}>기존 사진</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {form.existingImages.map((url) => (
                  <div key={url} style={{ position: "relative" }}>
                    <img src={url} alt="" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid #ddd" }} />
                    <button
                      onClick={() => removeExistingImage(url)}
                      style={{ position: "absolute", top: "-6px", right: "-6px", background: "#c5221f", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", fontSize: "0.7rem", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "6px" }}>
              {editingId ? "사진 추가 (선택, 여러 장 가능)" : "사진 (여러 장 선택 가능)"}
            </div>
            <input type="file" multiple accept="image/*" onChange={handleFilesSelected} style={{ fontSize: "0.85rem" }} />
            {form.newFiles.length > 0 && (
              <div style={{ fontSize: "0.8rem", color: "#888", marginTop: "4px" }}>
                {form.newFiles.length}장 새로 추가됨
              </div>
            )}
          </div>

          <button
            onClick={handleSaveNews}
            disabled={form.isSubmitting}
            style={{ ...primaryBtn, opacity: form.isSubmitting ? 0.6 : 1 }}
          >
            {form.isSubmitting ? "저장 중..." : editingId ? "수정 저장" : "뉴스 저장"}
          </button>
        </div>
      )}

      {/* ===== 뉴스 목록 ===== */}
      <div style={boxStyle}>
        {newsList.map((n) => (
          <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f1f3f5", gap: "10px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.85rem", color: "#888" }}>
                {n.date} · {n.category} {n.images?.length > 0 && `· 사진 ${n.images.length}장`}
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: "bold" }}>{n.title}</div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button onClick={() => openEditForm(n)} style={secondaryBtnSmall}>수정</button>
              <button onClick={() => handleDeleteNews(n.id, n.title)} style={dangerBtnSmall}>삭제</button>
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