// src/lib/auth.js
//
// 서버 사이드 세션/토큰/권한 유틸.
// - 로그인 성공 시 JWT_SECRET(.env)으로 서명한 JWT를 httpOnly 쿠키에 담아 세션을 유지합니다.
// - API 라우트는 handler 첫 줄에서 requireAdmin / requireRole / requireLogin 으로 보호합니다.
//   이때 DB(users)에서 현재 status/role 을 다시 읽으므로, 차단·역할 변경이 즉시 반영됩니다.
// - 로그인 중간 단계(비밀번호 확인 → OTP 검증)도 서버가 서명한 짧은 토큰으로 이어서,
//   비밀번호 단계를 건너뛰거나 클라이언트가 만든 secret을 밀어넣을 수 없게 합니다.
//
// ⚠️ 서버(API 라우트)에서만 import 하세요.

import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ROLES } from '@/lib/roles';

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

// 쿠키의 토큰만 검증 (DB 조회 없음). 가벼운 용도.
export async function getSession(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const p = await verify(token);
  if (!p || p.purpose !== 'session') return null;
  return { userID: p.userID, name: p.name, role: p.role };
}

// 토큰 검증 + DB에서 현재 상태 확인. active 가 아니면 null.
// 반환: { userID, name, role, mustChangePassword }
export async function getCurrentUser(request) {
  const session = await getSession(request);
  if (!session) return null;

  const { data: row } = await supabaseAdmin
    .from('users')
    .select('user_id, name, role, status, must_change_password')
    .eq('user_id', session.userID)
    .maybeSingle();

  if (!row || row.status !== 'active') return null;
  return {
    userID: row.user_id,
    name: row.name,
    role: row.role,
    mustChangePassword: !!row.must_change_password,
  };
}

// ===== API 가드 =====
// 사용법:
//   const auth = await requireRole(request, ['admin', 'manager']);
//   if (auth.response) return auth.response;
//   auth.user → { userID, name, role, mustChangePassword }
export async function requireRole(request, roles) {
  const user = await getCurrentUser(request);
  if (!user) {
    return { response: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }) };
  }
  if (!roles.includes(user.role)) {
    return { response: NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 }) };
  }
  return { user };
}

export const requireAdmin = (request) => requireRole(request, ['admin']);
export const requireLogin = (request) => requireRole(request, ROLES);
