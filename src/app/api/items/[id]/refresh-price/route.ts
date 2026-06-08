import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { scrapeUrl } from '@/lib/scraper';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(params.id) as { url: string; user_id: number } | undefined;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Allow access if owner or has shared access
  const hasAccess = db.prepare(`
    SELECT 1 FROM items WHERE id = ? AND user_id = ?
    UNION
    SELECT 1 FROM item_labels il
    JOIN label_shares ls ON il.label_id = ls.label_id
    WHERE il.item_id = ? AND ls.shared_with_user_id = ?
  `).get(params.id, auth.userId, params.id, auth.userId);
  if (!hasAccess) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const scraped = await scrapeUrl(item.url);
  db.prepare('UPDATE items SET price = ?, price_raw = ?, last_price_check = CURRENT_TIMESTAMP WHERE id = ?')
    .run(scraped.price ?? null, scraped.priceRaw ?? null, params.id);

  const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(params.id);
  return NextResponse.json(updated);
}
