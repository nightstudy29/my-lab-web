// src/app/api/patents/route.js
//
// 특허(patents) 추가/수정/삭제 API.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 특허 추가
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      year, title, koreanTitle, inventors, type,
      applicationDate, applicationNumber, registrationDate, registrationNumber, url,
    } = body;

    if (!year || !title || !inventors || !type) {
      return NextResponse.json({ error: "필수 항목(연도/제목/발명자/구분)이 누락되었습니다." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("patents")
      .insert({
        year: Number(year),
        title,
        korean_title: koreanTitle || null,
        inventors,
        type,
        application_date: applicationDate || null,
        application_number: applicationNumber || null,
        registration_date: registrationDate || null,
        registration_number: registrationNumber || null,
        url: url || null,
      })
      .select()
      .single();

    if (error) {
      console.error("특허 추가 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ patent: data });
  } catch (err) {
    console.error("특허 추가 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 특허 수정
export async function PATCH(request) {
  try {
    const body = await request.json();
    const {
      id, year, title, koreanTitle, inventors, type,
      applicationDate, applicationNumber, registrationDate, registrationNumber, url,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const updates = {};
    if (year !== undefined) updates.year = Number(year);
    if (title !== undefined) updates.title = title;
    if (koreanTitle !== undefined) updates.korean_title = koreanTitle || null;
    if (inventors !== undefined) updates.inventors = inventors;
    if (type !== undefined) updates.type = type;
    if (applicationDate !== undefined) updates.application_date = applicationDate || null;
    if (applicationNumber !== undefined) updates.application_number = applicationNumber || null;
    if (registrationDate !== undefined) updates.registration_date = registrationDate || null;
    if (registrationNumber !== undefined) updates.registration_number = registrationNumber || null;
    if (url !== undefined) updates.url = url || null;

    const { data, error } = await supabaseAdmin
      .from("patents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("특허 수정 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ patent: data });
  } catch (err) {
    console.error("특허 수정 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 특허 삭제 (?id=... 쿼리 파라미터로 받음)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("patents").delete().eq("id", id);

    if (error) {
      console.error("특허 삭제 실패:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("특허 삭제 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}