import { NextResponse } from 'next/server';
import { getDoc } from '@/lib/googleSheet';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy'; // ✅ 튼튼한 새 라이브러리 사용

export async function POST(req) {
  try {
    const body = await req.json();
    const { userID, password, token, loginStep, tempSecret } = body;
    
    // 구글 시트 연동
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    const userRow = rows.find(row => row.get('userID') === userID);

    // 1. ID 존재 여부 확인
    if (!userRow) {
      return NextResponse.json({ message: '존재하지 않는 ID입니다.' }, { status: 401 });
    }

    // =================================================
    // [단계 1] 비밀번호 확인 (OTP 화면으로 넘겨주는 단계)
    // =================================================
    if (loginStep === 'check_pw') {
      const isMatch = await bcrypt.compare(password, userRow.get('password'));
      
      if (!isMatch) {
        return NextResponse.json({ message: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
      }

      const status = userRow.get('status');
      if (status === 'pending') return NextResponse.json({ message: '승인 대기 중입니다.' }, { status: 403 });
      if (status === 'blocked') return NextResponse.json({ message: '차단된 계정입니다.' }, { status: 403 });

      // OTP 설정 여부 확인
      const currentSecret = userRow.get('otpSecret');
      
      console.log(`🔍 로그인 시도: ${userID} | OTP설정: ${currentSecret ? '완료' : '미설정'}`);

      if (!currentSecret || currentSecret.trim() === '') {
        // [CASE A] OTP가 처음인 사람 -> 새 시크릿 키 생성
        // speakeasy로 키 생성 (base32 사용)
        const secretCode = speakeasy.generateSecret({ length: 20 });
        return NextResponse.json({ status: 'setup_needed', tempSecret: secretCode.base32 });
      } else {
        // [CASE B] 이미 OTP 쓰는 사람 -> 번호 입력 화면으로
        return NextResponse.json({ status: 'otp_needed' });
      }
    }

    // =================================================
    // [단계 2] OTP 번호 검증 (최종 로그인 성공 단계)
    // =================================================
    if (loginStep === 'verify_otp') {
      // 저장된 시크릿 키 사용 (없으면 방금 만든 임시 키 사용)
      let secret = userRow.get('otpSecret');
      if (!secret && tempSecret) secret = tempSecret; 

      if (!secret) {
        return NextResponse.json({ message: 'OTP 설정 오류 (Secret 없음)' }, { status: 400 });
      }

      const inputToken = String(token);
      
      // ✅ speakeasy로 검증 (가장 표준적인 방법)
      const isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: inputToken,
        window: 1 // 시간 오차 허용 범위 (앞뒤 30초)
      });

      console.log(`🔐 OTP 검증: 입력값(${inputToken}) => 결과: ${isValid}`);

      if (!isValid) {
        return NextResponse.json({ message: '인증번호가 틀렸습니다. 다시 확인해주세요.' }, { status: 401 });
      }

      // 검증 성공! (최초 설정이었다면 시트에 저장)
      if (!userRow.get('otpSecret') || userRow.get('otpSecret') === '') {
        userRow.set('otpSecret', secret);
        await userRow.save();
      }

      return NextResponse.json({ 
        status: 'success',
        user: { 
          name: userRow.get('name'), 
          role: userRow.get('role'), 
          userID: userRow.get('userID') 
        }
      });
    }

    return NextResponse.json({ message: '잘못된 요청 단계입니다.' }, { status: 400 });

  } catch (error) {
    console.error("❌ Critical API Error:", error);
    return NextResponse.json({ message: `서버 에러: ${error.message}` }, { status: 500 });
  }
}