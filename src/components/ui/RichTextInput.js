"use client";

// 간단 서식 입력 — textarea + 서식 툴바(선택 영역을 태그로 감쌈) + 미리보기.
// 논문 제목/저자처럼 <sub>, <b><u>…</u></b> 정도만 쓰는 곳에 사용.
// 저장되는 값은 그대로 HTML 문자열이라 기존 데이터와 호환됩니다.

import { useRef } from "react";
import { FaBold, FaUnderline, FaItalic, FaSubscript, FaSuperscript, FaUserPen } from "react-icons/fa6";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import s from "./ui.module.css";

const TOOLS = [
  { key: "member", icon: <FaUserPen size={11} />, label: "랩 멤버 이름 (굵게+밑줄)", open: "<b><u>", close: "</u></b>" },
  { key: "b", icon: <FaBold size={11} />, label: "굵게", open: "<b>", close: "</b>" },
  { key: "u", icon: <FaUnderline size={11} />, label: "밑줄", open: "<u>", close: "</u>" },
  { key: "i", icon: <FaItalic size={11} />, label: "기울임", open: "<i>", close: "</i>" },
  { key: "sub", icon: <FaSubscript size={11} />, label: "아래첨자 (H₂O)", open: "<sub>", close: "</sub>" },
  { key: "sup", icon: <FaSuperscript size={11} />, label: "위첨자 (cm²)", open: "<sup>", close: "</sup>" },
];

export default function RichTextInput({ value, onChange, rows = 3, placeholder, preview = true }) {
  const ref = useRef(null);

  function wrap(open, close) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0, end = el.selectionEnd ?? 0;
    const text = value || "";
    const selected = text.slice(start, end);
    // 이미 같은 태그로 감싸져 있으면 벗기기
    const before = text.slice(0, start), after = text.slice(end);
    let next, cursorStart, cursorEnd;
    if (before.endsWith(open) && after.startsWith(close)) {
      next = before.slice(0, -open.length) + selected + after.slice(close.length);
      cursorStart = start - open.length; cursorEnd = end - open.length;
    } else {
      next = before + open + selected + close + after;
      cursorStart = start + open.length; cursorEnd = end + open.length;
    }
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(cursorStart, cursorEnd); });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
        {TOOLS.map((t) => (
          <button key={t.key} type="button" title={t.label} onClick={() => wrap(t.open, t.close)}
            className={`${s.btn} ${s.ghost} ${s.icon}`} style={t.key === "member" ? { width: "auto", padding: "0 8px", gap: 5, fontSize: "0.74rem" } : undefined}>
            {t.icon}{t.key === "member" && "멤버"}
          </button>
        ))}
        <span style={{ fontSize: "0.72rem", color: "#a5adb8", marginLeft: 4 }}>글자를 선택하고 버튼을 누르세요</span>
      </div>
      <textarea ref={ref} className={s.textarea} rows={rows} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} spellCheck={false} />
      {preview && (value || "").trim() && (
        <div style={{ marginTop: 6, padding: "8px 10px", background: "#f8f9fb", border: "1px dashed #dde2e8", borderRadius: 8, fontSize: "0.86rem", color: "#333", lineHeight: 1.5 }}>
          <span style={{ fontSize: "0.68rem", color: "#a5adb8", display: "block", marginBottom: 2 }}>미리보기</span>
          <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} />
        </div>
      )}
    </div>
  );
}
