"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { boxStyle, inputStyle, primaryBtn, secondaryBtnSmall, dangerBtnSmall } from "./adminStyles";
import FileUploader from "./FileUploader";
import { itemsFromUrls, uploadItems } from "@/lib/uploadClient";

const CATEGORY_OPTIONS = ["Announcement", "Award", "Paper Accepted", "Group Outing", "Event"];

function defaultForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    category: "Announcement",
    title: "",
    description: "",
    link: "",
    // FileUploader item 배열. 순서 = 페이지에 표시되는 순서.
    // 수정 모드에서는 기존 사진(kind:'existing')이 먼저 채워지고, 새 파일(kind:'new')을 섞어 넣을 수 있음.
    images: [],
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
    images: itemsFromUrls(n.images || []),
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
      // 새로 추가한 사진들을 R2에 직접 업로드 (진행률은 form.images에 실시간 반영됨).
      // 이미지는 장변 2000px / JPEG 85% 로 자동 리사이즈.
      const uploaded = await uploadItems(form.images, {
        folder: "news",
        resizeImages: true,
        onItemsChange: (items) => setForm((prev) => ({ ...prev, images: items })),
      });

      const payload = {
        date: form.date,
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        link: form.link.trim() || null,
        images: uploaded.map((it) => it.url), // 화면에 보이는 순서 그대로 저장
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

          {/* 사진 — 드래그앤드롭, 순서 변경, 진행률 */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "6px" }}>
              사진 (여러 장 가능 · 위에서부터 순서대로 표시됩니다)
            </div>
            <FileUploader
              items={form.images}
              onChange={(items) => updateField("images", items)}
              accept="image/*"
              multiple
              disabled={form.isSubmitting}
              hint="큰 사진은 자동으로 장변 2000px로 줄여서 올라갑니다 (용량 제한 없음)"
            />
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
          <div key={n.id} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f3f5", gap: "12px" }}>
            {n.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element -- 관리자 목록 썸네일
              <img src={n.images[0]} alt="" style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px", flexShrink: 0, background: "#f1f3f5" }} />
            ) : (
              <div style={{ width: "48px", height: "48px", borderRadius: "6px", background: "#f1f3f5", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.85rem", color: "#888" }}>
                {n.date} · {n.category} {n.images?.length > 0 && `· 사진 ${n.images.length}장`}
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</div>
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
