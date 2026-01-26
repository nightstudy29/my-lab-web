import { NextResponse } from 'next/server';
import { getDoc } from '@/lib/googleSheet';

export async function POST(req) {
  try {
    const { action, userID } = await req.json();
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0]; // Auth DB
    const rows = await sheet.getRows();

    if (action === 'get_pending') {
      const pendingUsers = rows
        .filter(row => row.get('status') === 'pending')
        .map(row => ({
          userID: row.get('userID'),
          name: row.get('name'),
          role: row.get('role'),
        }));
      return NextResponse.json(pendingUsers);
    }

    if (action === 'approve') {
      const row = rows.find(r => r.get('userID') === userID);
      if (row) {
        row.set('status', 'active');
        await row.save();
        return NextResponse.json({ message: '승인 완료' });
      }
    }

    return NextResponse.json({ message: '잘못된 요청' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}