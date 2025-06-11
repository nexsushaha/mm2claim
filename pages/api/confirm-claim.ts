// pages/api/confirm-claim.ts
import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = { success: true } | { message: string }

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK!

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
  }

  const { orderNumber, username, email, items } = req.body as {
    orderNumber: string
    username: string
    email: string
    items: string
  }

  if (!orderNumber || !username || !email || !items) {
    return res
      .status(400)
      .json({ message: 'orderNumber, username, email & items are required.' })
  }

  try {
    const embed = {
      embeds: [
        {
          title: 'New MM2Land Claim',
          color: 5814783,
          fields: [
            { name: 'Order #',           value: `#${orderNumber}`, inline: true },
            { name: 'Roblox Username',   value: username,          inline: true },
            { name: 'Email',             value: email,             inline: true },
            { name: 'Items',             value: items,             inline: false },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }

    const discordRes = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    })

    if (!discordRes.ok) {
      const text = await discordRes.text()
      console.error('Discord webhook failed:', discordRes.status, text)
      return res.status(500).json({ message: 'Discord webhook failed' })
    }

    return res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('confirm-claim error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
