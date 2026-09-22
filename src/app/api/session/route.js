// src/app/api/session/route.js
//
// 현재 로그인 세션 조회(GET) / 로그아웃(DELETE).
// 클라이언트는 localStorage 대신 이 API로 로그인 상태를 확인합니다.

import { NextResponse } from 'next/server';
import { getSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

export async function GET(request) {
  const user = await getSession(request);
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
