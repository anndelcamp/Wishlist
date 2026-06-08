import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  db.prepare('DELETE FROM labels WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
