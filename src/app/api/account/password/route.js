// src/app/api/account/password/route.js
//
// 본인 비밀번호 변경 (로그인 필요). 현재 비밀번호 확인 후 새 비밀번호로 교체.
// 관리자가 초기화해서 must_change_password 가 켜진 계정도 이 API로 바꾸면 플래그가 꺼집니다.

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireLogin } from '@/lib/auth';

const MIN_PW_LENGTH = 8;

export async function POST(request) {
  try {
    const auth = await requireLogin(request);
    if (auth.response) return auth.response;

    const { currentPassword, newPassword } = await request.json();

    if (typeof newPassword !== 'string' || newPassword.length < MIN_PW_LENGTH) {
      return NextResponse.json({ error: `새 비밀번호는 ${MIN_PW_LENGTH}자 이상이어야 합니다.` }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: '현재 비밀번호와 다른 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const { data: row } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('user_id', auth.user.userID)
      .single();

    const ok = await bcrypt.compare(String(currentPassword || ''), row?.password_hash || '');
    if (!ok) {
      return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ password_hash: await bcrypt.hash(newPassword, 10), must_change_password: false })
      .eq('user_id', auth.user.userID);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('비밀번호 변경 실패:', err);
    return NextResponse.json({ error: '비밀번호를 변경하지 못했습니다.' }, { status: 500 });
  }
}
