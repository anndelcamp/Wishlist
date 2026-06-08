import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { scrapeUrl } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(params.id) as { url: string } | undefined;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const scraped = await scrapeUrl(item.url);

  db.prepare(`
    UPDATE items SET price = ?, price_raw = ?, last_price_check = CURRENT_TIMESTAMP WHERE id = ?
  `).run(scraped.price ?? null, scraped.priceRaw ?? null, params.id);

  const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(params.id);
  return NextResponse.json(updated);
}
