// src/lib/auth.js
//
// 서버 사이드 세션/토큰 유틸.
// - 로그인 성공 시 JWT_SECRET(.env)으로 서명한 JWT를 httpOnly 쿠키에 담아 세션을 유지합니다.
// - 관리자용 API 라우트는 handler 첫 줄에서 requireAdmin(request)으로 보호합니다.
// - 로그인 중간 단계(비밀번호 확인 → OTP 검증)도 서버가 서명한 짧은 토큰으로 이어서,
//   비밀번호 단계를 건너뛰거나 클라이언트가 만든 secret을 밀어넣을 수 없게 합니다.
//
// ⚠️ 서버(API 라우트)에서만 import 하세요.

import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

export const SESSION_COOKIE = 'smid_session';
const SESSION_TTL_SEC = 3 * 60 * 60; // 세션 3시간
const STEP_TOKEN_TTL_SEC = 10 * 60;  // 로그인 중간 단계 토큰 10분

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET 환경변수가 없거나 너무 짧습니다 (16자 이상 권장).');
  }
  return new TextEncoder().encode(secret);
}

async function sign(payload, ttlSec) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlSec}s`)
    .sign(getSecretKey());
}

async function verify(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] });
    return payload;
  } catch {
    return null; // 만료/위조/형식 오류 전부 null
  }
}

// ===== 로그인 중간 단계 토큰 =====
// purpose: 'pw_ok'     — 비밀번호 확인을 통과한 기존 OTP 사용자
//          'otp_setup' — 비밀번호 확인을 통과했고 이제 OTP를 처음 등록하는 사용자 (secret 포함)
export function createStepToken(payload) {
  return sign(payload, STEP_TOKEN_TTL_SEC);
}

export async function verifyStepToken(token, expectedPurpose, expectedUserID) {
  if (!token) return null;
  const p = await verify(token);
  if (!p || p.purpose !== expectedPurpose || p.userID !== expectedUserID) return null;
  return p;
}

// ===== 세션 =====
export function createSessionToken(user) {
  return sign(
    { purpose: 'session', userID: user.userID, name: user.name, role: user.role },
    SESSION_TTL_SEC
  );
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SEC,
  };
}

// 요청의 쿠키에서 세션을 읽습니다. 없거나 만료면 null.
export async function getSession(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const p = await verify(token);
  if (!p || p.purpose !== 'session') return null;
  return { userID: p.userID, name: p.name, role: p.role };
}

// 관리자 전용 API 가드.
// 사용법:
//   const auth = await requireAdmin(request);
//   if (auth.response) return auth.response;
export async function requireAdmin(request) {
  const user = await getSession(request);
  if (!user) {
    return { response: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }) };
  }
  if (user.role !== 'admin') {
    return { response: NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 }) };
  }
  return { user };
}
