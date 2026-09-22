"use client";

// 토스트 알림. 포털 최상단에 <ToastProvider> 를 두고, 컴포넌트에서 const toast = useToast(); toast.success("저장됨")
// Provider 밖에서 호출되면 alert 로 폴백하므로 어디서 써도 안전합니다.

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { FaCircleCheck, FaCircleExclamation, FaCircleInfo } from "react-icons/fa6";
import s from "./ui.module.css";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const remove = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const push = useCallback((type, message, duration) => {
    const id = ++seq.current;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
    setTimeout(() => remove(id), duration ?? (type === "error" ? 5000 : 3000));
  }, [remove]);

  const api = useMemo(() => ({
    success: (m, d) => push("success", m, d),
    error: (m, d) => push("error", m, d),
    info: (m, d) => push("info", m, d),
  }), [push]);

  const Icon = { success: FaCircleCheck, error: FaCircleExclamation, info: FaCircleInfo };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={s.toastStack} aria-live="polite">
        {toasts.map((t) => {
          const I = Icon[t.type];
          return (
            <div key={t.id} className={`${s.toast} ${t.type === "success" ? s.toastSuccess : t.type === "error" ? s.toastError : ""}`}>
              <I className={s.toastIcon} />
              <span>{t.message}</span>
              <button className={s.toastClose} onClick={() => remove(t.id)} aria-label="닫기">✕</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const fallback = {
  success: (m) => alert(m),
  error: (m) => alert(m),
  info: (m) => alert(m),
};

export function useToast() {
  return useContext(ToastContext) || fallback;
}
