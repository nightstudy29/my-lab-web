import { NextResponse } from 'next/server';
import { getMemberDoc } from '@/lib/googleSheet';

export async function GET() {
  try {
    const doc = await getMemberDoc();
    const sheet = doc.sheetsByIndex[0]; // 첫 번째 탭 사용
    const rows = await sheet.getRows();

    // 시트 구조에 맞춰 데이터 매핑
    const members = rows.map((row, index) => {
      // V1~V7 체크박스 (TRUE/FALSE 문자열로 올 수 있음)
      const vacation = [];
      for (let i = 1; i <= 7; i++) {
        const val = row.get(`V${i}`);
        vacation.push(val === 'TRUE' || val === true);
      }

      return {
        rowIndex: index, // 업데이트 시 필요
        name: row.get('Name'), // C열
        engName: row.get('Eng. Name'), // D열
        email: row.get('E-mail'), 
        phone: row.get('Phone'),
        kakao: row.get('Kakao ID'),
        year: row.get('Year Joined'),
        status: row.get('Status'), // M열 (Active/Graduated)
        degree: row.get('Degree'), // N열
        currentPosition: row.get('Current Position'),
        cvLink: row.get('CV_Link'),
        scholarLink: row.get('Scholar_Link'),
        linkedinLink: row.get('Linkedin_Link'),
        orcidLink: row.get('ORCID_Link'),
        vacation: vacation, // [true, false, ...]
        vacationMemo: row.get('V_Memo') || '', // X열
        vacationYear: row.get('V_Year'), // Y열
      };
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: '데이터 로드 실패' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { rowIndex, vIndex, memo } = await req.json();
    const doc = await getMemberDoc();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    const row = rows[rowIndex];

    // 휴가 체크박스 업데이트
    if (vIndex !== undefined) {
      const colName = `V${vIndex + 1}`; // V1, V2 ...
      const currentVal = row.get(colName);
      // 토글 (TRUE <-> FALSE)
      const newVal = (currentVal === 'TRUE' || currentVal === true) ? 'FALSE' : 'TRUE';
      row.set(colName, newVal);
    }

    // 메모 업데이트
    if (memo !== undefined) {
      row.set('V_Memo', memo);
    }

    await row.save();
    return NextResponse.json({ message: '저장 성공' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}