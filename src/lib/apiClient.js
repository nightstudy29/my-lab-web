// src/lib/apiClient.js
//
// 브라우저에서 우리 API(/api/*)를 호출하는 공통 헬퍼.
//   const data = await apiFetch("/api/papers", { method: "POST", body: {...} });
// 응답이 2xx 가 아니면 서버가 준 error/message 로 Error 를 던집니다 → 호출부는 try/catch + toast 만.

export async function apiFetch(url, { method = "GET", body } = {}) {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `요청 실패 (${res.status})`);
  return data;
}
