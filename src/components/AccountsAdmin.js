"use client";

// 계정 관리 (admin 전용): 전체 계정 표 + 역할 변경 / 차단 / 비번 초기화 / OTP 초기화 / 삭제

import { useState, useEffect } from "react";
import { FaCopy, FaCheck } from "react-icons/fa6";
import { ROLES, ROLE_LABELS, STATUS_LABELS } from "@/lib/roles";
import { boxStyle, inputStyle, primaryBtn, secondaryBtnSmall, dangerBtnSmall } from "./adminStyles";

const STATUS_STYLE = {
  active:   { bg: "#e6f4ea", col: "#137333" },
  pending:  { bg: "#fff4e5", col: "#b26a00" },
  blocked:  { bg: "#fce8e6", col: "#c5221f" },
  rejected: { bg: "#eee",    col: "#666" },
};

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function AccountsAdmin({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [busyId, setBusyId] = useState(null);
  // 임시 비밀번호는 한 번만 표시: { userId, name, tempPassword }
  const [tempPw, setTempPw] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setIsLoading(true);
    const res = await fetch("/api/admin/users?status=all");
    const data = await res.json().catch(() => ({}));
    setUsers(data.users || []);
    setIsLoading(false);
  }

  async function act(user, action, extra = {}, confirmMsg) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusyId(user.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "실패");

      if (data.deleted) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      } else if (data.user) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? data.user : u)));
      }
      if (data.tempPassword) {
        setTempPw({ userId: user.userId, name: user.name, tempPassword: data.tempPassword });
        setCopied(false);
      }
    } catch (err) {
      alert("실패: " + err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function copyTemp() {
    try {
      await navigator.clipboard.writeText(tempPw.tempPassword);
      setCopied(true);
    } catch {
      alert("복사에 실패했습니다. 직접 선택해서 복사해주세요.");
    }
  }

  const visible = users.filter((u) => filter === "all" || u.status === filter);
  const counts = users.reduce((acc, u) => { acc[u.status] = (acc[u.status] || 0) + 1; return acc; }, {});

  if (isLoading) return <p style={{ color: "#888" }}>불러오는 중...</p>;

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h3 style={{ color: "#333", margin: 0 }}>👥 계정 관리 ({users.length}명)</h3>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[["active", "활성"], ["pending", "대기"], ["blocked", "차단"], ["rejected", "거절"], ["all", "전체"]].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              style={{ ...secondaryBtnSmall, background: filter === k ? "#004094" : "#e7f5ff", color: filter === k ? "#fff" : "#004094" }}
            >
              {label}{k !== "all" && counts[k] ? ` ${counts[k]}` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* 임시 비밀번호 표시 (한 번만) */}
      {tempPw && (
        <div style={{ ...boxStyle, border: "2px solid #004094", background: "#f0f5ff" }}>
          <div style={{ fontWeight: "bold", color: "#004094", marginBottom: "6px" }}>
            🔑 {tempPw.name} ({tempPw.userId}) 임시 비밀번호
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <code style={{ fontSize: "1.3rem", letterSpacing: "2px", background: "#fff", padding: "8px 14px", borderRadius: "6px", border: "1px solid #cfe0ff", userSelect: "all" }}>
              {tempPw.tempPassword}
            </code>
            <button onClick={copyTemp} style={{ ...primaryBtn, display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {copied ? <><FaCheck size={12} /> 복사됨</> : <><FaCopy size={12} /> 복사</>}
            </button>
            <button onClick={() => setTempPw(null)} style={secondaryBtnSmall}>닫기</button>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#555", marginTop: "8px" }}>
            이 비밀번호는 지금 한 번만 표시됩니다. Slack 등으로 본인에게 전달해주세요.
            본인이 다음 로그인 때 새 비밀번호를 설정해야 포털에 들어갈 수 있습니다.
          </div>
        </div>
      )}

      <div style={{ ...boxStyle, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", minWidth: "760px" }}>
          <thead>
            <tr style={{ background: "#f8f9fa", color: "#555", textAlign: "left" }}>
              <th style={th}>이름 / ID</th>
              <th style={th}>역할</th>
              <th style={th}>상태</th>
              <th style={th}>OTP</th>
              <th style={th}>가입</th>
              <th style={th}>최근 로그인</th>
              <th style={{ ...th, textAlign: "right" }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#888" }}>해당 상태의 계정이 없습니다.</td></tr>
            )}
            {visible.map((u) => {
              const isSelf = u.userId === currentUserId;
              const busy = busyId === u.id;
              const st = STATUS_STYLE[u.status] || STATUS_STYLE.rejected;
              return (
                <tr key={u.id} style={{ borderTop: "1px solid #f1f3f5", opacity: busy ? 0.5 : 1 }}>
                  <td style={td}>
                    <div style={{ fontWeight: "bold", color: "#333" }}>{u.name}{isSelf && <span style={{ color: "#888", fontWeight: "normal", fontSize: "0.8rem" }}> (나)</span>}</div>
                    <div style={{ color: "#888", fontSize: "0.8rem" }}>{u.userId}</div>
                  </td>
                  <td style={td}>
                    <select
                      value={u.role}
                      disabled={isSelf || busy || u.status !== "active"}
                      onChange={(e) => act(u, "set_role", { role: e.target.value })}
                      style={{ ...inputStyle, padding: "4px 6px", fontSize: "0.85rem" }}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: "0.75rem", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold", background: st.bg, color: st.col }}>
                      {STATUS_LABELS[u.status] || u.status}
                    </span>
                    {u.mustChangePassword && <div style={{ fontSize: "0.72rem", color: "#b26a00", marginTop: "3px" }}>비번 변경 대기</div>}
                    {u.status === "rejected" && u.rejectedReason && <div style={{ fontSize: "0.72rem", color: "#888", marginTop: "3px" }}>{u.rejectedReason}</div>}
                  </td>
                  <td style={td}>{u.otpSet ? <span style={{ color: "#137333" }}>설정됨</span> : <span style={{ color: "#888" }}>미설정</span>}</td>
                  <td style={{ ...td, color: "#666" }}>{fmtDate(u.createdAt)}</td>
                  <td style={{ ...td, color: "#666" }}>{fmtDate(u.lastLoginAt)}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "5px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {u.status === "pending" && (
                        <button disabled={busy} onClick={() => act(u, "approve", {}, `${u.name} 계정을 승인하시겠습니까?`)} style={{ ...secondaryBtnSmall, background: "#e6f4ea", color: "#137333" }}>승인</button>
                      )}
                      {u.status === "active" && !isSelf && (
                        <button disabled={busy} onClick={() => act(u, "block", {}, `${u.name} 계정을 차단하시겠습니까? 즉시 로그인이 막힙니다.`)} style={dangerBtnSmall}>차단</button>
                      )}
                      {u.status === "blocked" && (
                        <button disabled={busy} onClick={() => act(u, "unblock", {}, `${u.name} 계정 차단을 해제하시겠습니까?`)} style={{ ...secondaryBtnSmall, background: "#e6f4ea", color: "#137333" }}>해제</button>
                      )}
                      {u.status === "active" && (
                        <>
                          <button disabled={busy} onClick={() => act(u, "reset_password", {}, `${u.name}의 비밀번호를 초기화하시겠습니까?\n임시 비밀번호가 발급되고 기존 비밀번호는 즉시 무효화됩니다.`)} style={secondaryBtnSmall}>비번 초기화</button>
                          <button disabled={busy || !u.otpSet} onClick={() => act(u, "reset_otp", {}, `${u.name}의 OTP를 초기화하시겠습니까?\n다음 로그인 때 QR을 다시 등록하게 됩니다.`)} style={{ ...secondaryBtnSmall, opacity: u.otpSet ? 1 : 0.4 }}>OTP 초기화</button>
                        </>
                      )}
                      {(u.status === "rejected" || u.status === "blocked" || u.status === "pending") && !isSelf && (
                        <button disabled={busy} onClick={() => act(u, "delete", {}, `${u.name} (${u.userId}) 계정을 완전히 삭제하시겠습니까? 되돌릴 수 없습니다.`)} style={dangerBtnSmall}>삭제</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding: "12px 14px", borderBottom: "2px solid #eee", fontWeight: "600", whiteSpace: "nowrap" };
const td = { padding: "12px 14px", verticalAlign: "top" };
