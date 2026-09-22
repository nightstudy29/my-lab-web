"use client";

// Admin 공통 UI 키트 — 버튼/입력/카드/툴바/표/배지/빈 상태/세그먼트.
// 토스트: useToast(), 확인 모달: useConfirm(), 슬라이드 패널: <SlidePanel>  (같은 폴더의 다른 파일)

import { FaMagnifyingGlass } from "react-icons/fa6";
import s from "./ui.module.css";

export { default as SlidePanel } from "./SlidePanel";
export { ToastProvider, useToast } from "./Toast";
export { ConfirmProvider, useConfirm } from "./Confirm";

const cx = (...a) => a.filter(Boolean).join(" ");

export function Button({ variant = "primary", size = "md", className, children, ...rest }) {
  return (
    <button type="button" className={cx(s.btn, s[variant], s[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function Input({ className, ...rest }) {
  return <input className={cx(s.input, className)} {...rest} />;
}
export function Select({ className, children, ...rest }) {
  return <select className={cx(s.select, className)} {...rest}>{children}</select>;
}
export function Textarea({ className, ...rest }) {
  return <textarea className={cx(s.textarea, className)} {...rest} />;
}

export function Field({ label, hint, required, className, children }) {
  return (
    <label className={cx(s.field, className)}>
      {label && <span className={s.fieldLabel}>{label}{required && <span className={s.required}> *</span>}</span>}
      {children}
      {hint && <span className={s.fieldHint}>{hint}</span>}
    </label>
  );
}

export function Card({ tight, className, children, style }) {
  return <div className={cx(s.card, tight && s.cardTight, className)} style={style}>{children}</div>;
}

export function Toolbar({ title, count, children }) {
  return (
    <div className={s.toolbar}>
      {title && <h3 className={s.toolbarTitle}>{title}{count != null && <span className={s.toolbarCount}>{count}</span>}</h3>}
      <div className={s.toolbarSpacer} />
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "검색", style }) {
  return (
    <div className={s.search} style={style}>
      <FaMagnifyingGlass className={s.searchIcon} />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function Table({ children }) {
  return <div className={s.tableWrap}><table className={s.table}>{children}</table></div>;
}
export const td = { right: s.tdRight, muted: s.tdMuted, actions: s.actions };

export function Badge({ color = "gray", children }) {
  const map = { blue: s.badgeBlue, green: s.badgeGreen, red: s.badgeRed, orange: s.badgeOrange, gray: s.badgeGray };
  return <span className={cx(s.badge, map[color])}>{children}</span>;
}

export function Empty({ children }) {
  return <div className={s.empty}>{children}</div>;
}

export function Segment({ value, onChange, options }) {
  return (
    <div className={s.segment}>
      {options.map(([k, label]) => (
        <button key={k} type="button" className={cx(s.segmentBtn, value === k && s.segmentBtnActive)} onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function FormGrid({ cols = 2, children }) {
  return <div className={cols === 3 ? s.grid3 : s.grid2}>{children}</div>;
}
export const span2 = s.span2;
