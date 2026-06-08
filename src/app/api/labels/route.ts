import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const labels = db.prepare(`
    SELECT l.*,
      CASE WHEN l.user_id = ? THEN 0 ELSE 1 END as is_shared
    FROM labels l
    LEFT JOIN label_shares ls ON l.id = ls.label_id AND ls.shared_with_user_id = ?
    WHERE l.user_id = ? OR ls.shared_with_user_id = ?
    ORDER BY is_shared ASC, l.name ASC
  `).all(auth.userId, auth.userId, auth.userId, auth.userId);

  return NextResponse.json(labels);
}

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, color } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const existing = db.prepare('SELECT id FROM labels WHERE name = ? AND user_id = ?').get(name.trim(), auth.userId);
  if (existing) return NextResponse.json({ error: 'Wishlist already exists' }, { status: 409 });

  const result = db.prepare('INSERT INTO labels (name, color, user_id) VALUES (?, ?, ?)').run(
    name.trim(), color || '#6366f1', auth.userId
  );
  const label = db.prepare('SELECT *, 0 as is_shared FROM labels WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(label, { status: 201 });
}
