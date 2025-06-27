// File: pages/api/roblox-user.ts
import type { NextApiRequest, NextApiResponse } from 'next'

type RobloxUserResponse =
  | { avatarUrl: string; id: number }
  | { message: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RobloxUserResponse>
) {
  const username = Array.isArray(req.query.username)
    ? req.query.username[0]
    : req.query.username

  if (!username) {
    return res.status(400).json({ message: 'Username required' })
  }

  try {
    // 1) Lookup the user ID by username
    const lookupRes = await fetch(
      'https://users.roblox.com/v1/usernames/users',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] }),
      }
    )
    if (!lookupRes.ok) {
      throw new Error(`Roblox lookup failed: ${lookupRes.status}`)
    }
    const lookupJson = await lookupRes.json() as { data?: any[] }
    const user = lookupJson.data?.[0]
    if (!user) {
      return res.status(404).json({ message: 'Roblox user not found.' })
    }
    const userId = user.id

    // 2) Fetch the avatar headshot
    const avatarRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}` +
      `&size=150x150&format=Png&isCircular=true`
    )
    if (!avatarRes.ok) {
      throw new Error(`Avatar fetch failed: ${avatarRes.status}`)
    }
    const avatarJson = await avatarRes.json() as { data?: { imageUrl?: string }[] }
    const avatarUrl = avatarJson.data?.[0]?.imageUrl
    if (!avatarUrl) {
      return res.status(500).json({ message: 'Failed to get avatar URL.' })
    }

    // 3) Return both URL and ID for downstream friend-accept logic
    return res.status(200).json({ avatarUrl, id: userId })
  } catch (err: any) {
    console.error('🛠️ /api/roblox-user error:', err)
    return res.status(500).json({ message: 'Internal server error.' })
  }
}
