import type { NextApiRequest, NextApiResponse } from 'next';
import { LRUCache } from 'lru-cache';

// 🔥 HARDCODED TOKEN AND DOMAIN (ONLY FOR DEVELOPMENT)
const SHOPIFY_STORE_DOMAIN = '64q1g1-1c.myshopify.com';
const SHOPIFY_ADMIN_TOKEN = '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';

const rateLimit = new LRUCache<string, number>({
  max: 500,
  ttl: 1000 * 60, // 1 minute
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string;

  const hits = rateLimit.get(ip) || 0;
  if (hits >= 5) {
    return res.status(429).json({ message: 'Rate limit exceeded. Try again in 1 minute.' });
  }

  rateLimit.set(ip, hits + 1);

  if (req.method !== 'POST') return res.status(405).end();

  const { orderNumber, email } = req.body;

  try {
    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/orders.json?name=${orderNumber}`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    const order = data.orders?.[0];

    if (!order) {
      return res.status(404).json({ valid: false, message: 'Order not found.' });
    }

    if (order.financial_status === 'paid' && order.fulfillment_status === 'fulfilled') {
      return res.status(403).json({ valid: false, message: 'This order has already been fulfilled.' });
    }

    if (order.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ valid: false, message: 'Email does not match this order.' });
    }

    return res.status(200).json({ valid: true });
  } catch (err) {
    console.error('Shopify validation error:', err);
    return res.status(500).json({ valid: false, message: 'Internal server error' });
  }
}
