import type { NextApiRequest, NextApiResponse } from 'next';

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { orderNumber, username, email, items } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Basic safety check for Discord field limits
  const safeText = (text: string | undefined, fallback = 'N/A') =>
    text ? String(text).slice(0, 1000) : fallback;

  try {
    const embed = {
      embeds: [
        {
          title: 'New MM2Land Claim',
          color: 5814783,
          fields: [
            { name: 'Order #', value: safeText(`#${orderNumber}`), inline: true },
            { name: 'Roblox Username', value: safeText(username), inline: true },
            { name: 'Email', value: safeText(email), inline: true },
            { name: 'Items', value: safeText(items), inline: false },
            { name: 'IP Address', value: safeText(`${ip}`), inline: false }
          ],
          timestamp: new Date().toISOString(),
        }
      ]
    };

    const discordRes = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed)
    });

    const result = await discordRes.text();
    console.log('Discord webhook status:', discordRes.status);
    console.log('Discord webhook response:', result);

    if (!discordRes.ok) {
      return res.status(500).json({ message: 'Discord rejected the webhook' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ message: 'Webhook failed' });
  }
}
