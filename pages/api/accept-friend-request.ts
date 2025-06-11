// File: pages/api/accept-friend-request.ts
import 'dotenv/config'   // ← ensure .env.local is loaded
import type { NextApiRequest, NextApiResponse } from 'next'
import * as noblox from 'noblox.js'

type Data = { success: true; accepted: number[] } | { message: string }

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const cookie = process.env.ROBUX_COOKIE
  if (!cookie) {
    console.warn('⚠️ ROBLOX_COOKIE not set; skipping friend acceptance')
    return res.status(200).json({ success: true, accepted: [] })
  }

  try {
    await noblox.setCookie(cookie)

    const requests = await noblox.getFriendRequests({ type: 'Received' })
    const toAccept = requests.map(r => r.UserId)

    const accepted: number[] = []
    for (const id of toAccept) {
      await noblox.acceptFriendRequest(id)
      accepted.push(id)
    }

    console.log('✅ accept-friend-request accepted IDs:', accepted)
    return res.status(200).json({ success: true, accepted })
  } catch (err: any) {
    console.error('❌ accept-friend-request error:', err)
    return res
      .status(500)
      .json({ message: 'Failed to accept pending friend requests.' })
  }
}
