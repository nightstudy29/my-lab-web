// src/app/api/courses/route.js
//
// 과목(courses) 추가/삭제 API. 과목을 삭제하면 딸린 materials가 DB에서는
// cascade로 자동 삭제되지만, R2에 올라간 실제 파일은 별도로 지워야 합니다.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteR2FileIfOwned } from "@/lib/r2Client";

// 과목 추가
export async function POST(request) {
  try {
    const body = await request.json();
    const { semester_id, name, sort_order } = body;

    if (!semester_id || !name) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert({
        semester_id,
        name,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("과목 추가 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ course: data });
  } catch (err) {
    console.error("과목 추가 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 과목 삭제 (딸린 materials는 DB에서 cascade 삭제, R2 파일은 여기서 직접 정리)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    // 이 과목에 딸린 자료들을 먼저 조회해서 R2 파일부터 정리
    const { data: materials } = await supabaseAdmin
      .from("materials")
      .select("*")
      .eq("course_id", id);

    if (materials && materials.length > 0) {
      await Promise.all(materials.map((m) => deleteR2FileIfOwned(m)));
    }

    const { error } = await supabaseAdmin.from("courses").delete().eq("id", id);

    if (error) {
      console.error("과목 삭제 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("과목 삭제 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}