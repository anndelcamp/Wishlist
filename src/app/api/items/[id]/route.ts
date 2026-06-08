import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const LABEL_SUBQUERY = `
  (SELECT GROUP_CONCAT(il2.label_id) FROM item_labels il2 WHERE il2.item_id = i.id) as label_ids,
  (SELECT GROUP_CONCAT(l2.name) FROM item_labels il2 JOIN labels l2 ON il2.label_id = l2.id WHERE il2.item_id = i.id) as label_names,
  (SELECT GROUP_CONCAT(l2.color) FROM item_labels il2 JOIN labels l2 ON il2.label_id = l2.id WHERE il2.item_id = i.id) as label_colors
`;

function parseItem(item: Record<string, unknown>) {
  const labelIds = item.label_ids as string | null;
  const labelNames = item.label_names as string | null;
  const labelColors = item.label_colors as string | null;
  return {
    ...item,
    label_ids: labelIds ? labelIds.split(',').map(Number) : [],
    labels: labelNames
      ? labelNames.split(',').map((name, i) => ({
          id: Number(labelIds?.split(',')[i]),
          name,
          color: labelColors?.split(',')[i],
        }))
      : [],
  };
}

function hasAccess(itemId: string, userId: number) {
  return db.prepare(`
    SELECT 1 FROM items WHERE id = ? AND user_id = ?
    UNION
    SELECT 1 FROM item_labels il
    JOIN label_shares ls ON il.label_id = ls.label_id
    WHERE il.item_id = ? AND ls.shared_with_user_id = ?
  `).get(itemId, userId, itemId, userId);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasAccess(params.id, auth.userId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const item = db.prepare(`SELECT i.*, ${LABEL_SUBQUERY} FROM items i WHERE i.id = ?`).get(params.id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(parseItem(item as Record<string, unknown>));
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const item = db.prepare('SELECT id FROM items WHERE id = ? AND user_id = ?').get(params.id, auth.userId);
  if (!item) return NextResponse.json({ error: 'Not found or not your item' }, { status: 404 });

  db.prepare('DELETE FROM items WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const item = db.prepare('SELECT id FROM items WHERE id = ? AND user_id = ?').get(params.id, auth.userId);
  if (!item) return NextResponse.json({ error: 'Not found or not your item' }, { status: 404 });

  const { labelIds } = await request.json();
  db.prepare('DELETE FROM item_labels WHERE item_id = ?').run(params.id);
  if (labelIds?.length) {
    const ins = db.prepare('INSERT OR IGNORE INTO item_labels (item_id, label_id) VALUES (?, ?)');
    for (const lid of labelIds) {
      const ok = db.prepare('SELECT id FROM labels WHERE id = ? AND user_id = ?').get(lid, auth.userId);
      if (ok) ins.run(params.id, lid);
    }
  }
  return NextResponse.json({ success: true });
}
