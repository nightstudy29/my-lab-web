import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// 기존 로그인용 (Auth)
export async function getDoc() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

// [추가] 멤버 정보 & 휴가 관리용 (Member Info)
export async function getMemberDoc() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  // .env에 새로 추가한 ID 사용
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID_MEMBER, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}