import { load } from 'cheerio';

export interface ScrapedItem {
  title?: string;
  price?: string;
  priceRaw?: number;
  image?: string;
  description?: string;
}

function extractPrice(text: string): number | undefined {
  const match = text.match(/\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
  if (match) return parseFloat(match[1].replace(/,/g, ''));
  return undefined;
}

export async function scrapeUrl(url: string): Promise<ScrapedItem> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const $ = load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text().trim() ||
      $('h1').first().text().trim();

    const imageRaw =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('[itemprop="image"]').attr('src') ||
      $('img').first().attr('src');

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content');

    let price: string | undefined;
    let priceRaw: number | undefined;

    const metaPriceAmount = $('meta[property="product:price:amount"]').attr('content');
    if (metaPriceAmount) {
      priceRaw = parseFloat(metaPriceAmount);
      const currency = $('meta[property="product:price:currency"]').attr('content') || 'USD';
      try {
        price = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(priceRaw);
      } catch {
        price = `${currency} ${priceRaw.toFixed(2)}`;
      }
    }

    if (!price) {
      const priceSelectors = [
        '[itemprop="price"]',
        '.a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.price',
        '#price',
        '.product-price',
        '.offer-price',
        '[class*="price"]',
      ];
      for (const selector of priceSelectors) {
        const el = $(selector).first();
        if (el.length) {
          const content = el.attr('content') || el.attr('data-price') || el.text().trim();
          if (content && /[\$£€\d]/.test(content) && content.length < 30) {
            price = content.replace(/\s+/g, ' ').trim();
            priceRaw = extractPrice(content);
            break;
          }
        }
      }
    }

    let image = imageRaw;
    if (image && !image.startsWith('http')) {
      try {
        const base = new URL(url);
        image = image.startsWith('//')
          ? `${base.protocol}${image}`
          : new URL(image, base).href;
      } catch {
        image = undefined;
      }
    }

    return {
      title: title?.slice(0, 300) || undefined,
      price,
      priceRaw,
      image: image || undefined,
      description: description?.slice(0, 500) || undefined,
    };
  } catch (err) {
    console.error('Scrape error for', url, err);
    return {};
  }
}
