"use client";

// 포털 「Account」 — 본인 멤버 정보 편집 (+ 비밀번호 변경 섹션).
// 편집 가능: 이름/영어이름/이메일/전화/카카오/링크 4개/사진
// 교수님 전용(신분·학위·상태·입학/합류 시기·졸업연도·현재 소속)은 읽기만.

import { useState, useEffect } from "react";
import { FaFilePdf, FaLinkedin } from "react-icons/fa6";
import { SiGooglescholar, SiOrcid } from "react-icons/si";
import FileUploader from "./FileUploader";
import ChangePasswordForm from "./ChangePasswordForm";
import { apiFetch } from "@/lib/apiClient";
import { itemsFromUrls, uploadItems } from "@/lib/uploadClient";
import { POSITION_LABELS_EN, POSITION_LABELS_KO, REQUIRED_PROFILE_FIELDS } from "@/lib/memberConstants";
import { Button, Input, Field, Card, Empty, FormGrid, span2, useToast } from "./ui";

const FIELD_LABELS = {
  name_kor: "이름 (한글)", name_eng: "이름 (영문)", email: "E-mail", phone: "전화번호", kakao_id: "Kakao ID",
  cv_link: "CV 링크", scholar_link: "Google Scholar", linkedin_link: "LinkedIn", orcid_link: "ORCID",
};

function formFromMember(m) {
  return {
    name_kor: m.nameKor || "", name_eng: m.nameEng || "", email: m.email || "", phone: m.phone || "", kakao_id: m.kakaoId || "",
    cv_link: m.links?.cv || "", scholar_link: m.links?.scholar || "", linkedin_link: m.links?.linkedin || "", orcid_link: m.links?.orcid || "",
    photo: itemsFromUrls(m.photoUrl ? [m.photoUrl] : []),
  };
}

export function missingProfileFields(member) {
  if (!member) return [];
  const map = { name_eng: member.nameEng, email: member.email, phone: member.phone };
  return REQUIRED_PROFILE_FIELDS.filter((f) => !map[f]);
}

// showPassword = true 면 같은 카드 안에 비밀번호 변경 섹션을 이어서 보여줌
export default function MyProfileForm({ onSaved, showPassword = false, userId }) {
  const toast = useToast();
  const [member, setMember] = useState(null);
  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiFetch("/api/members/me")
      .then((d) => { setMember(d.member); if (d.member) setForm(formFromMember(d.member)); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name_kor.trim()) return toast.error("이름(한글)은 필수입니다.");
    setIsSaving(true);
    try {
      // 새 사진이 있으면 R2에 올림 (장변 800px 로 리사이즈)
      const uploaded = await uploadItems(form.photo, {
        folder: "members", resizeImages: true, resizeOptions: { maxEdge: 800, quality: 0.85 },
        onItemsChange: (items) => set("photo", items),
      });
      const { photo, ...fields } = form;
      const data = await apiFetch("/api/members/me", { method: "PATCH", body: { ...fields, photo_url: uploaded[0]?.url || null } });
      setMember(data.member);
      setForm(formFromMember(data.member));
      toast.success("저장되었습니다. 홈페이지 Members 와 Directory 에 반영됩니다.");
      onSaved?.(data.member);
    } catch (err) {
      toast.error("실패: " + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <Empty>불러오는 중...</Empty>;
  if (!member) return <Empty>아직 계정에 연결된 멤버 정보가 없습니다. 교수님께 「멤버 관리」에서 연결을 요청해주세요.</Empty>;

  const missing = missingProfileFields(member);
  const T = (k, extra = {}) => (
    <Field label={FIELD_LABELS[k]} required={REQUIRED_PROFILE_FIELDS.includes(k)}>
      <Input value={form[k]} onChange={(e) => set(k, e.target.value)} {...extra} />
    </Field>
  );

  return (
    <div>
      <form onSubmit={handleSave}>
        {missing.length > 0 && (
          <div style={{ background: "#fff4e5", border: "1px solid #ffd9a8", color: "#8a5200", borderRadius: 8, padding: "10px 14px", fontSize: "0.88rem", marginBottom: 14 }}>
            아직 비어 있는 필수 항목: {missing.map((f) => FIELD_LABELS[f]).join(", ")}
          </div>
        )}

        {/* 교수님 전용 (읽기) */}
        <Card style={{ background: "#f8f9fb", padding: "10px 14px", marginBottom: 14, display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.84rem", color: "#555" }}>
          <span><strong>신분</strong> {POSITION_LABELS_EN[member.position]} ({POSITION_LABELS_KO[member.position]})</span>
          <span><strong>최종 학위</strong> {member.degree}</span>
          <span><strong>상태</strong> {member.status === "active" ? "Active" : `Graduated${member.yearLeft ? ` (${member.yearLeft})` : ""}`}</span>
          <span><strong>입학/합류</strong> {member.yearJoined || "-"}</span>
          {member.currentPosition && <span><strong>현재 소속</strong> {member.currentPosition}</span>}
          <span style={{ marginLeft: "auto", color: "#a5adb8" }}>이 항목들은 교수님만 변경할 수 있어요</span>
        </Card>

        <FormGrid>
          <Field label="프로필 사진" hint="정방형 권장 · 자동으로 800px로 줄여서 저장" className={span2}>
            <FileUploader items={form.photo} onChange={(items) => set("photo", items)} multiple={false} accept="image/*" disabled={isSaving} />
          </Field>
          {T("name_kor")}
          {T("name_eng", { placeholder: "예: Jun-Hyeong Park" })}
          {T("email", { type: "email" })}
          {T("phone", { placeholder: "010-0000-0000" })}
          {T("kakao_id")}
          <div className={span2} style={{ fontSize: "0.8rem", color: "#8a94a0", marginTop: 4, display: "flex", gap: 10, alignItems: "center" }}>
            링크를 넣으면 홈페이지 Members 카드 이름 옆에 아이콘으로 표시됩니다:
            <FaFilePdf color="#d32f2f" /><SiGooglescholar color="#4285F4" /><FaLinkedin color="#0077b5" /><SiOrcid color="#A6CE39" />
          </div>
          {T("cv_link", { placeholder: "https://…" })}
          {T("scholar_link", { placeholder: "https://scholar.google.com/…" })}
          {T("linkedin_link", { placeholder: "https://www.linkedin.com/in/…" })}
          {T("orcid_link", { placeholder: "https://orcid.org/…" })}
        </FormGrid>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
          <Button type="submit" disabled={isSaving}>{isSaving ? "저장 중..." : "저장"}</Button>
          <Button type="button" variant="ghost" onClick={() => setForm(formFromMember(member))} disabled={isSaving}>되돌리기</Button>
          <span style={{ marginLeft: "auto", fontSize: "0.76rem", color: "#a5adb8" }}>Last updated: {member.updatedAt ? new Date(member.updatedAt).toLocaleDateString() : "-"}</span>
        </div>
      </form>

      {showPassword && (
        <>
          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "28px 0 20px" }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
            <h4 style={{ margin: 0, color: "#333", fontSize: "0.95rem" }}>🔑 비밀번호 변경</h4>
            {userId && <span style={{ fontSize: "0.8rem", color: "#888" }}>로그인 ID: <strong>{userId}</strong></span>}
          </div>
          <ChangePasswordForm variant="inline" />
        </>
      )}
    </div>
  );
}
