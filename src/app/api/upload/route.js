// src/app/api/upload/route.js
//
// 관리자 폼에서 파일을 선택하면 이 API가 Cloudflare R2에 업로드하고
// 공개 URL을 돌려줍니다. FormData로 파일 하나를 받습니다.

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 파일명 충돌 방지를 위해 타임스탬프 + 원본 파일명으로 key 생성
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `classmaterial/${Date.now()}-${safeName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("R2 업로드 실패:", err);
    return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
  }
}