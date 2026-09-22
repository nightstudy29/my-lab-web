"use client";

// 오른쪽 슬라이드 패널 — 목록을 가리지 않고 추가/수정 폼을 여는 용도.
//   <SlidePanel open title="논문 추가" onClose={...} footer={<><Button…/></>}> …폼… </SlidePanel>

import { useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import s from "./ui.module.css";

export default function SlidePanel({ open, title, onClose, footer, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className={s.panelBackdrop} onClick={onClose} />
      <aside className={s.panel} role="dialog" aria-modal="true" aria-label={title}>
        <div className={s.panelHeader}>
          <h3 className={s.panelTitle}>{title}</h3>
          <button type="button" onClick={onClose} aria-label="닫기" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#6b7785", fontSize: "1.1rem", display: "flex" }}>
            <FaXmark />
          </button>
        </div>
        <div className={s.panelBody}>{children}</div>
        {footer && <div className={s.panelFooter}>{footer}</div>}
      </aside>
    </>
  );
}
