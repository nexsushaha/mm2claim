import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function ClaimPage() {
  const [mounted, setMounted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNextStep = async () => {
    if (!email || !orderNumber || !username) {
      setError('Please fill out all fields.');
      return;
    }

    setLoading(true);
    setError('');

    const orderRes = await fetch('/api/validate-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber, email }),
    });

    if (!orderRes.ok) {
      const errorText = await orderRes.text();
      setError(`Order check failed: ${errorText}`);
      setLoading(false);
      return;
    }

    const orderData = await orderRes.json();
    if (!orderData.valid) {
      setError(orderData.message || 'Invalid order or email');
      setLoading(false);
      return;
    }

    const robloxRes = await fetch(`/api/roblox-user?username=${username}`);
    if (!robloxRes.ok) {
      const errorText = await robloxRes.text();
      setError(`Roblox check failed: ${errorText}`);
      setLoading(false);
      return;
    }

    const robloxData = await robloxRes.json();
    if (!robloxData.avatarUrl) {
      setError('Roblox user not found.');
      setLoading(false);
      return;
    }

    setAvatarUrl(robloxData.avatarUrl);
    setShowConfirm(true);
    setLoading(false);
  };

  const confirmIdentity = async () => {
    const res = await fetch('/api/confirm-claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber, username, email, items: 'Claim Bundle' }),
    });

    if (res.ok) {
      setShowConfirm(false);
      setConfirmed(true);
    } else {
      setError('Failed to confirm claim.');
    }
  };

  return (
    <>
      <Head>
        <title>Claim MM2 Items</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      {mounted && (
        <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-sans p-6">
          <div className="w-full max-w-lg rounded-xl bg-[#101322] shadow-2xl p-10">
            {!showConfirm && !confirmed && (
              <div>
                <h1 className="text-4xl font-extrabold text-center mb-1 text-white tracking-tight">
                  <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text">Claim MM2 Items</span>
                </h1>
                <p className="text-center text-sm text-gray-400 mb-8">
                  Fill this form to get access to your items.
                </p>

                {error && (
                  <div className="mb-4 px-4 py-2 text-sm rounded bg-red-500/20 text-red-300 border border-red-500">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email address"
                    className="w-full px-4 py-3 bg-[#1c1f2e] rounded-lg text-sm text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Order # (e.g. 12345)"
                    className="w-full px-4 py-3 bg-[#1c1f2e] rounded-lg text-sm text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Roblox Username"
                    className="w-full px-4 py-3 bg-[#1c1f2e] rounded-lg text-sm text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />

                  <button
                    onClick={handleNextStep}
                    disabled={loading}
                    className="w-full py-3 rounded-lg text-white font-semibold text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-60"
                  >
                    {loading ? 'Checking...' : 'Next Step'}
                  </button>
                </div>
              </div>
            )}

            {showConfirm && !confirmed && (
              <div className="text-center">
                <h2 className="text-3xl font-extrabold mb-2 text-white">
                  Claim MM2 Items
                </h2>
                <p className="text-sm text-gray-400 mb-6">Is this you? Confirm to continue.</p>
                <div className="flex justify-center mb-4">
                  <img
                    src={avatarUrl}
                    alt="Roblox Avatar"
                    className="w-24 h-24 rounded-full border-4 border-purple-500 shadow-md"
                  />
                </div>
                <div className="font-semibold text-white text-lg mb-6">{username}</div>
                <div className="flex justify-between gap-4">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md text-sm"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={confirmIdentity}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm"
                  >
                    That's Me
                  </button>
                </div>
              </div>
            )}

            {confirmed && (
              <div className="text-center">
                <h2 className="text-3xl font-extrabold mb-2 text-white">
                  Claim MM2 Items
                </h2>
                <p className="text-sm text-gray-400 mb-6">
                  Final step — use the buttons below to access your server.
                </p>
                <div className="space-y-3">
                  <a
                    href="https://your-private-server-link.com"
                    className="block w-full py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Private Server
                  </a>
                  <a
                    href="https://your-discord-bot-link.com"
                    className="block w-full py-3 rounded-lg text-white bg-red-600 hover:bg-red-700 text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Add the Bot
                  </a>
                  <button className="block w-full py-3 rounded-lg text-white bg-yellow-500 hover:bg-yellow-600 text-sm">
                    I Sent a Friend Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      )}
    </>
  );
}
