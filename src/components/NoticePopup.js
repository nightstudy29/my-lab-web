"use client";

// 메인 페이지 공지 팝업.
// - 문구/게시 종료일은 아래 NOTICE 만 고치면 됩니다. 팝업을 내리려면 NOTICE = null.
// - 「오늘 하루 보지 않기」는 브라우저 localStorage 에 날짜를 저장합니다 (id 가 바뀌면 다시 표시).

import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "./NoticePopup.module.css";

// 현재 게시 중인 공지 없음. 다시 띄우려면 아래 예시처럼 객체를 넣으면 됩니다.
//
// const NOTICE = {
//   id: "2026-winter-intern-closed",      // 공지마다 다르게 (「오늘 하루 보지 않기」 키)
//   until: "2026-12-31",                   // 이 날짜까지 표시 (KST 기준, 해당 날짜 포함)
//   title: "2026 동계 재료공학부 학부생 인턴 프로그램 모집 마감 안내",
//   body: [                                // 문단 배열. \n 은 줄바꿈
//     "2026 동계 재료공학부 인턴 프로그램의 모집이 마감되어\n신규 지원은 더 이상 받지 않습니다.",
//     "기존 지원자분들께는 선발 절차에 따라 개별적으로 연락드릴 예정입니다.",
//   ],
// };
const NOTICE = null;

const STORAGE_KEY = "smid-notice-hidden";

function todayKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function shouldShow() {
  if (!NOTICE) return false;
  const today = todayKST();
  if (today > NOTICE.until) return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== `${NOTICE.id}:${today}`;
  } catch {
    return true; // 저장소 접근이 막힌 브라우저는 그냥 표시
  }
}

const subscribe = () => () => {};

export default function NoticePopup() {
  // 서버 렌더링에서는 숨기고, 브라우저에서 localStorage 를 확인한 뒤 표시
  const visible = useSyncExternalStore(subscribe, shouldShow, () => false);
  const [closed, setClosed] = useState(false);
  const open = visible && !closed;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setClosed(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const close = () => setClosed(true);
  const hideToday = () => {
    try {
      localStorage.setItem(STORAGE_KEY, `${NOTICE.id}:${todayKST()}`);
    } catch {}
    close();
  };

  return (
    <div className={styles.overlay} onClick={close}>
      <div
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notice-popup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.badge}>Notice</span>
          <h2 id="notice-popup-title" className={styles.title}>{NOTICE.title}</h2>
        </div>
        <div className={styles.body}>
          {NOTICE.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.linkBtn} onClick={hideToday}>
            오늘 하루 보지 않기
          </button>
          <button type="button" className={styles.closeBtn} onClick={close}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
