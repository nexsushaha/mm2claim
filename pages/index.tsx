import React, { useState, useEffect } from 'react'
import Head from 'next/head'

export default function ClaimPage() {
  const [mounted, setMounted] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bot1Online, setBot1Online] = useState<boolean | null>(null)
  const [bot2Online, setBot2Online] = useState<boolean | null>(null)

  useEffect(() => {
    setMounted(true)

    // —— NEW: autofill orderNumber & email from URL ——
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const orderNum = params.get('orderNumber')
      const emailParam = params.get('email')

      if (orderNum) setOrderNumber(orderNum)
      if (emailParam) setEmail(emailParam)
    }
    // ————————————————————————————————

    // existing bot‐status fetches
    const fetchStatus = async (id: string) => {
      try {
        const res = await fetch(`/api/bot-status?id=${id}`)
        const json = await res.json()
        return json?.IsOnline ?? false
      } catch {
        return false
      }
    }
    fetchStatus('8724540776').then(setBot1Online)
    fetchStatus('8733673918').then(setBot2Online)
  }, [])

  const handleNextStep = async () => {
    if (!email || !orderNumber || !username) {
      setError('Please fill out all fields.')
      return
    }
    setLoading(true)
    setError('')
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

    const robloxRes = await fetch(`/api/roblox-user?username=${encodeURIComponent(username)}`)
    const robloxData = await robloxRes.json()
    if (!robloxRes.ok || !robloxData.avatarUrl) {
      setError('Roblox user not found.')
      setLoading(false)
      return
    }
    setAvatarUrl(robloxData.avatarUrl)
    setStep(2 as 1 | 2 | 3)
    setLoading(false)
  }

  const confirmIdentity = async () => {
    setLoading(true)
    setError('')
    try {
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
      setStep(3 as 1 | 2 | 3)
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
        <title>Claim Your Items</title>
      </Head>
      <main className="min-h-screen bg-gradient-to-b from-[#14001f] via-[#1b0142] to-[#000000] flex items-center justify-center px-4 py-12 text-white">
        <div className="w-full max-w-xl bg-[#0f0f1e] rounded-2xl p-8 shadow-2xl border border-white/10">
          {step !== 1 && (
            <button
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
              className="mb-6 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
            >
              <span className="inline-block w-4 h-4 bg-white rounded-full"></span>
              Back
            </button>
          )}

          {error && (
            <div className="mb-4 px-4 py-2 text-sm bg-red-600/10 text-red-400 border border-red-500 rounded-lg">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">
                Claim Your Items
              </h1>
              <p className="text-center text-sm text-gray-400 mb-8">
                Enter your order email, number and Roblox username.
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full px-4 py-3 bg-[#1b1e2c] rounded-lg text-sm text-white placeholder-gray-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Order #"
                  className="w-full px-4 py-3 bg-[#1b1e2c] rounded-lg text-sm text-white placeholder-gray-500"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Roblox Username"
                  className="w-full px-4 py-3 bg-[#1b1e2c] rounded-lg text-sm text-white placeholder-gray-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <button
                  onClick={handleNextStep}
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'Next Step'}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3">Is this your Roblox account?</h2>
              <img
                src={avatarUrl}
                alt="Roblox Avatar"
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-purple-600 shadow-lg"
              />
              <p className="text-lg font-semibold mb-6">{username}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1 as 1 | 2 | 3)}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg shadow-md hover:shadow-lg"
                >
                  Go Back
                </button>
                <button
                  onClick={confirmIdentity}
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60 shadow-md hover:shadow-lg"
                >
                  {loading ? 'Submitting...' : "That's Me"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold">🎉 Final Step</h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Add a bot if you're under 13 or can't join the private server. It may take up to 10 minutes to be accepted.
              </p>

              {[1, 2].map((i) => {
                const botOnline = i === 1 ? bot1Online : bot2Online
                const botId = i === 1 ? '8724540776' : '8733673918'
                const serverLink = i === 1
                  ? 'https://www.roblox.com/share?code=52dc1c71c72c6e448cca3c4d50ed9969&type=Server'
                  : 'https://www.roblox.com/share?code=fdad97e397fdf64f999c682ab5ad3ea7&type=Server'

                return (
                  <div
                    key={i}
                    className="bg-[#1c1f2e] p-5 rounded-xl border border-white/10 space-y-4"
                  >
                    <h3 className="text-lg font-semibold flex justify-between items-center">
                      <span>Bot {i}</span>
                      <span className={botOnline ? 'text-green-400' : 'text-gray-400'}>
                        {botOnline === null ? 'Checking...' : botOnline ? '🟢 Online' : '🔴 Offline'}
                      </span>
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href={`https://www.roblox.com/users/${botId}/profile`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white text-center shadow hover:shadow-lg"
                      >
                        Add Bot {i} as Friend
                      </a>
                      <a
                        href={botOnline ? serverLink : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!botOnline) e.preventDefault()
                        }}
                        className={`flex-1 py-2 px-4 text-sm text-center rounded-lg shadow ${
                          botOnline
                            ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {botOnline ? `Join Bot ${i} VIP Server` : `Bot ${i} is Offline`}
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
