// src/app/api/members/me/route.js
//
// 포털 「내 정보」 — 로그인한 본인의 멤버 정보.
//   GET           → { member } (연결된 행이 없으면 member: null)
//   PATCH {...}   → SELF_EDITABLE_FIELDS 만 반영. position/degree/status 등은 무시(교수님 전용).

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireLogin } from "@/lib/auth";
import { MEMBER_COLUMNS, toDirectory } from "@/lib/memberShapes";
import { SELF_EDITABLE_FIELDS } from "@/lib/memberConstants";

const MAX_LEN = { research_area: 120, motto: 120, current_position: 120 };
const URL_FIELDS = ["cv_link", "scholar_link", "linkedin_link", "orcid_link", "photo_url"];

function cleanValue(field, value) {
  if (value == null) return null;
  let v = String(value).trim();
  if (!v) return null;
  if (MAX_LEN[field] && v.length > MAX_LEN[field]) v = v.slice(0, MAX_LEN[field]);
  if (URL_FIELDS.includes(field)) {
    // 상대 경로(/members/xxx.jpg)는 photo_url 에만 허용, 나머지는 http(s) 만
    const isRelativePhoto = field === "photo_url" && v.startsWith("/");
    if (!isRelativePhoto && !/^https?:\/\//i.test(v)) {
      throw new Error(`${field}: http:// 또는 https:// 로 시작하는 주소만 입력할 수 있습니다.`);
    }
  }
  return v;
}

export async function GET(request) {
  try {
    const auth = await requireLogin(request);
    if (auth.response) return auth.response;

    const { data, error } = await supabaseAdmin
      .from("members")
      .select(MEMBER_COLUMNS)
      .eq("user_id", auth.user.userID)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({ member: data ? toDirectory(data) : null });
  } catch (err) {
    console.error("내 정보 조회 실패:", err);
    return NextResponse.json({ error: "내 정보를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireLogin(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const updates = {};
    for (const field of SELF_EDITABLE_FIELDS) {
      if (field in body) updates[field] = cleanValue(field, body[field]);
    }
    if (updates.name_kor === null) {
      return NextResponse.json({ error: "이름은 비울 수 없습니다." }, { status: 400 });
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("members")
      .update(updates)
      .eq("user_id", auth.user.userID)
      .select(MEMBER_COLUMNS)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "계정에 연결된 멤버 정보가 없습니다. 교수님께 연결을 요청해주세요." }, { status: 404 });
    }

    // 한국 이름을 바꾸면 계정 이름도 맞춰줌
    if (updates.name_kor && updates.name_kor !== auth.user.name) {
      await supabaseAdmin.from("users").update({ name: updates.name_kor }).eq("user_id", auth.user.userID);
    }

    return NextResponse.json({ member: toDirectory(data) });
  } catch (err) {
    const known = /http:\/\/ 또는 https:\/\//.test(err.message);
    if (!known) console.error("내 정보 수정 실패:", err);
    return NextResponse.json({ error: known ? err.message : "내 정보를 저장하지 못했습니다." }, { status: known ? 400 : 500 });
  }
}
