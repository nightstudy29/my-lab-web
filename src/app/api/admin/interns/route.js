// src/app/api/admin/interns/route.js
//
// 단기 인턴 기록 (admin 전용). 공개 페이지 Former Interns 섹션 데이터.
//   GET / POST {name_eng, name_kor?, participations[], achievements[], sort_order?}
//   PATCH {id, ...} / DELETE ?id=

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth";

function clean(body) {
  const out = {};
  if ("name_eng" in body) out.name_eng = String(body.name_eng || "").trim() || null;
  if ("name_kor" in body) out.name_kor = String(body.name_kor || "").trim() || null;
  if ("sort_order" in body) out.sort_order = body.sort_order === null || body.sort_order === "" ? null : Number(body.sort_order);
  if ("participations" in body) {
    out.participations = (Array.isArray(body.participations) ? body.participations : [])
      .map((p) => ({ program: String(p.program || "").trim(), period: String(p.period || "").trim() }))
      .filter((p) => p.program || p.period);
  }
  if ("achievements" in body) {
    out.achievements = (Array.isArray(body.achievements) ? body.achievements : [])
      .map((a) => ({ type: a.type === "paper" ? "paper" : "award", title: String(a.title || "").trim(), url: String(a.url || "").trim() }))
      .filter((a) => a.title || a.url);
  }
  return out;
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const { data, error } = await supabaseAdmin.from("interns").select("*").order("sort_order", { ascending: true, nullsFirst: false }).order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ interns: data || [] });
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const row = clean(await request.json());
  if (!row.name_eng) return NextResponse.json({ error: "영어 이름은 필수입니다." }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("interns").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ intern: data });
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  const row = clean(body);
  if (row.name_eng === null) return NextResponse.json({ error: "영어 이름은 비울 수 없습니다." }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("interns").update(row).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ intern: data });
}

export async function DELETE(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  const { error } = await supabaseAdmin.from("interns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
