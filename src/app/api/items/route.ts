import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { scrapeUrl } from '@/lib/scraper';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const labelId = searchParams.get('labelId');

  const base = `
    SELECT i.*, GROUP_CONCAT(il.label_id) as label_ids,
           GROUP_CONCAT(l.name) as label_names,
           GROUP_CONCAT(l.color) as label_colors
    FROM items i
    LEFT JOIN item_labels il ON i.id = il.item_id
    LEFT JOIN labels l ON il.label_id = l.id
  `;

  const items = labelId
    ? db.prepare(base + 'WHERE il.label_id = ? GROUP BY i.id ORDER BY i.created_at DESC').all(labelId)
    : db.prepare(base + 'GROUP BY i.id ORDER BY i.created_at DESC').all();

  return NextResponse.json((items as Record<string, unknown>[]).map(parseItem));
}

export async function POST(request: Request) {
  const { url, labelIds } = await request.json();
  if (!url?.trim()) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const scraped = await scrapeUrl(url.trim());

  const result = db.prepare(`
    INSERT INTO items (url, title, image_url, price, price_raw, description, last_price_check)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    url.trim(),
    scraped.title ?? null,
    scraped.image ?? null,
    scraped.price ?? null,
    scraped.priceRaw ?? null,
    scraped.description ?? null,
  );

  const itemId = result.lastInsertRowid;

  if (labelIds?.length) {
    const ins = db.prepare('INSERT OR IGNORE INTO item_labels (item_id, label_id) VALUES (?, ?)');
    for (const lid of labelIds) ins.run(itemId, lid);
  }

  const item = db.prepare(`
    SELECT i.*, GROUP_CONCAT(il.label_id) as label_ids,
           GROUP_CONCAT(l.name) as label_names,
           GROUP_CONCAT(l.color) as label_colors
    FROM items i
    LEFT JOIN item_labels il ON i.id = il.item_id
    LEFT JOIN labels l ON il.label_id = l.id
    WHERE i.id = ? GROUP BY i.id
  `).get(itemId);

  return NextResponse.json(parseItem(item as Record<string, unknown>), { status: 201 });
}
