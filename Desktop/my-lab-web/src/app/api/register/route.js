// 📁 app/api/register/route.js
import { NextResponse } from 'next/server';
import { getDoc } from '@/lib/googleSheet';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { userID, password, name } = await req.json();

    // 0. [추가] 아이디 유효성 검사 (영어 대소문자 + 숫자만 허용)
    // 정규표현식 설명: ^(시작) [a-zA-Z0-9](영문자,숫자) +(1개 이상) $(끝)
    const idRegex = /^[a-zA-Z0-9]+$/;

    if (!idRegex.test(userID)) {
      return NextResponse.json(
        { message: 'ID는 영어와 숫자로만 만들어주세요. (한글, 특수문자, 띄어쓰기 불가)' }, 
        { status: 400 } // 400 Bad Request 에러 반환
      );
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0]; // 첫 번째 시트 사용 (users 시트)
    const rows = await sheet.getRows();

    // 1. 이미 있는 아이디인지 확인
    const existingUser = rows.find(row => row.get('userID') === userID);
    if (existingUser) {
      return NextResponse.json({ message: '이미 존재하는 ID입니다.' }, { status: 409 });
    }

    // 2. 비밀번호 암호화 (보안 필수!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // [수정] 한국 시간 문자열 생성
    const kstTimestamp = new Date().toLocaleString('ko-KR', { 
        timeZone: 'Asia/Seoul',
        hour12: false 
    });

    // 3. 시트에 추가
    await sheet.addRow({
      userID: userID,            
      password: hashedPassword,  
      name: name,                
      status: 'pending',         
      otpSecret: '',             
      role: 'student',           
      Timestamp: kstTimestamp    
    });

    return NextResponse.json({ message: '가입 신청 완료. 교수님 승인 후 로그인 가능합니다.' });

  } catch (error) {
    console.error("회원가입 에러:", error);
    return NextResponse.json({ message: '서버 오류 발생' }, { status: 500 });
  }
}