import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function requireOwner(labelId: string, userId: number) {
  return db.prepare('SELECT id FROM labels WHERE id = ? AND user_id = ?').get(labelId, userId);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!(await requireOwner(id, auth.userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const shares = db.prepare(`
    SELECT ls.id, ls.label_id, ls.shared_with_user_id, u.email, ls.created_at
    FROM label_shares ls
    JOIN users u ON ls.shared_with_user_id = u.id
    WHERE ls.label_id = ?
    ORDER BY ls.created_at ASC
  `).all(id);

  return NextResponse.json(shares);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!(await requireOwner(id, auth.userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email } = await request.json();
  if (!email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const targetUser = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;
  if (!targetUser) return NextResponse.json({ error: 'No account found with that email' }, { status: 404 });
  if (targetUser.id === auth.userId) return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });

  try {
    db.prepare('INSERT INTO label_shares (label_id, shared_with_user_id) VALUES (?, ?)').run(id, targetUser.id);
  } catch {
    return NextResponse.json({ error: 'Already shared with this user' }, { status: 409 });
  }

  return NextResponse.json({ success: true, email: targetUser.email }, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!(await requireOwner(id, auth.userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId } = await request.json();
  db.prepare('DELETE FROM label_shares WHERE label_id = ? AND shared_with_user_id = ?').run(id, userId);
  return NextResponse.json({ success: true });
}
