// src/app/api/admin/members/route.js
//
// Directory Master (admin 전용) — 멤버 전체 CRUD + 계정 연결.
//   GET                → { members: [...admin shape], unlinkedUsers: [{userId, name}] }
//   POST   {...fields} → 새 멤버 (name_kor 필수)
//   PATCH  {id, ...fields} → 모든 필드 수정 가능 (user_id 로 계정 연결/해제 포함)
//   DELETE ?id=        → 삭제 (휴가 기록은 cascade)

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth";
import { MEMBER_COLUMNS, toAdmin } from "@/lib/memberShapes";
import {
  SELF_EDITABLE_FIELDS, ADMIN_ONLY_FIELDS, POSITIONS, DEGREES, STATUSES, compareMembers,
} from "@/lib/memberConstants";

const ALL_FIELDS = [...SELF_EDITABLE_FIELDS, ...ADMIN_ONLY_FIELDS];

function pickUpdates(body) {
  const updates = {};
  for (const f of ALL_FIELDS) {
    if (!(f in body)) continue;
    let v = body[f];
    if (typeof v === "string") v = v.trim() || null;
    if (f === "is_public") v = !!v;
    if (f === "sort_order") v = v === null || v === "" ? null : Number(v);
    updates[f] = v;
  }
  if ("position" in updates && !POSITIONS.includes(updates.position)) throw new Error("올바르지 않은 position 입니다.");
  if ("degree" in updates && !DEGREES.includes(updates.degree)) throw new Error("올바르지 않은 degree 입니다.");
  if ("status" in updates && !STATUSES.includes(updates.status)) throw new Error("올바르지 않은 status 입니다.");
  return updates;
}

async function unlinkedUsers() {
  const [{ data: users }, { data: linked }] = await Promise.all([
    supabaseAdmin.from("users").select("user_id, name").eq("status", "active"),
    supabaseAdmin.from("members").select("user_id").not("user_id", "is", null),
  ]);
  const linkedSet = new Set((linked || []).map((m) => m.user_id));
  return (users || []).filter((u) => !linkedSet.has(u.user_id)).map((u) => ({ userId: u.user_id, name: u.name }));
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { data, error } = await supabaseAdmin.from("members").select(MEMBER_COLUMNS);
    if (error) throw error;

    return NextResponse.json({
      members: (data || []).sort(compareMembers).map(toAdmin),
      unlinkedUsers: await unlinkedUsers(),
    });
  } catch (err) {
    console.error("멤버 관리 목록 실패:", err);
    return NextResponse.json({ error: "멤버 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const updates = pickUpdates(await request.json());
    if (!updates.name_kor) return NextResponse.json({ error: "이름(한글)은 필수입니다." }, { status: 400 });

    const { data, error } = await supabaseAdmin.from("members").insert(updates).select(MEMBER_COLUMNS).single();
    if (error) throw error;
    return NextResponse.json({ member: toAdmin(data) });
  } catch (err) {
    const known = /올바르지 않은/.test(err.message) || err.code === "23505";
    if (!known) console.error("멤버 추가 실패:", err);
    const msg = err.code === "23505" ? "이미 다른 멤버에 연결된 계정입니다." : known ? err.message : "멤버를 추가하지 못했습니다.";
    return NextResponse.json({ error: msg }, { status: known ? 400 : 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    const updates = pickUpdates(body);
    if (updates.name_kor === null) return NextResponse.json({ error: "이름은 비울 수 없습니다." }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("members").update(updates).eq("id", body.id).select(MEMBER_COLUMNS).single();
    if (error) throw error;

    // 계정을 연결했으면 계정 이름도 멤버 한국 이름으로 맞춤
    if (data.user_id && updates.name_kor) {
      await supabaseAdmin.from("users").update({ name: data.name_kor }).eq("user_id", data.user_id);
    }
    return NextResponse.json({ member: toAdmin(data) });
  } catch (err) {
    const known = /올바르지 않은/.test(err.message) || err.code === "23505";
    if (!known) console.error("멤버 수정 실패:", err);
    const msg = err.code === "23505" ? "이미 다른 멤버에 연결된 계정입니다." : known ? err.message : "멤버를 수정하지 못했습니다.";
    return NextResponse.json({ error: msg }, { status: known ? 400 : 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

    const { error } = await supabaseAdmin.from("members").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("멤버 삭제 실패:", err);
    return NextResponse.json({ error: "멤버를 삭제하지 못했습니다." }, { status: 500 });
  }
}
