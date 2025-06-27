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

  const { orderNumber, username, email } = req.body as {
    orderNumber: string
    username: string
    email: string
  }

  if (!orderNumber || !username || !email) {
    return res.status(400).json({ message: 'orderNumber, username & email are required.' })
  }

  // Get user ID + displayName
  const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username] }),
  })

  const userData = await userRes.json()
  const user = userData.data?.[0]

  if (!user) {
    return res.status(404).json({ message: 'Roblox user not found' })
  }

  const displayName = user.displayName
  const userId = user.id

  // Step 2: fetch working thumbnail URL
  const thumbRes = await fetch(
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
  )
  const thumbData = await thumbRes.json()
  const imageUrl = thumbData.data?.[0]?.imageUrl

  const embed = {
    color: 0x6e40c9,
    title: `${displayName}`,
    url: `https://www.roblox.com/users/${userId}/profile`,
    description: [
      `**Roblox Username:** ${username}`,
      `**Display Name:** ${displayName}`,
      `**Order #:** #${orderNumber}`,
      `**Email:** ${email}`,
    ].join('\n\n'),
    thumbnail: {
      url: imageUrl || '', // fallback empty if fails
    },
    footer: {
      text: 'New BuyGaG Claim Submitted',
    },
    timestamp: new Date().toISOString(),
  }

  try {
    const discordRes = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '',
        embeds: [embed],
      }),
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
