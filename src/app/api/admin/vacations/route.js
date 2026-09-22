// src/app/api/admin/vacations/route.js
//
// 휴가 관리 (admin 전용). 연도별 7일 체크 + 메모. member_vacations 에 (member_id, year) 로 upsert.
//   GET   ?year=2026            → { year, rows: [{ memberId, nameKor, position, days[7], memo }] }  (active 멤버 전원)
//   PATCH { memberId, year, dayIndex? , memo? } → dayIndex 가 있으면 그 날 토글, memo 가 있으면 메모 저장

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth";
import { compareMembers } from "@/lib/memberConstants";

const EMPTY = () => [false, false, false, false, false, false, false];

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const year = Number(new URL(request.url).searchParams.get("year")) || new Date().getFullYear();

    const [{ data: members, error: e1 }, { data: vacs, error: e2 }] = await Promise.all([
      supabaseAdmin.from("members").select("id, name_kor, name_eng, position, year_joined, sort_order").eq("status", "active"),
      supabaseAdmin.from("member_vacations").select("member_id, days, memo").eq("year", year),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;

    const byMember = new Map((vacs || []).map((v) => [v.member_id, v]));
    const rows = (members || [])
      .filter((m) => m.position !== "PI" && m.position !== "Staff")
      .sort(compareMembers)
      .map((m) => {
        const v = byMember.get(m.id);
        return { memberId: m.id, nameKor: m.name_kor, position: m.position, days: v?.days || EMPTY(), memo: v?.memo || "" };
      });

    return NextResponse.json({ year, rows });
  } catch (err) {
    console.error("휴가 조회 실패:", err);
    return NextResponse.json({ error: "휴가 정보를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { memberId, year, dayIndex, memo } = await request.json();
    const y = Number(year);
    if (!memberId || !y) return NextResponse.json({ error: "memberId 와 year 가 필요합니다." }, { status: 400 });

    const { data: cur } = await supabaseAdmin
      .from("member_vacations").select("days, memo").eq("member_id", memberId).eq("year", y).maybeSingle();

    const days = [...(cur?.days || EMPTY())];
    if (Number.isInteger(dayIndex) && dayIndex >= 0 && dayIndex < 7) days[dayIndex] = !days[dayIndex];
    const newMemo = memo !== undefined ? String(memo).slice(0, 200) : (cur?.memo ?? null);

    const { data, error } = await supabaseAdmin
      .from("member_vacations")
      .upsert({ member_id: memberId, year: y, days, memo: newMemo }, { onConflict: "member_id,year" })
      .select("member_id, year, days, memo")
      .single();
    if (error) throw error;

    return NextResponse.json({ row: { memberId: data.member_id, year: data.year, days: data.days, memo: data.memo || "" } });
  } catch (err) {
    console.error("휴가 저장 실패:", err);
    return NextResponse.json({ error: "휴가 정보를 저장하지 못했습니다." }, { status: 500 });
  }
}
