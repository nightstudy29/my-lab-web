// src/app/api/classmaterials/route.js
//
// 강의자료(materials) 추가/수정/삭제 API.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteR2FileIfOwned } from "@/lib/r2Client";

// 자료 추가
export async function POST(request) {
  try {
    const body = await request.json();
    const { course_id, type, date, week, title, file_url, is_external_link } = body;

    if (!course_id || !type || !date || !title || !file_url) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("materials")
      .insert({
        course_id,
        type,
        date,
        week: week ?? null,
        title,
        file_url,
        is_external_link: !!is_external_link,
      })
      .select()
      .single();

    if (error) {
      console.error("자료 추가 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ material: data });
  } catch (err) {
    console.error("자료 추가 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 자료 수정 — 메타데이터(type/date/week/title)와, 외부 링크인 경우 URL 텍스트까지 수정 가능.
// 실제 업로드된 파일 자체를 교체하려면 삭제 후 다시 추가해주세요.
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, type, date, week, title, file_url, is_external_link } = body;

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const updates = {};
    if (type !== undefined) updates.type = type;
    if (date !== undefined) updates.date = date;
    if (week !== undefined) updates.week = week === "" ? null : Number(week);
    if (title !== undefined) updates.title = title;
    if (is_external_link !== undefined) updates.is_external_link = !!is_external_link;
    // file_url은 외부 링크인 경우에만 텍스트 수정 허용
    if (is_external_link && file_url !== undefined) updates.file_url = file_url;

    const { data, error } = await supabaseAdmin
      .from("materials")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("자료 수정 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ material: data });
  } catch (err) {
    console.error("자료 수정 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 자료 삭제 (?id=... 쿼리 파라미터로 받음) — R2 파일도 함께 삭제
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const { data: material } = await supabaseAdmin
      .from("materials")
      .select("*")
      .eq("id", id)
      .single();

    await deleteR2FileIfOwned(material);

    const { error } = await supabaseAdmin.from("materials").delete().eq("id", id);

    if (error) {
      console.error("자료 삭제 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("자료 삭제 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}