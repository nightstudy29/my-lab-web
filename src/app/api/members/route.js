// src/app/api/members/route.js
//
// 포털 Directory 용 멤버 목록 (로그인 필요). 연락처 포함.
//   GET ?status=active|graduated|all   (기본 active)

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireLogin } from "@/lib/auth";
import { MEMBER_COLUMNS, toDirectory } from "@/lib/memberShapes";
import { compareMembers } from "@/lib/memberConstants";

export async function GET(request) {
  try {
    const auth = await requireLogin(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";

    let query = supabaseAdmin.from("members").select(MEMBER_COLUMNS);
    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    const members = (data || []).sort(compareMembers).map(toDirectory);
    return NextResponse.json({ members });
  } catch (err) {
    console.error("멤버 목록 조회 실패:", err);
    return NextResponse.json({ error: "멤버 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}
