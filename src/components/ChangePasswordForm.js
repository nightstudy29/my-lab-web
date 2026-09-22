"use client";

// 비밀번호 변경 폼.
//   <ChangePasswordForm onSuccess onCancel forced currentLabel variant />
//   forced  = true → 취소 버튼 숨김 (관리자 초기화 후 변경 강제)
//   variant = "card"  (기본) 로그인 화면용 세로 배치
//           = "inline" 포털 Account 카드 안에 다른 입력란과 같은 스타일로 배치

import { useState } from "react";
import { inputStyle as adminInput, primaryBtn } from "./adminStyles";

export default function ChangePasswordForm({ onSuccess, onCancel, forced = false, currentLabel = "현재 비밀번호", variant = "card" }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
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
    const field = (label, value, setter, extra = {}) => (
      <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem", color: "#555" }}>
        <span>{label}</span>
        <input type="password" value={value} onChange={(e) => setter(e.target.value)} style={{ ...adminInput, width: "100%", boxSizing: "border-box" }} required {...extra} />
      </label>
    );
    return (
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px 16px" }}>
          {field(currentLabel, currentPassword, setCurrentPassword, { autoComplete: "current-password" })}
          {field("새 비밀번호 (8자 이상)", newPassword, setNewPassword, { autoComplete: "new-password", minLength: 8 })}
          {field("새 비밀번호 확인", confirm, setConfirm, { autoComplete: "new-password", minLength: 8 })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
          <button type="submit" disabled={isLoading} style={{ ...primaryBtn, opacity: isLoading ? 0.6 : 1 }}>{isLoading ? "변경 중..." : "비밀번호 변경"}</button>
          {error && <span style={{ color: "#c5221f", fontSize: "0.85rem" }}>{error}</span>}
          {notice && <span style={{ color: "#137333", fontSize: "0.85rem" }}>{notice}</span>}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <input
        type="password" placeholder={currentLabel} autoComplete="current-password"
        value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
        style={cardInput} required autoFocus
      />
      <input
        type="password" placeholder="새 비밀번호 (8자 이상)" autoComplete="new-password" minLength={8}
        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
        style={cardInput} required
      />
      <input
        type="password" placeholder="새 비밀번호 확인" autoComplete="new-password" minLength={8}
        value={confirm} onChange={(e) => setConfirm(e.target.value)}
        style={cardInput} required
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

const cardInput = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem", outline: "none", width: "100%", boxSizing: "border-box" };
const btnStyle = (bg) => ({ padding: "12px", background: bg, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem", marginTop: "5px", width: "100%" });
