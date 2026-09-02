// src/lib/r2Client.js
//
// R2 업로드/삭제에 공통으로 쓰는 S3 클라이언트와 헬퍼 함수들.

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// 공개 URL(예: https://pub-xxx.r2.dev/classmaterial/168...-file.pdf)에서
// R2 객체 key(예: classmaterial/168...-file.pdf)만 추출합니다.
// R2 공개 URL이 아닌 경우(외부 링크, 과거 로컬 이미지 경로 등)는 null을 돌려줍니다.
function extractKeyFromUrl(fileUrl) {
  const prefix = `${process.env.R2_PUBLIC_URL}/`;
  if (!fileUrl || !fileUrl.startsWith(prefix)) return null;
  return fileUrl.slice(prefix.length);
}

// URL 하나를 받아서, 그게 우리 R2 버킷의 공개 URL이면 실제 객체를 삭제합니다.
// R2 URL이 아니면(외부 링크, 로컬 경로 등) 조용히 무시합니다.
export async function deleteR2UrlIfOwned(url) {
  const key = extractKeyFromUrl(url);
  if (!key) return;

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (err) {
    console.error(`R2 파일 삭제 실패 (key: ${key}):`, err);
  }
}

// 자료 하나(row)를 받아서, 그게 R2에 올라간 파일(외부 링크가 아닌 경우)이면
// 실제 R2 객체를 삭제합니다. classmaterial의 materials 테이블용.
export async function deleteR2FileIfOwned(material) {
  if (!material || material.is_external_link) return;
  await deleteR2UrlIfOwned(material.file_url);
}