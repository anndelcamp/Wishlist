import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const item = db.prepare(`
    SELECT i.*, GROUP_CONCAT(il.label_id) as label_ids,
           GROUP_CONCAT(l.name) as label_names,
           GROUP_CONCAT(l.color) as label_colors
    FROM items i
    LEFT JOIN item_labels il ON i.id = il.item_id
    LEFT JOIN labels l ON il.label_id = l.id
    WHERE i.id = ? GROUP BY i.id
  `).get(params.id);

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(parseItem(item as Record<string, unknown>));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  db.prepare('DELETE FROM items WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { labelIds } = await request.json();
  db.prepare('DELETE FROM item_labels WHERE item_id = ?').run(params.id);
  if (labelIds?.length) {
    const ins = db.prepare('INSERT OR IGNORE INTO item_labels (item_id, label_id) VALUES (?, ?)');
    for (const lid of labelIds) ins.run(params.id, lid);
  }
  return NextResponse.json({ success: true });
}
