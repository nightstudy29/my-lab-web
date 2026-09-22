"use client";

// 계정 관리 (admin 전용): 전체 계정 표 + 역할 변경 / 차단 / 비번 초기화 / OTP 초기화 / 삭제

import { useState, useEffect } from "react";
import { FaCopy, FaCheck } from "react-icons/fa6";
import { ROLES, ROLE_LABELS, STATUS_LABELS } from "@/lib/roles";
import { Button, Select, Card, Toolbar, Table, td, Badge, Empty, Segment, useToast, useConfirm } from "./ui";

const STATUS_COLOR = { active: "green", pending: "orange", blocked: "red", rejected: "gray" };
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" }) : "-";

export default function AccountsAdmin({ currentUserId }) {
  const toast = useToast();
  const confirm = useConfirm();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [busyId, setBusyId] = useState(null);
  const [tempPw, setTempPw] = useState(null); // { userId, name, tempPassword } — 한 번만 표시
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/users?status=all");
    const data = await res.json().catch(() => ({}));
    setUsers(data.users || []);
    setIsLoading(false);
  }

  async function act(user, action, extra = {}, ask) {
    if (ask && !(await confirm(ask))) return;
    setBusyId(user.id);
    try {
      const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, action, ...extra }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "실패");
      if (data.deleted) setUsers((prev) => prev.filter((u) => u.id !== user.id));
      else if (data.user) setUsers((prev) => prev.map((u) => (u.id === user.id ? data.user : u)));
      if (data.tempPassword) { setTempPw({ userId: user.userId, name: user.name, tempPassword: data.tempPassword }); setCopied(false); }
      else toast.success({ approve: "승인했습니다.", block: "차단했습니다.", unblock: "차단을 해제했습니다.", set_role: "역할을 변경했습니다.", reset_otp: "OTP를 초기화했습니다.", delete: "삭제했습니다." }[action] || "완료");
    } catch (e) {
      toast.error("실패: " + e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function copyTemp() {
    try { await navigator.clipboard.writeText(tempPw.tempPassword); setCopied(true); toast.success("임시 비밀번호를 복사했습니다."); }
    catch { toast.error("복사에 실패했습니다. 직접 선택해서 복사해주세요."); }
  }

  const visible = users.filter((u) => filter === "all" || u.status === filter);
  const counts = users.reduce((a, u) => { a[u.status] = (a[u.status] || 0) + 1; return a; }, {});
  const seg = [["active", `활성 ${counts.active || 0}`], ["pending", `대기 ${counts.pending || 0}`], ["blocked", `차단 ${counts.blocked || 0}`], ["rejected", `거절 ${counts.rejected || 0}`], ["all", "전체"]];

  return (
    <div>
      <Toolbar title="👥 계정 관리" count={`${users.length}명`}>
        <Segment value={filter} onChange={setFilter} options={seg} />
      </Toolbar>

      {tempPw && (
        <Card style={{ border: "2px solid #004094", background: "#f0f5ff", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: "#004094", marginBottom: 6 }}>🔑 {tempPw.name} ({tempPw.userId}) 임시 비밀번호</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <code style={{ fontSize: "1.3rem", letterSpacing: 2, background: "#fff", padding: "8px 14px", borderRadius: 6, border: "1px solid #cfe0ff", userSelect: "all" }}>{tempPw.tempPassword}</code>
            <Button onClick={copyTemp}>{copied ? <><FaCheck size={11} /> 복사됨</> : <><FaCopy size={11} /> 복사</>}</Button>
            <Button variant="ghost" onClick={() => setTempPw(null)}>닫기</Button>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#555", marginTop: 8 }}>지금 한 번만 표시됩니다. Slack 등으로 본인에게 전달하세요. 본인은 다음 로그인 때 새 비밀번호를 설정해야 포털에 들어갈 수 있습니다.</div>
        </Card>
      )}

      <Card tight>
        {isLoading ? <Empty>불러오는 중...</Empty> : visible.length === 0 ? <Empty>해당 상태의 계정이 없습니다.</Empty> : (
          <Table>
            <thead>
              <tr><th>이름 / ID</th><th style={{ width: 110 }}>역할</th><th style={{ width: 110 }}>상태</th><th style={{ width: 70 }}>OTP</th><th style={{ width: 90 }}>가입</th><th style={{ width: 90 }}>최근 로그인</th><th></th></tr>
            </thead>
            <tbody>
              {visible.map((u) => {
                const isSelf = u.userId === currentUserId;
                const busy = busyId === u.id;
                return (
                  <tr key={u.id} style={{ opacity: busy ? 0.5 : 1 }}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#222" }}>{u.name}{isSelf && <span style={{ color: "#999", fontWeight: 400, fontSize: "0.78rem" }}> (나)</span>}</div>
                      <div style={{ color: "#8a94a0", fontSize: "0.78rem" }}>{u.userId}</div>
                    </td>
                    <td>
                      <Select value={u.role} disabled={isSelf || busy || u.status !== "active"} onChange={(e) => act(u, "set_role", { role: e.target.value })} style={{ padding: "4px 6px", fontSize: "0.82rem" }}>
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </Select>
                    </td>
                    <td>
                      <Badge color={STATUS_COLOR[u.status] || "gray"}>{STATUS_LABELS[u.status] || u.status}</Badge>
                      {u.mustChangePassword && <div style={{ fontSize: "0.7rem", color: "#b26a00", marginTop: 3 }}>비번 변경 대기</div>}
                      {u.status === "rejected" && u.rejectedReason && <div style={{ fontSize: "0.7rem", color: "#8a94a0", marginTop: 3 }}>{u.rejectedReason}</div>}
                    </td>
                    <td className={td.muted}>{u.otpSet ? <span style={{ color: "#137333" }}>설정됨</span> : "미설정"}</td>
                    <td className={td.muted}>{fmtDate(u.createdAt)}</td>
                    <td className={td.muted}>{fmtDate(u.lastLoginAt)}</td>
                    <td className={td.right}>
                      <span className={td.actions}>
                        {u.status === "pending" && <Button size="sm" variant="secondary" disabled={busy} onClick={() => act(u, "approve", {}, { title: "가입 승인", message: `${u.name} 계정을 승인합니다.`, confirmText: "승인" })}>승인</Button>}
                        {u.status === "active" && !isSelf && <Button size="sm" variant="danger" disabled={busy} onClick={() => act(u, "block", {}, { title: "계정 차단", message: `${u.name} 계정을 차단합니다. 즉시 로그인이 막힙니다.`, confirmText: "차단", danger: true })}>차단</Button>}
                        {u.status === "blocked" && <Button size="sm" variant="secondary" disabled={busy} onClick={() => act(u, "unblock", {}, { title: "차단 해제", message: `${u.name} 계정 차단을 해제합니다.`, confirmText: "해제" })}>해제</Button>}
                        {u.status === "active" && <>
                          <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(u, "reset_password", {}, { title: "비밀번호 초기화", message: `${u.name}의 비밀번호를 초기화합니다.\n임시 비밀번호가 발급되고 기존 비밀번호는 즉시 무효화됩니다.`, confirmText: "초기화" })}>비번 초기화</Button>
                          <Button size="sm" variant="ghost" disabled={busy || !u.otpSet} onClick={() => act(u, "reset_otp", {}, { title: "OTP 초기화", message: `${u.name}의 OTP를 초기화합니다.\n다음 로그인 때 QR을 다시 등록하게 됩니다.`, confirmText: "초기화" })}>OTP 초기화</Button>
                        </>}
                        {(u.status === "rejected" || u.status === "blocked" || u.status === "pending") && !isSelf && <Button size="sm" variant="danger" disabled={busy} onClick={() => act(u, "delete", {}, { title: "계정 삭제", message: `${u.name} (${u.userId}) 계정을 완전히 삭제합니다. 되돌릴 수 없습니다.`, confirmText: "삭제", danger: true })}>삭제</Button>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
