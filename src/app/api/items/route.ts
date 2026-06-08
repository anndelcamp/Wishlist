import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { scrapeUrl } from '@/lib/scraper';
import { getAuthUser } from '@/lib/auth';

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

const LABEL_SUBQUERY = `
  (SELECT GROUP_CONCAT(il2.label_id) FROM item_labels il2 WHERE il2.item_id = i.id) as label_ids,
  (SELECT GROUP_CONCAT(l2.name) FROM item_labels il2 JOIN labels l2 ON il2.label_id = l2.id WHERE il2.item_id = i.id) as label_names,
  (SELECT GROUP_CONCAT(l2.color) FROM item_labels il2 JOIN labels l2 ON il2.label_id = l2.id WHERE il2.item_id = i.id) as label_colors
`;

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const labelId = searchParams.get('labelId');

  if (labelId) {
    const accessible = db.prepare(`
      SELECT l.id FROM labels l
      LEFT JOIN label_shares ls ON l.id = ls.label_id AND ls.shared_with_user_id = ?
      WHERE l.id = ? AND (l.user_id = ? OR ls.shared_with_user_id = ?)
    `).get(auth.userId, labelId, auth.userId, auth.userId);
    if (!accessible) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const items = db.prepare(`
      SELECT i.*, ${LABEL_SUBQUERY}
      FROM items i
      JOIN item_labels il ON i.id = il.item_id
      WHERE il.label_id = ?
      ORDER BY i.created_at DESC
    `).all(labelId);
    return NextResponse.json((items as Record<string, unknown>[]).map(parseItem));
  }

  const items = db.prepare(`
    SELECT i.*, ${LABEL_SUBQUERY}
    FROM items i
    WHERE i.user_id = ?
       OR i.id IN (
         SELECT il3.item_id FROM item_labels il3
         JOIN label_shares ls ON il3.label_id = ls.label_id
         WHERE ls.shared_with_user_id = ?
       )
    ORDER BY i.created_at DESC
  `).all(auth.userId, auth.userId);

  return NextResponse.json((items as Record<string, unknown>[]).map(parseItem));
}

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, labelIds } = await request.json();
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

  const scraped = await scrapeUrl(url.trim());

  const result = db.prepare(`
    INSERT INTO items (url, title, image_url, price, price_raw, description, last_price_check, user_id)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
  `).run(url.trim(), scraped.title ?? null, scraped.image ?? null, scraped.price ?? null,
    scraped.priceRaw ?? null, scraped.description ?? null, auth.userId);

  const itemId = result.lastInsertRowid;

  if (labelIds?.length) {
    // Only allow labels the user owns
    const ins = db.prepare('INSERT OR IGNORE INTO item_labels (item_id, label_id) VALUES (?, ?)');
    for (const lid of labelIds) {
      const ok = db.prepare('SELECT id FROM labels WHERE id = ? AND user_id = ?').get(lid, auth.userId);
      if (ok) ins.run(itemId, lid);
    }
  }

  const item = db.prepare(`SELECT i.*, ${LABEL_SUBQUERY} FROM items i WHERE i.id = ?`).get(itemId);
  return NextResponse.json(parseItem(item as Record<string, unknown>), { status: 201 });
}
