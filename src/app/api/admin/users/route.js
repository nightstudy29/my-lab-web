// src/app/api/admin/users/route.js
//
// 계정 관리 API (admin 전용).
//
// GET  ?status=pending|active|blocked|rejected|all   → { users: [...] }  (해시/OTP secret 은 절대 반환 안 함)
// PATCH { id, action, role?, reason? }
//   action:
//     approve         pending → active
//     reject          pending → rejected (reason 선택)
//     block / unblock active ↔ blocked
//     set_role        role: admin | manager | member
//     reset_password  임시 비밀번호 발급 → 응답에 tempPassword (한 번만). 다음 로그인 때 변경 강제
//     reset_otp       OTP secret 삭제 → 다음 로그인 때 QR 재등록
//     delete          계정 삭제 (rejected / 퇴사자 정리용)
//   본인 계정에는 block / set_role / delete 불가 (실수로 스스로 잠기는 것 방지)

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth';
import { ROLES } from '@/lib/roles';

const SAFE_COLUMNS =
  'id, user_id, name, role, status, otp_secret, must_change_password, rejected_reason, created_at, approved_at, last_login_at';

// 헷갈리는 글자(0/O, 1/l/I) 제외한 10자 임시 비밀번호
const TEMP_PW_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
function generateTempPassword(length = 10) {
  let out = '';
  for (let i = 0; i < length; i++) out += TEMP_PW_ALPHABET[randomInt(TEMP_PW_ALPHABET.length)];
  return out;
}

// 승인된 계정에 members 행이 없으면 만들어 연결합니다.
// 같은 한국 이름의 미연결 멤버 행이 이미 있으면(시트에서 이전된 사람 등) 새로 만들지 않고 그 행에 연결.
async function ensureMemberRow(user) {
  const { data: linked } = await supabaseAdmin.from('members').select('id').eq('user_id', user.user_id).maybeSingle();
  if (linked) return;

  const { data: sameName } = await supabaseAdmin
    .from('members').select('id').is('user_id', null).eq('name_kor', user.name).limit(1).maybeSingle();

  if (sameName) {
    await supabaseAdmin.from('members').update({ user_id: user.user_id }).eq('id', sameName.id);
  } else {
    await supabaseAdmin.from('members').insert({
      user_id: user.user_id,
      name_kor: user.name,
      position: 'MS-PhD Student',
      degree: 'TBD',
      status: 'active',
    });
  }
}

function toPublic(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    role: row.role,
    status: row.status,
    otpSet: !!row.otp_secret,
    mustChangePassword: !!row.must_change_password,
    rejectedReason: row.rejected_reason,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    lastLoginAt: row.last_login_at,
  };
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    let query = supabaseAdmin.from('users').select(SAFE_COLUMNS).order('created_at', { ascending: false });
    if (status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ users: (data || []).map(toPublic) });
  } catch (err) {
    console.error('계정 목록 조회 실패:', err);
    return NextResponse.json({ error: '계정 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { id, action, role, reason } = await request.json();
    if (!id || !action) {
      return NextResponse.json({ error: 'id 와 action 이 필요합니다.' }, { status: 400 });
    }

    const { data: target } = await supabaseAdmin.from('users').select(SAFE_COLUMNS).eq('id', id).maybeSingle();
    if (!target) {
      return NextResponse.json({ error: '계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    const isSelf = target.user_id === auth.user.userID;
    if (isSelf && ['block', 'set_role', 'delete'].includes(action)) {
      return NextResponse.json({ error: '본인 계정에는 이 작업을 할 수 없습니다.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let updates = null;
    let extra = {};

    switch (action) {
      case 'approve':
        updates = { status: 'active', approved_at: now, rejected_reason: null };
        break;
      case 'reject':
        updates = { status: 'rejected', rejected_reason: reason ? String(reason).slice(0, 200) : null };
        break;
      case 'block':
        updates = { status: 'blocked' };
        break;
      case 'unblock':
        updates = { status: 'active' };
        break;
      case 'set_role':
        if (!ROLES.includes(role)) {
          return NextResponse.json({ error: '올바르지 않은 역할입니다.' }, { status: 400 });
        }
        updates = { role };
        break;
      case 'reset_password': {
        const tempPassword = generateTempPassword();
        updates = { password_hash: await bcrypt.hash(tempPassword, 10), must_change_password: true };
        extra = { tempPassword };
        break;
      }
      case 'reset_otp':
        updates = { otp_secret: null };
        break;
      case 'delete': {
        const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true, deleted: true });
      }
      default:
        return NextResponse.json({ error: '알 수 없는 action 입니다.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select(SAFE_COLUMNS)
      .single();
    if (error) throw error;

    // 승인 시 멤버 정보(members) 행을 자동으로 준비 — 온보딩 자동화
    if (action === 'approve') { await ensureMemberRow(data); revalidatePath('/members'); }

    return NextResponse.json({ user: toPublic(data), ...extra });
  } catch (err) {
    console.error('계정 변경 실패:', err);
    return NextResponse.json({ error: '요청을 처리하지 못했습니다.' }, { status: 500 });
  }
}
