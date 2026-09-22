// src/app/api/requests/route.js
//
// 포털의 "수정 요청" (Newbie Guide / Lab Wiki 내용 수정·추가 요청).
//   POST  { category, content }   로그인한 누구나 → 접수
//   GET   ?status=open|resolved|all   admin → 목록
//   PATCH { id }                  admin → 처리 완료

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin, requireLogin } from '@/lib/auth';

const CATEGORIES = new Set(['Newbie Guide', 'Lab Wiki']);

function toPublic(row) {
  return {
    id: row.id,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    category: row.category,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

export async function POST(request) {
  try {
    const auth = await requireLogin(request);
    if (auth.response) return auth.response;

    const { category, content } = await request.json();
    const text = String(content || '').trim();

    if (!CATEGORIES.has(category)) {
      return NextResponse.json({ error: '올바르지 않은 카테고리입니다.' }, { status: 400 });
    }
    if (!text || text.length > 2000) {
      return NextResponse.json({ error: '내용을 입력해주세요. (2000자 이내)' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('content_requests')
      .insert({
        requester_id: auth.user.userID,
        requester_name: auth.user.name,
        category,
        content: text,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ request: toPublic(data) });
  } catch (err) {
    console.error('수정 요청 접수 실패:', err);
    return NextResponse.json({ error: '요청을 접수하지 못했습니다.' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';

    let query = supabaseAdmin.from('content_requests').select('*').order('created_at', { ascending: false });
    if (status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ requests: (data || []).map(toPublic) });
  } catch (err) {
    console.error('수정 요청 조회 실패:', err);
    return NextResponse.json({ error: '요청 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('content_requests')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ request: toPublic(data) });
  } catch (err) {
    console.error('수정 요청 처리 실패:', err);
    return NextResponse.json({ error: '요청을 처리하지 못했습니다.' }, { status: 500 });
  }
}
