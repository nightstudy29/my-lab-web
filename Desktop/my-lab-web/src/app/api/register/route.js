// 📁 app/api/register/route.js
import { NextResponse } from 'next/server';
import { getDoc } from '@/lib/googleSheet';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { userID, password, name } = await req.json();

    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0]; // 첫 번째 시트 사용
    const rows = await sheet.getRows();

    // 1. 이미 있는 아이디인지 확인
    const existingUser = rows.find(row => row.get('userID') === userID);
    if (existingUser) {
      return NextResponse.json({ message: '이미 존재하는 ID입니다.' }, { status: 409 });
    }

    // 2. 비밀번호 암호화 (보안 필수!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. 시트에 추가 (status는 자동으로 pending)
    await sheet.addRow({
      userID,
      password: hashedPassword,
      name,
      status: 'pending', // 교수님 승인 대기 상태
      otpSecret: '',
      role: 'student',
      createdAt: new Date().toISOString().split('T')[0]
    });

    return NextResponse.json({ message: '가입 신청 완료. 교수님 승인 후 로그인 가능합니다.' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: '서버 오류 발생' }, { status: 500 });
  }
}