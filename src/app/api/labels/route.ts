import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const labels = db.prepare('SELECT * FROM labels ORDER BY name ASC').all();
  return NextResponse.json(labels);
}

export async function POST(request: Request) {
  const { name, color } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  try {
    const result = db
      .prepare('INSERT INTO labels (name, color) VALUES (?, ?)')
      .run(name.trim(), color || '#6366f1');
    const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(label, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Wishlist already exists' }, { status: 409 });
  }
}
