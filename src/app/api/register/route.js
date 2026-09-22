// src/app/api/register/route.js
//
// 신입 연구원 가입 신청. status: 'pending'으로 저장되고 관리자가 승인해야 로그인 가능.
// - 거절(rejected)된 ID로 다시 신청하면 그 행을 pending으로 되살립니다 (ID 재사용 허용).
// - 같은 IP에서 24시간 내 pending 신청이 MAX_PENDING_PER_IP 건을 넘으면 거절 (스팸 방지).

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ID_REGEX = /^[a-zA-Z0-9]{3,20}$/;
const MIN_PW_LENGTH = 8;
const MAX_PENDING_PER_IP = 5;

function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const userID = String(body.userID || '').trim();
    const password = String(body.password || '');
    const name = String(body.name || '').trim();

    if (!ID_REGEX.test(userID)) {
      return NextResponse.json(
        { message: 'ID는 영어와 숫자로만 3~20자로 만들어주세요. (한글, 특수문자, 띄어쓰기 불가)' },
        { status: 400 }
      );
    }
    if (password.length < MIN_PW_LENGTH) {
      return NextResponse.json({ message: `비밀번호는 ${MIN_PW_LENGTH}자 이상이어야 합니다.` }, { status: 400 });
    }
    if (!name || name.length > 30) {
      return NextResponse.json({ message: '이름을 입력해주세요. (30자 이내)' }, { status: 400 });
    }

    const ip = clientIp(req);

    // 스팸 제한
    if (ip) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('registration_ip', ip)
        .eq('status', 'pending')
        .gte('created_at', since);
      if ((count || 0) >= MAX_PENDING_PER_IP) {
        return NextResponse.json({ message: '가입 신청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
      }
    }

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('user_id, status')
      .eq('user_id', userID)
      .maybeSingle();

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing) {
      if (existing.status !== 'rejected') {
        return NextResponse.json({ message: '이미 존재하는 ID입니다.' }, { status: 409 });
      }
      // 거절된 계정의 재신청 → pending 으로 되살림
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          name,
          password_hash: hashedPassword,
          otp_secret: null,
          role: 'member',
          status: 'pending',
          must_change_password: false,
          rejected_reason: null,
          registration_ip: ip,
          created_at: new Date().toISOString(),
          approved_at: null,
        })
        .eq('user_id', userID);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from('users').insert({
        user_id: userID,
        name,
        password_hash: hashedPassword,
        role: 'member',
        status: 'pending',
        registration_ip: ip,
      });
      if (error) throw error;
    }

    return NextResponse.json({ message: '가입 신청 완료. 교수님 승인 후 로그인 가능합니다.' });
  } catch (error) {
    console.error('회원가입 에러:', error);
    return NextResponse.json({ message: '서버 오류 발생' }, { status: 500 });
  }
}
