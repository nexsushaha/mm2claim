import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ IsOnline: false })

  try {
    const robloxRes = await fetch(`https://presence.roblox.com/v1/presence/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [parseInt(id)] }),
    })

    const data = await robloxRes.json()
    const presenceType = data?.userPresences?.[0]?.userPresenceType

    // ONLINE if not 0 (0 = fully offline)
    const isOnline = presenceType !== 0

    return res.status(200).json({ IsOnline: isOnline })
  } catch (err) {
    console.error('Bot status fetch error:', err)
    return res.status(500).json({ IsOnline: false })
  }
}
