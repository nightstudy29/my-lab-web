// src/app/api/classmaterials/route.js
//
// 강의자료(materials) 추가/수정/삭제 API. admin 전용.
//   type: slide | grade | notice
//   - slide/grade: file_url 필수 (업로드 파일 또는 외부 링크)
//   - notice:      content(본문) 중심. file_url 은 선택(첨부). 공개 페이지에서 제목을 누르면 본문이 펼쳐짐.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth";
import { deleteR2FileIfOwned } from "@/lib/r2Client";

const TYPES = new Set(["slide", "grade", "notice"]);
const clean = (v) => (typeof v === "string" ? v.trim() || null : v ?? null);

// 자료 추가
export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { course_id, type, date, title } = body;
    const file_url = clean(body.file_url);
    const content = clean(body.content);

    if (!course_id || !TYPES.has(type) || !date || !clean(title)) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }
    if (type !== "notice" && !file_url) {
      return NextResponse.json({ error: "강의자료/성적은 파일 또는 링크가 필요합니다." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("materials")
      .insert({
        course_id,
        type,
        date,
        title: title.trim(),
        content: type === "notice" ? content : null,
        file_url,
        is_external_link: !!body.is_external_link && !!file_url,
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

// 자료 수정 — type/date/title/content 와 첨부(외부 링크 URL, 공지의 첨부 추가·제거).
// 업로드된 파일 자체를 교체하려면 삭제 후 다시 추가.
export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

    const { data: current } = await supabaseAdmin.from("materials").select("*").eq("id", id).single();
    if (!current) return NextResponse.json({ error: "자료를 찾을 수 없습니다." }, { status: 404 });

    const updates = {};
    if (body.type !== undefined) {
      if (!TYPES.has(body.type)) return NextResponse.json({ error: "올바르지 않은 유형입니다." }, { status: 400 });
      updates.type = body.type;
    }
    if (body.date !== undefined) updates.date = body.date;
    if (body.title !== undefined) {
      if (!clean(body.title)) return NextResponse.json({ error: "제목은 비울 수 없습니다." }, { status: 400 });
      updates.title = body.title.trim();
    }
    if (body.content !== undefined) updates.content = clean(body.content);

    // 첨부 변경: file_url 이 body 에 있을 때만.
    //  - 외부 링크 → URL 텍스트 교체
    //  - 공지에서 첨부 제거(null) → 업로드 파일이었으면 R2 에서도 삭제
    if (body.file_url !== undefined) {
      const next = clean(body.file_url);
      const type = updates.type ?? current.type;
      if (!next) {
        if (type !== "notice") return NextResponse.json({ error: "강의자료/성적은 첨부를 비울 수 없습니다." }, { status: 400 });
        if (current.file_url && !current.is_external_link) await deleteR2FileIfOwned(current);
        updates.file_url = null;
        updates.is_external_link = false;
      } else if (body.is_external_link || current.is_external_link || !current.file_url) {
        // 외부 링크 설정/교체, 또는 첨부가 없던 공지에 새 첨부(업로드 URL 포함) 추가
        if (current.file_url && !current.is_external_link && next !== current.file_url) await deleteR2FileIfOwned(current);
        updates.file_url = next;
        updates.is_external_link = !!body.is_external_link;
      }
      // 업로드 파일이 있는데 다른 업로드 URL 로 바꾸는 경우는 지원하지 않음 (삭제 후 재등록)
    } else if (body.is_external_link !== undefined && current.file_url) {
      updates.is_external_link = !!body.is_external_link;
    }

    const { data, error } = await supabaseAdmin.from("materials").update(updates).eq("id", id).select().single();
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

// 자료 삭제 (?id=...) — 업로드된 R2 파일도 함께 삭제
export async function DELETE(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

    const { data: material } = await supabaseAdmin.from("materials").select("*").eq("id", id).single();
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
