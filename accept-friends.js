require('dotenv').config();
const noblox = require('noblox.js');

const COOKIE = process.env.ROBLOX_COOKIE;

async function acceptAllRequests() {
  try {
    await noblox.setCookie(COOKIE);
    const requests = await noblox.getFriendRequests();

    for (const user of requests) {
      await noblox.acceptFriendRequest(user.id);
      console.log(`✅ Accepted request from: ${user.username}`);
    }
  } catch (err) {
    console.error('❌ Failed to accept friends:', err.message);
  }
}

acceptAllRequests();
