// src/app/api/session/route.js
//
// 현재 로그인 세션 조회(GET) / 로그아웃(DELETE).
// 클라이언트는 localStorage 대신 이 API로 로그인 상태를 확인합니다.
// GET 은 DB에서 현재 status/role 을 다시 읽으므로 차단·역할 변경이 바로 반영됩니다.

import { NextResponse } from 'next/server';
import { getCurrentUser, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

// 비로그인 상태도 200 + { user: null }로 응답합니다.
// (401로 주면 로그인 페이지가 "이미 로그인돼 있나?" 확인할 때마다 브라우저 콘솔에 빨간 에러가 찍힘)
export async function GET(request) {
  const user = await getCurrentUser(request);
  return NextResponse.json({ user: user ?? null });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
