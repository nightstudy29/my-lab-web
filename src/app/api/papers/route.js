// src/app/api/papers/route.js
//
// 논문(papers) 추가/수정/삭제 API.

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { CONTENT_ROLES } from "@/lib/roles";
import { ACH_FIELDS, ACH_NUMERIC, ROLES as ACH_ROLES, PUB_TYPES } from "@/lib/achievementConstants";

// 업적 컬럼 화이트리스트 — body 에 있는 것만 반영. 빈 문자열은 null.
function pickAchievement(body) {
  const out = {};
  for (const f of ACH_FIELDS) {
    if (!(f in body)) continue;
    let v = body[f];
    if (v === "" || v === undefined) v = null;
    if (v != null && ACH_NUMERIC.includes(f)) { v = Number(v); if (!Number.isFinite(v)) v = null; }
    if (v != null && typeof v === "string") v = v.trim() || null;
    out[f] = v;
  }
  if (out.role && !ACH_ROLES.includes(out.role)) throw new Error("역할은 제1저자/교신저자/공동저자 중 하나여야 합니다.");
  if (out.pub_type && !PUB_TYPES.includes(out.pub_type)) throw new Error("게재지구분 값이 올바르지 않습니다.");
  return out;
}
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 논문 추가
export async function POST(request) {
  try {
    const auth = await requireRole(request, CONTENT_ROLES);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { year, title, authors, journal, url, news } = body;

    if (!year || !title || !authors) {
      return NextResponse.json({ error: "필수 항목(연도/제목/저자)이 누락되었습니다." }, { status: 400 });
    }

    let ach;
    try { ach = pickAchievement(body); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }

    const { data, error } = await supabaseAdmin
      .from("papers")
      .insert({
        year: Number(year),
        title,
        authors,
        journal: journal || null,
        url: url || null,
        news: news && news.length > 0 ? news : [],
        ...ach,
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
    const auth = await requireRole(request, CONTENT_ROLES);
    if (auth.response) return auth.response;

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
    try { Object.assign(updates, pickAchievement(body)); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }

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
    const auth = await requireRole(request, CONTENT_ROLES);
    if (auth.response) return auth.response;

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