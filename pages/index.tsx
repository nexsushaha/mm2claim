// File: pages/index.tsx
import React, { useState, useEffect } from 'react'
import Head from 'next/head'

export default function ClaimPage() {
  const [mounted, setMounted] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [step, setStep] = useState<1|2|3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNextStep = async () => {
    if (!email || !orderNumber || !username) {
      setError('Please fill out all fields.')
      return
    }
    setLoading(true)
    setError('')

    // 1) Validate order + email
    const orderRes = await fetch('/api/validate-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber, email }),
    })
    const orderData = await orderRes.json()
    if (!orderRes.ok || !orderData.valid) {
      setError(orderData.message || 'Order check failed.')
      setLoading(false)
      return
    }

    // 2) Fetch Roblox avatar
    const robloxRes = await fetch(
      `/api/roblox-user?username=${encodeURIComponent(username)}`
    )
    const robloxData = await robloxRes.json()
    if (!robloxRes.ok || !robloxData.avatarUrl) {
      setError('Roblox user not found.')
      setLoading(false)
      return
    }
    setAvatarUrl(robloxData.avatarUrl)

    setStep(2)
    setLoading(false)
  }

  const confirmIdentity = async () => {
    setLoading(true)
    setError('')

    try {
      // Send claim to Discord
      const res = await fetch('/api/confirm-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          username,
          email,
          items: 'Claim Bundle',
        }),
      })
      if (!res.ok) throw new Error('Failed to confirm claim.')

      setStep(3)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <>
      <Head>
        <title>Claim MM2 Items</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-sans p-6">
        <div className="w-full max-w-lg rounded-xl bg-[#101322] shadow-2xl p-10">
          {error && (
            <div className="mb-4 px-4 py-2 text-sm rounded bg-red-500/20 text-red-300 border border-red-500">
              {error}
            </div>
          )}

          {/* Step 1: Enter Details */}
          {step === 1 && (
            <>
              <h1 className="text-4xl font-extrabold text-center mb-1 tracking-tight">
                <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text">
                  Claim MM2 Items
                </span>
              </h1>
              <p className="text-center text-sm text-gray-400 mb-8">
                Fill this form to get access to your items.
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full px-4 py-3 bg-[#1c1f2e] rounded-lg text-sm text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Order #"
                  className="w-full px-4 py-3 bg-[#1c1f2e] rounded-lg text-sm text-white"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Roblox Username"
                  className="w-full px-4 py-3 bg-[#1c1f2e] rounded-lg text-sm text-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <button
                  onClick={handleNextStep}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg disabled:opacity-60"
                >
                  {loading ? 'Checking...' : 'Next Step'}
                </button>
              </div>
            </>
          )}

          {/* Step 2: Confirm Identity */}
          {step === 2 && (
            <div className="text-center">
              <h2 className="text-3xl font-extrabold mb-2">Confirm Your User</h2>
              <img
                src={avatarUrl}
                alt="Roblox Avatar"
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-purple-500 shadow-md"
              />
              <p className="font-semibold mb-6">{username}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Go Back
                </button>
                <button
                  onClick={confirmIdentity}
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60"
                >
                  {loading ? 'Submitting...' : "That's Me"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Final Step */}
          {step === 3 && (
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-extrabold">Final Step</h2>
              <p className="text-sm text-gray-400 mb-4">
                If your account is under 13, or you cannot join the private server please add the Roblox bot.
              </p>
              <a
                href="https://www.roblox.com/share?code=fd1849e039cadf4b9a215a93a8caca29&type=Server"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                Join Private Server
              </a>
              <a
                href="https://www.roblox.com/users/8437897411/profile"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white"
              >
                Add the Bot
              </a>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
