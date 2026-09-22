"use client";

// 콘텐츠 수정 요청 (admin) — 접수된 요청 목록 + 처리 완료. 변경 시 onChanged() 로 상위 배지 갱신.

import { useState, useEffect, useCallback } from "react";
import { MdPlaylistAddCheck } from "react-icons/md";
import { apiFetch } from "@/lib/apiClient";
import { Button, Card, Toolbar, Badge, Empty, Segment, useToast, useConfirm } from "./ui";

export default function RequestsAdmin({ onChanged }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState("open");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (st) => {
    try { setRequests((await apiFetch(`/api/requests?status=${st}`)).requests || []); }
    catch (e) { toast.error(e.message); }
    finally { setIsLoading(false); }
  }, [toast]);
  useEffect(() => { load(status); }, [load, status]);

  async function resolve(req) {
    if (!(await confirm({ title: "처리 완료", message: "이 요청을 처리 완료로 표시합니다.", confirmText: "완료" }))) return;
    try {
      await apiFetch("/api/requests", { method: "PATCH", body: { id: req.id } });
      setRequests((prev) => (status === "open" ? prev.filter((r) => r.id !== req.id) : prev.map((r) => (r.id === req.id ? { ...r, status: "resolved" } : r))));
      toast.success("처리 완료로 표시했습니다.");
      onChanged?.();
    } catch (e) { toast.error("오류: " + e.message); }
  }

  return (
    <div>
      <Toolbar title={<><MdPlaylistAddCheck size={22} color="#004094" /> 콘텐츠 수정 요청</>} count={`${requests.length}건`}>
        <Segment value={status} onChange={(v) => { setIsLoading(true); setStatus(v); }} options={[["open", "미처리"], ["resolved", "처리됨"], ["all", "전체"]]} />
      </Toolbar>
      <Card tight>
        {isLoading ? <Empty>불러오는 중...</Empty> : requests.length === 0 ? <Empty>{status === "open" ? "접수된 요청이 없습니다." : "요청이 없습니다."}</Empty> : (
          <div>
            {requests.map((req) => (
              <div key={req.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", borderBottom: "1px solid #f1f3f5" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <Badge color="blue">{req.category}</Badge>
                    {req.status === "resolved" && <Badge color="green">처리됨</Badge>}
                    <span style={{ color: "#a5adb8", fontSize: "0.75rem" }}>{new Date(req.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ color: "#333", fontSize: "0.9rem", margin: "0 0 6px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{req.content}</p>
                  <div style={{ fontSize: "0.8rem", color: "#8a94a0" }}>From: <strong style={{ color: "#495057" }}>{req.requesterName}</strong></div>
                </div>
                {req.status === "open" && <Button size="sm" variant="secondary" onClick={() => resolve(req)}>처리 완료</Button>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
