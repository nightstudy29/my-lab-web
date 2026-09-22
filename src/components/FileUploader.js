"use client";

// 드래그앤드롭 파일 업로더 (관리자 패널 공용).
//
// 제어형 컴포넌트입니다: items / onChange 로 상태를 부모가 가집니다.
// 실제 업로드는 부모가 저장 시점에 uploadItems()로 수행하고, 진행률은 items에 반영되어 여기 표시됩니다.
//
//   <FileUploader
//     items={form.images}
//     onChange={(items) => setForm(...)}
//     multiple            // 여러 파일 (기본 true)
//     accept="image/*"    // 파일 선택창 필터
//     reorderable         // 순서 변경 UI (기본 multiple 과 동일)
//     disabled
//     hint="사진은 자동으로 장변 2000px로 줄여서 올라갑니다"
//   />

import { useRef, useState, useEffect } from "react";
import { FaCloudArrowUp, FaFile, FaFilePdf, FaXmark, FaChevronUp, FaChevronDown, FaGripVertical, FaTriangleExclamation, FaCheck } from "react-icons/fa6";
import { itemsFromFiles, revokeItemPreview, formatBytes } from "@/lib/uploadClient";
import styles from "./FileUploader.module.css";

function FileIcon({ name }) {
  if (/\.pdf$/i.test(name)) return <FaFilePdf />;
  return <FaFile />;
}

export default function FileUploader({
  items = [],
  onChange,
  multiple = true,
  accept,
  reorderable = multiple,
  disabled = false,
  hint,
  maxFiles,
}) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  // 언마운트 시 blob 미리보기 URL 정리 (최신 items를 ref로 추적)
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => () => itemsRef.current.forEach(revokeItemPreview), []);

  const isBusy = items.some((it) => it.status === "uploading");
  const locked = disabled || isBusy;

  function addFiles(fileList) {
    if (locked) return;
    let incoming = itemsFromFiles(fileList);
    if (incoming.length === 0) return;

    if (!multiple) {
      items.forEach(revokeItemPreview);
      onChange([incoming[0]]);
      return;
    }
    if (maxFiles) incoming = incoming.slice(0, Math.max(0, maxFiles - items.length));
    onChange([...items, ...incoming]);
  }

  function removeAt(index) {
    if (locked) return;
    revokeItemPreview(items[index]);
    onChange(items.filter((_, i) => i !== index));
  }

  function move(from, to) {
    if (locked || to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  // ----- 드롭존 -----
  function onDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    if (dragIndex !== null) return; // 내부 순서변경 드래그는 여기서 무시
    addFiles(e.dataTransfer.files);
  }

  // ----- 항목 드래그로 순서 변경 -----
  function onItemDragStart(index) {
    if (!reorderable || locked) return;
    setDragIndex(index);
  }
  function onItemDragOver(e, index) {
    if (dragIndex === null) return;
    e.preventDefault();
    setOverIndex(index);
  }
  function onItemDrop(e, index) {
    if (dragIndex === null) return;
    e.preventDefault();
    e.stopPropagation();
    move(dragIndex, index);
    setDragIndex(null);
    setOverIndex(null);
  }
  function onItemDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className={styles.wrapper}>
      {/* 드롭존 */}
      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ""} ${locked ? styles.dropzoneDisabled : ""}`}
        onClick={() => !locked && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (dragIndex === null && !locked) setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={locked ? -1 : 0}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !locked) { e.preventDefault(); inputRef.current?.click(); } }}
        aria-disabled={locked}
      >
        <FaCloudArrowUp className={styles.dropIcon} />
        <div className={styles.dropText}>
          <strong>{multiple ? "파일을 여기에 끌어다 놓거나" : "파일을 여기에 끌어다 놓거나"}</strong> 클릭해서 선택
        </div>
        {hint && <div className={styles.dropHint}>{hint}</div>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className={styles.hiddenInput}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          disabled={locked}
        />
      </div>

      {/* 파일 목록 */}
      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((it, index) => {
            const isImage = !!it.previewUrl;
            return (
              <li
                key={it.id}
                className={`${styles.item} ${overIndex === index && dragIndex !== null && dragIndex !== index ? styles.itemOver : ""} ${dragIndex === index ? styles.itemDragging : ""} ${it.status === "error" ? styles.itemError : ""}`}
                draggable={reorderable && !locked}
                onDragStart={() => onItemDragStart(index)}
                onDragOver={(e) => onItemDragOver(e, index)}
                onDrop={(e) => onItemDrop(e, index)}
                onDragEnd={onItemDragEnd}
              >
                {reorderable && (
                  <span className={styles.grip} title="끌어서 순서 변경"><FaGripVertical /></span>
                )}

                {reorderable && <span className={styles.orderNo}>{index + 1}</span>}

                <div className={styles.thumb}>
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- blob/R2 URL 미리보기라 next/image 대상 아님
                    <img src={it.previewUrl} alt="" />
                  ) : (
                    <span className={styles.thumbIcon}><FileIcon name={it.name} /></span>
                  )}
                </div>

                <div className={styles.meta}>
                  <div className={styles.name} title={it.name}>{it.name}</div>
                  <div className={styles.sub}>
                    {it.kind === "existing" && it.status === "done" && <span className={styles.badgeExisting}>기존</span>}
                    {it.kind === "new" && it.status === "done" && <span className={styles.badgeDone}><FaCheck size={9} /> 업로드됨</span>}
                    {it.size != null && <span>{formatBytes(it.size)}</span>}
                    {it.status === "error" && <span className={styles.errorText}><FaTriangleExclamation size={10} /> {it.error}</span>}
                  </div>
                  {it.status === "uploading" && (
                    <div className={styles.progress}><div className={styles.progressBar} style={{ width: `${it.progress}%` }} /></div>
                  )}
                </div>

                <div className={styles.actions}>
                  {reorderable && (
                    <>
                      <button type="button" className={styles.iconBtn} onClick={() => move(index, index - 1)} disabled={locked || index === 0} aria-label="위로"><FaChevronUp size={11} /></button>
                      <button type="button" className={styles.iconBtn} onClick={() => move(index, index + 1)} disabled={locked || index === items.length - 1} aria-label="아래로"><FaChevronDown size={11} /></button>
                    </>
                  )}
                  <button type="button" className={`${styles.iconBtn} ${styles.removeBtn}`} onClick={() => removeAt(index)} disabled={locked} aria-label="삭제"><FaXmark size={12} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
