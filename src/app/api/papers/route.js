// src/app/api/papers/route.js
//
// 논문(papers) 추가/수정/삭제 API.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 논문 추가
export async function POST(request) {
  try {
    const body = await request.json();
    const { year, title, authors, journal, url, news } = body;

    if (!year || !title || !authors) {
      return NextResponse.json({ error: "필수 항목(연도/제목/저자)이 누락되었습니다." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("papers")
      .insert({
        year: Number(year),
        title,
        authors,
        journal: journal || null,
        url: url || null,
        news: news && news.length > 0 ? news : [],
      })
      .select()
      .single();

    if (error) {
      console.error("논문 추가 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paper: data });
  } catch (err) {
    console.error("논문 추가 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 논문 수정
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, year, title, authors, journal, url, news } = body;

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const updates = {};
    if (year !== undefined) updates.year = Number(year);
    if (title !== undefined) updates.title = title;
    if (authors !== undefined) updates.authors = authors;
    if (journal !== undefined) updates.journal = journal || null;
    if (url !== undefined) updates.url = url || null;
    if (news !== undefined) updates.news = news;

    const { data, error } = await supabaseAdmin
      .from("papers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("논문 수정 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paper: data });
  } catch (err) {
    console.error("논문 수정 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 논문 삭제 (?id=... 쿼리 파라미터로 받음)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("papers").delete().eq("id", id);

    if (error) {
      console.error("논문 삭제 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("논문 삭제 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}