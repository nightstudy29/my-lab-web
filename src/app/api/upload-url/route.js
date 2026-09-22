// src/app/api/upload-url/route.js
//
// R2 직접 업로드용 presigned PUT URL 발급.
//
// 예전 /api/upload 은 파일 본문이 Vercel 함수를 통과해서 4.5MB 제한에 걸렸습니다.
// 이제는 브라우저가 여기서 서명된 URL만 받아서 R2에 직접 PUT 하므로 크기 제한이
// 사실상 없어집니다(아래 MAX_SIZE만 적용). 파일 본문은 서버를 거치지 않습니다.
//
// 요청:  POST { filename, contentType, size, folder }
// 응답:  { uploadUrl, publicUrl, key }
//   - uploadUrl: 5분간 유효. 브라우저가 이 URL로 PUT (Content-Type 헤더를 요청과 동일하게).
//   - publicUrl: 업로드 완료 후 DB에 저장할 공개 URL.

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/r2Client";
import { requireRole } from "@/lib/auth";
import { CONTENT_ROLES, ROLES } from "@/lib/roles";

const FOLDERS = new Set(["news", "classmaterial", "members"]);
const MAX_SIZE = 200 * 1024 * 1024; // 200MB
const URL_TTL_SEC = 5 * 60;

// 브라우저에서 실행될 수 있는 형식은 막습니다. 그 외(pdf, hwp, pptx, zip, 이미지, 영상 등)는 허용.
const BLOCKED_EXT = new Set(["exe", "bat", "cmd", "com", "msi", "sh", "ps1", "js", "mjs", "html", "htm", "svg", "php", "jar"]);

function splitName(filename) {
  const base = String(filename || "file").split(/[\\/]/).pop();
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return { stem: base, ext: "" };
  return { stem: base.slice(0, dot), ext: base.slice(dot + 1).toLowerCase() };
}

export async function POST(request) {
  try {
    // 폴더별 권한: members(프로필 사진) = 로그인한 누구나, news = admin/manager, classmaterial = admin
    const auth = await requireRole(request, ROLES);
    if (auth.response) return auth.response;

    const { filename, contentType, size, folder } = await request.json();

    if (!FOLDERS.has(folder)) {
      return NextResponse.json({ error: "허용되지 않은 업로드 위치입니다." }, { status: 400 });
    }
    if (folder === "classmaterial" && auth.user.role !== "admin") {
      return NextResponse.json({ error: "강의자료 업로드는 관리자만 가능합니다." }, { status: 403 });
    }
    if (folder === "news" && !CONTENT_ROLES.includes(auth.user.role)) {
      return NextResponse.json({ error: "뉴스 사진 업로드 권한이 없습니다." }, { status: 403 });
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE) {
      return NextResponse.json({ error: `파일 크기는 ${MAX_SIZE / 1024 / 1024}MB 이하여야 합니다.` }, { status: 400 });
    }

    const { stem, ext } = splitName(filename);
    if (BLOCKED_EXT.has(ext)) {
      return NextResponse.json({ error: `.${ext} 파일은 업로드할 수 없습니다.` }, { status: 400 });
    }

    // 한글 등 비ASCII는 _ 로 바꾸되 길이는 제한. 화면에 보이는 이름은 DB의 title이라 key는 식별용이면 충분.
    const safeStem = stem.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(0, 60) || "file";
    const key = `${folder}/${Date.now()}-${randomBytes(4).toString("hex")}-${safeStem}${ext ? `.${ext}` : ""}`;
    const type = typeof contentType === "string" && contentType ? contentType : "application/octet-stream";

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: type,
      }),
      { expiresIn: URL_TTL_SEC }
    );

    return NextResponse.json({
      uploadUrl,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
      key,
    });
  } catch (err) {
    console.error("업로드 URL 발급 실패:", err);
    return NextResponse.json({ error: "업로드 URL을 발급하지 못했습니다." }, { status: 500 });
  }
}
