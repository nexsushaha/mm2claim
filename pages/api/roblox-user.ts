import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ message: 'Username required' });
  }

  try {
    const userRes = await fetch(`https://users.roblox.com/v1/usernames/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username] }),
    });

    const userData = await userRes.json();
    const userId = userData.data?.[0]?.id;

    if (!userId) return res.status(404).json({ message: 'User not found' });

    const avatarRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`
    );

    const avatarData = await avatarRes.json();
    const avatarUrl = avatarData.data?.[0]?.imageUrl;

    return res.status(200).json({ avatarUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal error' });
  }
}
