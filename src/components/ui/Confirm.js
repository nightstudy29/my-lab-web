"use client";

// 확인 모달. const confirm = useConfirm();  if (!(await confirm({ title, message, confirmText, danger }))) return;
// Provider 밖에서는 window.confirm 으로 폴백.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import s from "./ui.module.css";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { title, message, confirmText, cancelText, danger, resolve }
  const confirmBtn = useRef(null);

  const confirm = useCallback((opts) => new Promise((resolve) => {
    setState({ title: "확인", confirmText: "확인", cancelText: "취소", danger: false, ...(typeof opts === "string" ? { message: opts } : opts), resolve });
  }), []);

  const close = useCallback((result) => {
    setState((prev) => { prev?.resolve(result); return null; });
  }, []);

  useEffect(() => {
    if (!state) return;
    confirmBtn.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") close(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className={s.backdrop} onClick={() => close(false)} role="dialog" aria-modal="true">
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={s.modalTitle}>{state.title}</h3>
            {state.message && <p className={s.modalMessage}>{state.message}</p>}
            <div className={s.modalActions}>
              <button type="button" className={`${s.btn} ${s.ghost} ${s.md}`} onClick={() => close(false)}>{state.cancelText}</button>
              <button ref={confirmBtn} type="button" className={`${s.btn} ${state.danger ? s.dangerSolid : s.primary} ${s.md}`} onClick={() => close(true)}>{state.confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  return ctx || ((opts) => Promise.resolve(window.confirm(typeof opts === "string" ? opts : [opts.title, opts.message].filter(Boolean).join("\n\n"))));
}
