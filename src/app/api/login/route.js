// src/app/api/login/route.js
//
// 2단계 로그인 (비밀번호 → OTP).
//
// [단계 1] loginStep: 'check_pw'  { userID, password }
//   - 비밀번호/status 확인 후,
//   - OTP 미설정자: 서버가 secret 생성 → QR(data URL)과 secret이 담긴 setupToken 반환
//   - OTP 설정자:   pwToken 반환 (비밀번호 단계를 통과했다는 서버 서명)
//
// [단계 2] loginStep: 'verify_otp' { userID, token, stepToken }
//   - stepToken(서버 서명)이 없거나 위조/만료면 거절 → 비밀번호 단계를 건너뛸 수 없음
//   - status를 다시 확인 (차단/대기 계정은 OTP가 있어도 로그인 불가)
//   - TOTP 검증 성공 시 httpOnly 세션 쿠키 발급
//
// 예전 방식(클라이언트가 tempSecret을 보내고 서버가 그대로 믿던 것)은 비밀번호 없이
// 남의 계정에 자기 OTP를 등록할 수 있었기 때문에 제거했습니다.

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { getDoc } from '@/lib/googleSheet';
import {
  createStepToken,
  verifyStepToken,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '@/lib/auth';

const OTP_ISSUER = 'SMID-LAB';
// ID 존재 여부를 응답으로 구분할 수 없게 같은 메시지 사용
const INVALID_LOGIN_MSG = 'ID 또는 비밀번호가 올바르지 않습니다.';

function statusError(status) {
  if (status === 'pending') return NextResponse.json({ message: '승인 대기 중입니다.' }, { status: 403 });
  if (status === 'blocked') return NextResponse.json({ message: '차단된 계정입니다.' }, { status: 403 });
  return null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userID, password, token, loginStep, stepToken } = body;

    if (!userID || typeof userID !== 'string') {
      return NextResponse.json({ message: INVALID_LOGIN_MSG }, { status: 401 });
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    const userRow = rows.find((row) => row.get('userID') === userID);

    if (!userRow) {
      return NextResponse.json({ message: INVALID_LOGIN_MSG }, { status: 401 });
    }

    const storedSecret = (userRow.get('otpSecret') || '').trim();

    // =================================================
    // [단계 1] 비밀번호 확인
    // =================================================
    if (loginStep === 'check_pw') {
      const isMatch = await bcrypt.compare(String(password || ''), userRow.get('password') || '');
      if (!isMatch) {
        return NextResponse.json({ message: INVALID_LOGIN_MSG }, { status: 401 });
      }

      const blocked = statusError(userRow.get('status'));
      if (blocked) return blocked;

      if (!storedSecret) {
        // OTP 처음 등록: secret은 서버가 만들고, 서명된 setupToken 안에만 담아 보냄
        const secret = speakeasy.generateSecret({ length: 20 }).base32;
        const otpauthUrl = speakeasy.otpauthURL({
          secret,
          encoding: 'base32',
          label: `${OTP_ISSUER}:${userID}`,
          issuer: OTP_ISSUER,
        });
        const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { width: 180, margin: 1 });
        const setupToken = await createStepToken({ purpose: 'otp_setup', userID, secret });

        return NextResponse.json({ status: 'setup_needed', setupToken, qrDataUrl });
      }

      const pwToken = await createStepToken({ purpose: 'pw_ok', userID });
      return NextResponse.json({ status: 'otp_needed', pwToken });
    }

    // =================================================
    // [단계 2] OTP 검증 → 세션 발급
    // =================================================
    if (loginStep === 'verify_otp') {
      const blocked = statusError(userRow.get('status'));
      if (blocked) return blocked;

      let secret;
      let isFirstSetup = false;

      if (storedSecret) {
        const step = await verifyStepToken(stepToken, 'pw_ok', userID);
        if (!step) {
          return NextResponse.json({ message: '인증 절차가 만료되었습니다. 처음부터 다시 로그인해주세요.' }, { status: 401 });
        }
        secret = storedSecret;
      } else {
        const step = await verifyStepToken(stepToken, 'otp_setup', userID);
        if (!step?.secret) {
          return NextResponse.json({ message: '인증 절차가 만료되었습니다. 처음부터 다시 로그인해주세요.' }, { status: 401 });
        }
        secret = step.secret;
        isFirstSetup = true;
      }

      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: String(token || ''),
        window: 1, // 앞뒤 30초 허용
      });

      if (!isValid) {
        return NextResponse.json({ message: '인증번호가 틀렸습니다. 다시 확인해주세요.' }, { status: 401 });
      }

      if (isFirstSetup) {
        userRow.set('otpSecret', secret);
        await userRow.save();
      }

      const user = {
        userID: userRow.get('userID'),
        name: userRow.get('name'),
        role: userRow.get('role'),
      };

      const response = NextResponse.json({ status: 'success', user });
      response.cookies.set(SESSION_COOKIE, await createSessionToken(user), sessionCookieOptions());
      return response;
    }

    return NextResponse.json({ message: '잘못된 요청 단계입니다.' }, { status: 400 });
  } catch (error) {
    console.error('로그인 API 오류:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
