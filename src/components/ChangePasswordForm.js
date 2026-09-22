"use client";

// 비밀번호 변경 폼.
//   <ChangePasswordForm onSuccess onCancel forced currentLabel variant />
//   forced  = true → 취소 버튼 숨김 (관리자 초기화 후 변경 강제)
//   variant = "card"  (기본) 로그인 화면용 세로 배치 (Provider 없는 곳에서도 동작)
//           = "inline" 포털 Account 카드 안에 다른 입력란과 같은 스타일로 배치

import { useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { Button, Input, Field, FormGrid } from "./ui";

export default function ChangePasswordForm({ onSuccess, onCancel, forced = false, currentLabel = "현재 비밀번호", variant = "card" }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setNotice("");
    if (newPassword.length < 8) return setError("새 비밀번호는 8자 이상이어야 합니다.");
    if (newPassword !== confirm) return setError("새 비밀번호가 서로 일치하지 않습니다.");
    setIsLoading(true);
    try {
      await apiFetch("/api/account/password", { method: "POST", body: { currentPassword, newPassword } });
      setCurrentPassword(""); setNewPassword(""); setConfirm("");
      setNotice("비밀번호가 변경되었습니다.");
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit}>
        <FormGrid cols={3}>
          <Field label={currentLabel}><Input type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></Field>
          <Field label="새 비밀번호 (8자 이상)"><Input type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
          <Field label="새 비밀번호 확인"><Input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        </FormGrid>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <Button type="submit" disabled={isLoading}>{isLoading ? "변경 중..." : "비밀번호 변경"}</Button>
          {error && <span style={{ color: "#c5221f", fontSize: "0.85rem" }}>{error}</span>}
          {notice && <span style={{ color: "#137333", fontSize: "0.85rem" }}>{notice}</span>}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input type="password" placeholder={currentLabel} autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={cardInput} required autoFocus />
      <input type="password" placeholder="새 비밀번호 (8자 이상)" autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={cardInput} required />
      <input type="password" placeholder="새 비밀번호 확인" autoComplete="new-password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} style={cardInput} required />
      {error && <div style={{ color: "#c5221f", fontSize: "0.85rem", textAlign: "left" }}>{error}</div>}
      <button type="submit" disabled={isLoading} style={btnStyle("#004094")}>{isLoading ? "변경 중..." : "비밀번호 변경"}</button>
      {!forced && onCancel && <button type="button" onClick={onCancel} style={btnStyle("#aaa")}>취소</button>}
    </form>
  );
}

const cardInput = { padding: 12, borderRadius: 8, border: "1px solid #ddd", fontSize: "1rem", outline: "none", width: "100%", boxSizing: "border-box" };
const btnStyle = (bg) => ({ padding: 12, background: bg, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: "1rem", marginTop: 5, width: "100%" });
