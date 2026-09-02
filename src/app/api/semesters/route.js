// src/app/api/semesters/route.js
//
// 학기(semesters) 생성/전환/삭제 API.
// "새 학기 시작" = 새 학기 생성 + is_current를 true로, 나머지 학기는 전부 false로.
// "학기 전환" = 기존 학기를 다시 is_current로 (PATCH).
// "학기 삭제" = DB의 딸린 과목/자료는 cascade로 삭제되지만, R2에 올라간 실제
//              파일들은 여기서 먼저 전부 조회해서 지운 다음 DB를 삭제합니다.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteR2FileIfOwned } from "@/lib/r2Client";

// 새 학기 생성 (자동으로 현재 학기로 설정, 기존 학기들은 비활성화)
export async function POST(request) {
  try {
    const body = await request.json();
    const { label } = body;

    if (!label) {
      return NextResponse.json({ error: "학기 이름(label)이 필요합니다." }, { status: 400 });
    }

    const { error: deactivateError } = await supabaseAdmin
      .from("semesters")
      .update({ is_current: false })
      .eq("is_current", true);

    if (deactivateError) {
      console.error("기존 학기 비활성화 실패:", deactivateError);
      return NextResponse.json({ error: deactivateError.message }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("semesters")
      .insert({ label, is_current: true })
      .select()
      .single();

    if (error) {
      console.error("학기 생성 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ semester: data });
  } catch (err) {
    console.error("학기 생성 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 기존 학기를 다시 "현재 학기"로 전환 (지난 학기 복원/보관 학기 간 전환용)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const { error: deactivateError } = await supabaseAdmin
      .from("semesters")
      .update({ is_current: false })
      .eq("is_current", true);

    if (deactivateError) {
      console.error("기존 학기 비활성화 실패:", deactivateError);
      return NextResponse.json({ error: deactivateError.message }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("semesters")
      .update({ is_current: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("학기 전환 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ semester: data });
  } catch (err) {
    console.error("학기 전환 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 학기 완전 삭제 — R2 파일 먼저 전부 정리한 다음 DB 삭제 (cascade로 과목/자료도 함께)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    // 1) 이 학기에 속한 과목들 조회
    const { data: courses } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("semester_id", id);

    const courseIds = (courses || []).map((c) => c.id);

    // 2) 그 과목들에 속한 자료들 조회 후 R2 파일 삭제
    if (courseIds.length > 0) {
      const { data: materials } = await supabaseAdmin
        .from("materials")
        .select("*")
        .in("course_id", courseIds);

      if (materials && materials.length > 0) {
        await Promise.all(materials.map((m) => deleteR2FileIfOwned(m)));
      }
    }

    // 3) 학기 삭제 (DB에서 course/material은 cascade로 자동 삭제됨)
    const { error } = await supabaseAdmin.from("semesters").delete().eq("id", id);

    if (error) {
      console.error("학기 삭제 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("학기 삭제 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}