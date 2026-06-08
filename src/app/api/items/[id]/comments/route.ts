import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const comments = db.prepare('SELECT * FROM comments WHERE item_id = ? ORDER BY created_at ASC').all(params.id);
  return NextResponse.json(comments);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { text } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 });

  const result = db
    .prepare('INSERT INTO comments (item_id, user_id, user_name, text) VALUES (?, ?, ?, ?)')
    .run(params.id, auth.userId, auth.email, text.trim());

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(comment, { status: 201 });
}
