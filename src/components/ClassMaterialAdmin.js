"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ClassMaterialAdmin() {
  const [semesters, setSemesters] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [courses, setCourses] = useState([]);
  const [materialsByCourse, setMaterialsByCourse] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [newSemesterLabel, setNewSemesterLabel] = useState("");
  const [newCourseName, setNewCourseName] = useState("");

  // 과목별 "자료 추가" 폼 입력값 (courseId -> form state)
  const [materialForms, setMaterialForms] = useState({});

  // 지금 수정 중인 자료 (materialId -> edit form state). 한 번에 하나만 수정.
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setIsLoading(true);

    const { data: semesterRows } = await supabase
      .from("semesters")
      .select("*")
      .order("created_at", { ascending: false });
    setSemesters(semesterRows || []);

    const current = (semesterRows || []).find((s) => s.is_current) || null;
    setCurrentSemester(current);

    if (current) {
      const { data: courseRows } = await supabase
        .from("courses")
        .select("*")
        .eq("semester_id", current.id)
        .order("sort_order", { ascending: true });
      setCourses(courseRows || []);

      const courseIds = (courseRows || []).map((c) => c.id);
      if (courseIds.length > 0) {
        const { data: materialRows } = await supabase
          .from("materials")
          .select("*")
          .in("course_id", courseIds);
        const grouped = {};
        for (const m of materialRows || []) {
          if (!grouped[m.course_id]) grouped[m.course_id] = [];
          grouped[m.course_id].push(m);
        }
        setMaterialsByCourse(grouped);
      } else {
        setMaterialsByCourse({});
      }
    } else {
      setCourses([]);
      setMaterialsByCourse({});
    }

    setIsLoading(false);
  }

  // ===== 학기 =====
  async function handleCreateSemester() {
    if (!newSemesterLabel.trim()) return alert("학기 이름을 입력해주세요 (예: 2027-1)");
    if (!confirm(`"${newSemesterLabel}" 학기를 새로 시작하시겠습니까? 기존 학기는 비활성화됩니다.`)) return;

    const res = await fetch("/api/semesters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newSemesterLabel.trim() }),
    });
    const result = await res.json();
    if (!res.ok) return alert("실패: " + result.error);

    setNewSemesterLabel("");
    loadAll();
  }

  async function handleDeleteSemester(semesterId, label) {
    if (!confirm(`"${label}" 학기를 완전히 삭제하시겠습니까?\n딸린 과목/자료가 전부 함께 삭제되며 되돌릴 수 없습니다.`)) return;

    const res = await fetch(`/api/semesters?id=${semesterId}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) return alert("실패: " + result.error);

    loadAll();
  }

  async function handleSwitchSemester(semesterId, label) {
    if (!confirm(`"${label}" 학기로 전환하시겠습니까? 학생들에게 이 학기 자료가 보이게 됩니다.`)) return;

    const res = await fetch("/api/semesters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: semesterId }),
    });
    const result = await res.json();
    if (!res.ok) return alert("실패: " + result.error);

    loadAll();
  }

  // ===== 과목 =====
  async function handleAddCourse() {
    if (!newCourseName.trim()) return alert("과목명을 입력해주세요.");
    if (!currentSemester) return alert("먼저 학기를 생성해주세요.");

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        semester_id: currentSemester.id,
        name: newCourseName.trim(),
        sort_order: courses.length,
      }),
    });
    const result = await res.json();
    if (!res.ok) return alert("실패: " + result.error);

    setNewCourseName("");
    loadAll();
  }

  async function handleDeleteCourse(courseId, name) {
    if (!confirm(`"${name}" 과목을 삭제하시겠습니까? 딸린 자료도 함께 삭제됩니다.`)) return;

    const res = await fetch(`/api/courses?id=${courseId}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) return alert("실패: " + result.error);

    loadAll();
  }

  // ===== 자료 추가 =====
  function updateMaterialForm(courseId, field, value) {
    setMaterialForms((prev) => ({
      ...prev,
      [courseId]: { ...(prev[courseId] || defaultMaterialForm()), [field]: value },
    }));
  }

  function defaultMaterialForm() {
    return {
      type: "slide",
      date: new Date().toISOString().slice(0, 10),
      week: "",
      title: "",
      isExternalLink: false,
      externalUrl: "",
      file: null,
      isSubmitting: false,
    };
  }

  async function handleAddMaterial(courseId) {
    const form = materialForms[courseId] || defaultMaterialForm();

    if (!form.title.trim()) return alert("제목을 입력해주세요.");
    if (form.isExternalLink && !form.externalUrl.trim()) return alert("외부 링크 URL을 입력해주세요.");
    if (!form.isExternalLink && !form.file) return alert("파일을 선택해주세요.");

    updateMaterialForm(courseId, "isSubmitting", true);

    try {
      let fileUrl = form.externalUrl.trim();

      if (!form.isExternalLink) {
        const fd = new FormData();
        fd.append("file", form.file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.error || "업로드 실패");
        fileUrl = uploadResult.url;
      }

      const res = await fetch("/api/classmaterials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          type: form.type,
          date: form.date,
          week: form.week ? Number(form.week) : null,
          title: form.title.trim(),
          file_url: fileUrl,
          is_external_link: form.isExternalLink,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "자료 추가 실패");

      setMaterialForms((prev) => ({ ...prev, [courseId]: defaultMaterialForm() }));
      loadAll();
    } catch (err) {
      alert("실패: " + err.message);
      updateMaterialForm(courseId, "isSubmitting", false);
    }
  }

  async function handleDeleteMaterial(materialId, title) {
    if (!confirm(`"${title}" 자료를 삭제하시겠습니까?`)) return;

    const res = await fetch(`/api/classmaterials?id=${materialId}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) return alert("실패: " + result.error);

    loadAll();
  }

  // ===== 자료 수정 =====
  function startEditMaterial(material) {
    setEditingMaterialId(material.id);
    setEditForm({
      type: material.type,
      date: material.date,
      week: material.week ?? "",
      title: material.title,
      is_external_link: material.is_external_link,
      file_url: material.file_url,
      isSubmitting: false,
    });
  }

  function cancelEditMaterial() {
    setEditingMaterialId(null);
    setEditForm(null);
  }

  function updateEditForm(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveEditMaterial() {
    if (!editForm.title.trim()) return alert("제목을 입력해주세요.");

    updateEditForm("isSubmitting", true);

    try {
      const res = await fetch("/api/classmaterials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMaterialId,
          type: editForm.type,
          date: editForm.date,
          week: editForm.week,
          title: editForm.title.trim(),
          is_external_link: editForm.is_external_link,
          file_url: editForm.is_external_link ? editForm.file_url.trim() : undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "수정 실패");

      cancelEditMaterial();
      loadAll();
    } catch (err) {
      alert("실패: " + err.message);
      updateEditForm("isSubmitting", false);
    }
  }

  if (isLoading) return <p style={{ color: "#888" }}>불러오는 중...</p>;

  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ color: "#333", marginBottom: "16px" }}>📚 강의자료 관리</h3>

      {/* ===== 학기 관리 ===== */}
      <div style={boxStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <strong>현재 학기: </strong>
            {currentSemester ? (
              <span style={{ color: "#004094", fontWeight: "bold" }}>{currentSemester.label}</span>
            ) : (
              <span style={{ color: "#d32f2f" }}>설정된 학기 없음</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="예: 2027-1"
              value={newSemesterLabel}
              onChange={(e) => setNewSemesterLabel(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleCreateSemester} style={primaryBtn}>새 학기 시작</button>
          </div>
        </div>

        {semesters.length > 0 && (
          <div style={{ marginTop: "12px", fontSize: "0.85rem" }}>
            {semesters.map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #f1f3f5" }}>
                <span>{s.label} {s.is_current && <span style={{ color: "#2e7d32", fontWeight: "bold" }}>(현재)</span>}</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {!s.is_current && (
                    <button onClick={() => handleSwitchSemester(s.id, s.label)} style={secondaryBtnSmall}>이 학기로 전환</button>
                  )}
                  <button onClick={() => handleDeleteSemester(s.id, s.label)} style={dangerBtnSmall}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!currentSemester ? (
        <p style={{ color: "#888" }}>학기를 먼저 생성해주세요.</p>
      ) : (
        <>
          {/* ===== 과목 추가 ===== */}
          <div style={{ ...boxStyle, display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="새 과목명 (예: 결정학 기초)"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={handleAddCourse} style={primaryBtn}>+ 과목 추가</button>
          </div>

          {/* ===== 과목별 자료 ===== */}
          {courses.map((course) => {
            const form = materialForms[course.id] || defaultMaterialForm();
            const materials = (materialsByCourse[course.id] || []).sort(
              (a, b) => new Date(b.date) - new Date(a.date) || b.seq - a.seq
            );

            return (
              <div key={course.id} style={{ ...boxStyle, marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <strong style={{ fontSize: "1rem" }}>{course.name}</strong>
                  <button onClick={() => handleDeleteCourse(course.id, course.name)} style={dangerBtnSmall}>과목 삭제</button>
                </div>

                {/* 자료 목록 */}
                {materials.length === 0 ? (
                  <p style={{ color: "#aaa", fontSize: "0.85rem" }}>등록된 자료가 없습니다.</p>
                ) : (
                  <div style={{ marginBottom: "14px" }}>
                    {materials.map((m) => (
                      <div key={m.id} style={{ padding: "8px 0", borderBottom: "1px solid #f1f3f5" }}>
                        {editingMaterialId === m.id ? (
                          // ===== 수정 폼 =====
                          <div style={{ background: "#fff7e6", padding: "10px", borderRadius: "6px" }}>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                              <select value={editForm.type} onChange={(e) => updateEditForm("type", e.target.value)} style={inputStyle}>
                                <option value="slide">강의자료 (slide)</option>
                                <option value="notice">공지 (notice)</option>
                                <option value="grade">성적 (grade)</option>
                              </select>
                              <input type="date" value={editForm.date} onChange={(e) => updateEditForm("date", e.target.value)} style={inputStyle} />
                              <input type="number" placeholder="주차" value={editForm.week} onChange={(e) => updateEditForm("week", e.target.value)} style={{ ...inputStyle, width: "70px" }} />
                              <input type="text" placeholder="제목" value={editForm.title} onChange={(e) => updateEditForm("title", e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: "150px" }} />
                            </div>
                            {editForm.is_external_link && (
                              <input
                                type="text"
                                placeholder="https://..."
                                value={editForm.file_url}
                                onChange={(e) => updateEditForm("file_url", e.target.value)}
                                style={{ ...inputStyle, width: "100%", marginBottom: "8px", boxSizing: "border-box" }}
                              />
                            )}
                            {!editForm.is_external_link && (
                              <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "8px" }}>
                                업로드된 파일 자체를 바꾸려면, 이 자료를 삭제하고 새로 추가해주세요.
                              </div>
                            )}
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button onClick={handleSaveEditMaterial} disabled={editForm.isSubmitting} style={{ ...primaryBtn, opacity: editForm.isSubmitting ? 0.6 : 1 }}>
                                {editForm.isSubmitting ? "저장 중..." : "저장"}
                              </button>
                              <button onClick={cancelEditMaterial} style={secondaryBtnSmall}>취소</button>
                            </div>
                          </div>
                        ) : (
                          // ===== 일반 표시 =====
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                            <div>
                              <span style={{ color: "#888", marginRight: "8px" }}>{m.date}</span>
                              <span style={{ fontWeight: "bold", marginRight: "8px" }}>[{m.type}]</span>
                              <span>{m.title}</span>
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => startEditMaterial(m)} style={secondaryBtnSmall}>수정</button>
                              <button onClick={() => handleDeleteMaterial(m.id, m.title)} style={dangerBtnSmall}>삭제</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 자료 추가 폼 */}
                <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <select value={form.type} onChange={(e) => updateMaterialForm(course.id, "type", e.target.value)} style={inputStyle}>
                      <option value="slide">강의자료 (slide)</option>
                      <option value="notice">공지 (notice)</option>
                      <option value="grade">성적 (grade)</option>
                    </select>
                    <input type="date" value={form.date} onChange={(e) => updateMaterialForm(course.id, "date", e.target.value)} style={inputStyle} />
                    <input type="number" placeholder="주차" value={form.week} onChange={(e) => updateMaterialForm(course.id, "week", e.target.value)} style={{ ...inputStyle, width: "70px" }} />
                    <input type="text" placeholder="제목" value={form.title} onChange={(e) => updateMaterialForm(course.id, "title", e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: "150px" }} />
                  </div>

                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "5px" }}>
                      <input
                        type="checkbox"
                        checked={form.isExternalLink}
                        onChange={(e) => updateMaterialForm(course.id, "isExternalLink", e.target.checked)}
                      />
                      외부 링크로 등록 (강의계획서 등)
                    </label>
                  </div>

                  {form.isExternalLink ? (
                    <input
                      key="external-url-input"
                      type="text"
                      placeholder="https://..."
                      value={form.externalUrl}
                      onChange={(e) => updateMaterialForm(course.id, "externalUrl", e.target.value)}
                      style={{ ...inputStyle, width: "100%", marginBottom: "8px", boxSizing: "border-box" }}
                    />
                  ) : (
                    <input
                      key="file-upload-input"
                      type="file"
                      onChange={(e) => updateMaterialForm(course.id, "file", e.target.files[0])}
                      style={{ marginBottom: "8px", fontSize: "0.85rem" }}
                    />
                  )}

                  <button
                    onClick={() => handleAddMaterial(course.id)}
                    disabled={form.isSubmitting}
                    style={{ ...primaryBtn, opacity: form.isSubmitting ? 0.6 : 1 }}
                  >
                    {form.isSubmitting ? "업로드 중..." : "+ 자료 추가"}
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
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

const dangerBtnSmall = {
  background: "#fce8e6",
  color: "#c5221f",
  border: "none",
  padding: "4px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: "bold",
};

const secondaryBtnSmall = {
  background: "#e7f5ff",
  color: "#004094",
  border: "none",
  padding: "4px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: "bold",
};