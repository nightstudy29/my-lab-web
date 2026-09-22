// src/app/api/talks/route.js
//
// 학술발표(talks) — admin 전용 CRUD. 업적 보고용 (공개 페이지에 노출 안 함).
//   GET / POST {...TALK_FIELDS} / PATCH {id, ...} / DELETE ?id=

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth";
import { TALK_FIELDS } from "@/lib/achievementConstants";

function clean(body) {
  const out = {};
  for (const f of TALK_FIELDS) {
    if (!(f in body)) continue;
    let v = body[f];
    if (typeof v === "string") v = v.trim() || null;
    if (f === "author_count") v = v == null || v === "" ? null : Number(v);
    out[f] = v;
  }
  return out;
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const { data, error } = await supabaseAdmin.from("talks").select("*").order("presented_on", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ talks: data || [] });
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const row = clean(await request.json());
  if (!row.conference || !row.title) return NextResponse.json({ error: "학술대회명과 발표제목은 필수입니다." }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("talks").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ talk: data });
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  const row = clean(body);
  if (row.conference === null || row.title === null) return NextResponse.json({ error: "학술대회명과 발표제목은 비울 수 없습니다." }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("talks").update(row).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ talk: data });
}

export async function DELETE(request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  const { error } = await supabaseAdmin.from("talks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
