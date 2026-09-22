"use client";

// 비밀번호 변경 폼. 로그인 페이지(초기화 후 첫 로그인)와 포털(본인 변경) 양쪽에서 사용.
//   <ChangePasswordForm onSuccess={() => ...} onCancel={...} forced />
// forced = true 면 취소 버튼을 숨김 (관리자 초기화 후 변경 강제).

import { useState } from "react";

export default function ChangePasswordForm({ onSuccess, onCancel, forced = false, currentLabel = "현재 비밀번호" }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) return setError("새 비밀번호는 8자 이상이어야 합니다.");
    if (newPassword !== confirm) return setError("새 비밀번호가 서로 일치하지 않습니다.");

    setIsLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "변경 실패");
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <input
        type="password" placeholder={currentLabel} autoComplete="current-password"
        value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
        style={inputStyle} required autoFocus
      />
      <input
        type="password" placeholder="새 비밀번호 (8자 이상)" autoComplete="new-password" minLength={8}
        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
        style={inputStyle} required
      />
      <input
        type="password" placeholder="새 비밀번호 확인" autoComplete="new-password" minLength={8}
        value={confirm} onChange={(e) => setConfirm(e.target.value)}
        style={inputStyle} required
      />
      {error && <div style={{ color: "#c5221f", fontSize: "0.85rem", textAlign: "left" }}>{error}</div>}
      <button type="submit" disabled={isLoading} style={btnStyle("#004094")}>
        {isLoading ? "변경 중..." : "비밀번호 변경"}
      </button>
      {!forced && onCancel && (
        <button type="button" onClick={onCancel} style={btnStyle("#aaa")}>취소</button>
      )}
    </form>
  );
}

const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem", outline: "none", width: "100%", boxSizing: "border-box" };
const btnStyle = (bg) => ({ padding: "12px", background: bg, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem", marginTop: "5px", width: "100%" });
