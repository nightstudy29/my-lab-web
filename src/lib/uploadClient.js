// src/lib/uploadClient.js
//
// 브라우저(관리자 패널)에서 쓰는 업로드 헬퍼.
//   1) /api/upload-url 에서 presigned URL을 받고
//   2) R2에 직접 PUT (진행률 콜백 지원)
// 이미지는 업로드 전에 브라우저에서 리사이즈할 수 있습니다 (기본: 장변 2000px, JPEG 85%).
//
// FileUploader 컴포넌트가 다루는 "item" 형태:
//   { id, kind: 'existing' | 'new', url?, file?, previewUrl?, name, size,
//     status: 'ready' | 'uploading' | 'done' | 'error', progress: 0~100, error? }

const RESIZE_DEFAULTS = { maxEdge: 2000, quality: 0.85 };

let idSeq = 0;
function nextId() {
  idSeq += 1;
  return `up-${Date.now()}-${idSeq}`;
}

export function isImageFile(fileOrName, type) {
  const t = type ?? fileOrName?.type ?? "";
  if (t) return t.startsWith("image/");
  return /\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(fileOrName?.name ?? String(fileOrName ?? ""));
}

export function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|avif|bmp)(\?|$)/i.test(url || "");
}

// 이미 올라가 있는 URL들 → item 배열 (뉴스 수정 시 기존 사진)
export function itemsFromUrls(urls) {
  return (urls || []).map((url) => ({
    id: nextId(),
    kind: "existing",
    url,
    previewUrl: isImageUrl(url) ? url : null,
    name: decodeURIComponent(url.split("/").pop() || ""),
    size: null,
    status: "done",
    progress: 100,
  }));
}

// 사용자가 고른 File들 → item 배열
export function itemsFromFiles(files) {
  return Array.from(files || []).map((file) => ({
    id: nextId(),
    kind: "new",
    file,
    previewUrl: isImageFile(file) ? URL.createObjectURL(file) : null,
    name: file.name,
    size: file.size,
    status: "ready",
    progress: 0,
  }));
}

export function revokeItemPreview(item) {
  if (item?.kind === "new" && item.previewUrl) {
    try { URL.revokeObjectURL(item.previewUrl); } catch {}
  }
}

export function formatBytes(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ===== 이미지 리사이즈 =====
async function loadBitmap(file) {
  // EXIF 회전을 반영해서 디코딩 (지원 안 되는 브라우저는 <img>로 폴백)
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {}
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("이미지를 읽을 수 없습니다.")); };
    img.src = url;
  });
}

export async function resizeImageIfNeeded(file, options = {}) {
  const { maxEdge, quality } = { ...RESIZE_DEFAULTS, ...options };
  // gif(애니메이션)/svg는 재인코딩하면 깨지므로 그대로
  if (!isImageFile(file) || /gif|svg/.test(file.type)) return file;

  let bitmap;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    return file;
  }

  const w = bitmap.width, h = bitmap.height;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const keepPng = file.type === "image/png";
  // 이미 작고 PNG면 그대로, 이미 작은 JPEG도 원본 유지
  if (scale === 1) { bitmap.close?.(); return file; }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const outType = keepPng ? "image/png" : "image/jpeg";
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, outType, keepPng ? undefined : quality));
  if (!blob || blob.size >= file.size) return file; // 오히려 커지면 원본 사용

  const newName = keepPng ? file.name : file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: outType, lastModified: Date.now() });
}

// ===== R2 직접 업로드 =====
export async function uploadToR2(file, { folder, onProgress, signal } = {}) {
  const res = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      folder,
    }),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "업로드 URL 발급 실패");

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", data.uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`R2 업로드 실패 (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("R2 업로드 중 네트워크 오류 (버킷 CORS 설정을 확인하세요)"));
    xhr.onabort = () => reject(new Error("업로드가 취소되었습니다."));
    if (signal) signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });

  return { url: data.publicUrl, key: data.key };
}

// item 배열 중 아직 안 올라간(kind:'new') 것들을 올리고, 순서를 유지한 새 item 배열을 돌려줍니다.
// onItemsChange(items)로 진행률이 반영된 배열을 계속 통지하므로 화면에 바로 바인딩할 수 있습니다.
// 하나라도 실패하면 해당 item에 status:'error'를 남기고 Error를 throw 합니다.
export async function uploadItems(items, { folder, resizeImages = false, resizeOptions, onItemsChange, concurrency = 3 } = {}) {
  let current = items.map((it) => ({ ...it }));
  const emit = () => onItemsChange?.(current.map((it) => ({ ...it })));
  const update = (id, patch) => {
    current = current.map((it) => (it.id === id ? { ...it, ...patch } : it));
    emit();
  };

  const pending = current.filter((it) => it.kind === "new" && it.status !== "done");
  let failed = null;

  const worker = async () => {
    while (pending.length && !failed) {
      const it = pending.shift();
      try {
        update(it.id, { status: "uploading", progress: 0, error: undefined });
        let file = it.file;
        if (resizeImages && isImageFile(file)) {
          file = await resizeImageIfNeeded(file, resizeOptions);
        }
        const { url } = await uploadToR2(file, {
          folder,
          onProgress: (p) => update(it.id, { progress: p }),
        });
        update(it.id, { status: "done", progress: 100, url, size: file.size });
      } catch (err) {
        failed = failed || err;
        update(it.id, { status: "error", error: err.message });
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length || 1) }, worker));
  if (failed) throw failed;
  return current;
}
