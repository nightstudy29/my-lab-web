// src/app/api/news/route.js
//
// 뉴스(news) 추가/수정/삭제 API.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteR2UrlIfOwned } from "@/lib/r2Client";

// 뉴스 추가
export async function POST(request) {
  try {
    const body = await request.json();
    const { date, category, title, description, link, images } = body;

    if (!date || !category || !title || !description) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("news")
      .insert({
        date,
        category,
        title,
        description,
        link: link || null,
        images: images && images.length > 0 ? images : [],
      })
      .select()
      .single();

    if (error) {
      console.error("뉴스 추가 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ news: data });
  } catch (err) {
    console.error("뉴스 추가 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 뉴스 수정 — images는 "수정 후 최종 배열"을 통째로 받습니다.
// 기존에 있었는데 이번 최종 배열에서 빠진 이미지는 R2에서 자동으로 삭제합니다.
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, date, category, title, description, link, images } = body;

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const updates = {};
    if (date !== undefined) updates.date = date;
    if (category !== undefined) updates.category = category;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (link !== undefined) updates.link = link || null;

    if (images !== undefined) {
      const { data: current } = await supabaseAdmin
        .from("news")
        .select("images")
        .eq("id", id)
        .single();

      const oldImages = current?.images || [];
      const removed = oldImages.filter((url) => !images.includes(url));

      if (removed.length > 0) {
        await Promise.all(removed.map((url) => deleteR2UrlIfOwned(url)));
      }

      updates.images = images;
    }

    const { data, error } = await supabaseAdmin
      .from("news")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("뉴스 수정 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ news: data });
  } catch (err) {
    console.error("뉴스 수정 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 뉴스 삭제 (?id=... 쿼리 파라미터로 받음) — images 배열의 R2 파일도 함께 삭제
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const { data: newsItem } = await supabaseAdmin
      .from("news")
      .select("images")
      .eq("id", id)
      .single();

    if (newsItem?.images && newsItem.images.length > 0) {
      await Promise.all(newsItem.images.map((url) => deleteR2UrlIfOwned(url)));
    }

    const { error } = await supabaseAdmin.from("news").delete().eq("id", id);

    if (error) {
      console.error("뉴스 삭제 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("뉴스 삭제 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}