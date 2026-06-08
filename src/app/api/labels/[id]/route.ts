import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthUser(_req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const label = db.prepare('SELECT id FROM labels WHERE id = ? AND user_id = ?').get(params.id, auth.userId);
  if (!label) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.prepare('DELETE FROM labels WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
