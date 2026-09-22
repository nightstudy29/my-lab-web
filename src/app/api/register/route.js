// src/app/api/register/route.js
//
// 신입 연구원 가입 신청. status: 'pending'으로 시트에 추가되고 관리자가 승인해야 로그인 가능.

import { NextResponse } from 'next/server';
import { getDoc } from '@/lib/googleSheet';
import bcrypt from 'bcryptjs';

const ID_REGEX = /^[a-zA-Z0-9]{3,20}$/;
const MIN_PW_LENGTH = 8;

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
      return NextResponse.json(
        { message: `비밀번호는 ${MIN_PW_LENGTH}자 이상이어야 합니다.` },
        { status: 400 }
      );
    }
    if (!name || name.length > 30) {
      return NextResponse.json({ message: '이름을 입력해주세요. (30자 이내)' }, { status: 400 });
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0]; // users 시트
    const rows = await sheet.getRows();

    const existingUser = rows.find((row) => row.get('userID') === userID);
    if (existingUser) {
      return NextResponse.json({ message: '이미 존재하는 ID입니다.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const kstTimestamp = new Date().toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour12: false,
    });

    await sheet.addRow({
      userID,
      password: hashedPassword,
      name,
      status: 'pending',
      otpSecret: '',
      role: 'student',
      Timestamp: kstTimestamp,
    });

    return NextResponse.json({ message: '가입 신청 완료. 교수님 승인 후 로그인 가능합니다.' });
  } catch (error) {
    console.error('회원가입 에러:', error);
    return NextResponse.json({ message: '서버 오류 발생' }, { status: 500 });
  }
}
