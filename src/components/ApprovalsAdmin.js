"use client";

// 가입 승인 대기 (admin) — 승인 / 거절(사유). 변경 시 onChanged() 로 상위 배지 갱신.

import { useState, useEffect, useCallback } from "react";
import { MdPendingActions } from "react-icons/md";
import { apiFetch } from "@/lib/apiClient";
import { Button, Textarea, Field, Card, Toolbar, Table, td, Empty, SlidePanel, useToast, useConfirm } from "./ui";

export default function ApprovalsAdmin({ onChanged }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reject, setReject] = useState(null); // { user, reason }

  const load = useCallback(async () => {
    try { setUsers((await apiFetch("/api/admin/users?status=pending")).users || []); }
    catch (e) { toast.error(e.message); }
    finally { setIsLoading(false); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  async function approve(u) {
    if (!(await confirm({ title: "가입 승인", message: `${u.name} (${u.userId}) 계정을 승인합니다.\n멤버 정보(Directory) 행이 자동으로 만들어집니다.`, confirmText: "승인" }))) return;
    setIsSaving(true);
    try {
      await apiFetch("/api/admin/users", { method: "PATCH", body: { id: u.id, action: "approve" } });
      setUsers((prev) => prev.filter((p) => p.id !== u.id));
      toast.success(`${u.name} 계정을 승인했습니다.`);
      onChanged?.();
    } catch (e) { toast.error("승인 실패: " + e.message); }
    finally { setIsSaving(false); }
  }

  async function doReject() {
    setIsSaving(true);
    try {
      await apiFetch("/api/admin/users", { method: "PATCH", body: { id: reject.user.id, action: "reject", reason: reject.reason.trim() || null } });
      setUsers((prev) => prev.filter((p) => p.id !== reject.user.id));
      setReject(null);
      toast.success("가입 신청을 거절했습니다.");
      onChanged?.();
    } catch (e) { toast.error("거절 실패: " + e.message); }
    finally { setIsSaving(false); }
  }

  return (
    <div>
      <Toolbar title={<><MdPendingActions size={20} color="#b26a00" /> 가입 승인 대기</>} count={`${users.length}건`} />
      <Card tight>
        {isLoading ? <Empty>불러오는 중...</Empty> : users.length === 0 ? <Empty>대기 중인 가입 요청이 없습니다.</Empty> : (
          <Table>
            <thead><tr><th>ID</th><th>이름</th><th style={{ width: 170 }}>신청일</th><th style={{ width: 150 }}></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className={td.muted}>{u.userId}</td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td className={td.muted}>{new Date(u.createdAt).toLocaleString()}</td>
                  <td className={td.right}>
                    <span className={td.actions}>
                      <Button size="sm" onClick={() => approve(u)} disabled={isSaving}>승인</Button>
                      <Button size="sm" variant="danger" onClick={() => setReject({ user: u, reason: "" })} disabled={isSaving}>거절</Button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <SlidePanel
        open={!!reject}
        title={reject ? `가입 거절 — ${reject.user.name} (${reject.user.userId})` : ""}
        onClose={() => !isSaving && setReject(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setReject(null)} disabled={isSaving}>취소</Button>
          <Button variant="dangerSolid" onClick={doReject} disabled={isSaving}>{isSaving ? "처리 중..." : "거절"}</Button>
        </>}
      >
        {reject && (
          <Field label="거절 사유 (선택)" hint="거절된 ID로는 다시 가입 신청할 수 있습니다.">
            <Textarea rows={3} autoFocus value={reject.reason} onChange={(e) => setReject((r) => ({ ...r, reason: e.target.value }))} placeholder="예: 연구실 구성원이 아님" />
          </Field>
        )}
      </SlidePanel>
    </div>
  );
}
