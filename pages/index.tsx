import React, { useState, useEffect, Fragment } from 'react'
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
  const [botOnline, setBotOnline] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Rate limiting
  const MAX_ATTEMPTS = 10
  const [attempts, setAttempts] = useState(0)
  const [blocked, setBlocked] = useState(false)

  const isValidEmail = (e: string) => /\S+@\S+\.\S+/.test(e)
  const sanitize = (s: string) => s.trim()

  useEffect(() => {
    setMounted(true)

    // Autofill orderNumber & email from URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const orderNum = params.get('orderNumber')
      const emailParam = params.get('email')
      if (orderNum) setOrderNumber(orderNum)
      if (emailParam) setEmail(emailParam)
    }

    // Fetch bot status for ID 8651861428
    ;(async function fetchStatus(id: string) {
      try {
        const res = await fetch(`/api/bot-status?id=${encodeURIComponent(id)}`)
        const json = await res.json()
        setBotOnline(Boolean(json?.IsOnline))
      } catch {
        setBotOnline(false)
      }
    })('8651861428')
  }, [])

  async function handleNextStep() {
    if (blocked) return
    const e = sanitize(email)
    const o = sanitize(orderNumber)
    const u = sanitize(username)
    if (!e || !o || !u) {
      setError('Please fill out all fields.')
      return
    }
    if (!isValidEmail(e)) {
      setError('Please enter a valid email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/validate-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: o, email: e }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) throw new Error(data.message || 'Order check failed.')

      const robloxRes = await fetch(`/api/roblox-user?username=${encodeURIComponent(u)}`)
      const robloxData = await robloxRes.json()
      if (!robloxRes.ok || !robloxData.avatarUrl) throw new Error('Roblox user not found.')

      setAttempts(0)
      setAvatarUrl(robloxData.avatarUrl)
      setUsername(u)
      setOrderNumber(o)
      setEmail(e)
      setStep(2)
    } catch (err: any) {
      const next = attempts + 1
      setAttempts(next)
      if (next >= MAX_ATTEMPTS) {
        setBlocked(true)
        setError('Too many attempts. Please wait before retrying.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function confirmIdentity() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/confirm-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, username, email, items: 'Claim Bundle' }),
      })
      if (!res.ok) throw new Error('Failed to confirm claim.')
      setStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  const steps = [
    { id: 1, label: 'Verify' },
    { id: 2, label: 'Confirm' },
    { id: 3, label: 'Claim' },
  ]

  return (
    <>
      <Head>
        <title>Claim Your Items</title>
      </Head>

      {/* Fixed Announcement Bar */}
      <div className="fixed top-0 left-0 w-full bg-blue-600 text-white text-center py-3 z-50">
        NOTE: If your order is not from GROW A GARDEN please contact us via live chat or our{' '}
        <a
          href="https://discord.gg/shopbloxs"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold"
        >
          Discord server
        </a>{' '}
        to claim the items you purchased.
      </div>

      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-6 py-16 pt-20 overflow-y-auto">
        <div className="relative w-full max-w-xl bg-gray-850/90 backdrop-blur-md rounded-2xl p-10 pb-12 shadow-2xl text-white">

          {/* Step Indicator */}
          <div className="flex items-center mb-10">
            {steps.map((s, i) => (
              <Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${
                      step >= s.id ? 'border-blue-500 bg-blue-500' : 'border-gray-700'
                    }`}
                  >
                    <span className="font-bold text-lg">{s.id}</span>
                  </div>
                  <span className={`${step >= s.id ? 'text-blue-400' : 'text-gray-500'} mt-2 text-sm`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${step > s.id ? 'bg-blue-500' : 'bg-gray-700'}`} />
                )}
              </Fragment>
            ))}
          </div>

          {/* Back Link */}
          {step !== 1 && (
            <button
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
              className="mb-6 text-sm text-blue-400 hover:text-blue-300 transition"
            >
              ← Back
            </button>
          )}

          {/* Step 1: Verify */}
          {step === 1 && (
            <>
              <h1 className="mb-4 text-4xl font-bold text-center">Verify</h1>
              <p className="mb-6 text-center text-gray-400">Enter your order email and Roblox username</p>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-gray-800 px-4 py-3 placeholder-gray-500"
                />
                <input
                  type="text"
                  placeholder="Order #"
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value)}
                  className="w-full rounded-lg bg-gray-800 px-4 py-3 placeholder-gray-500"
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full rounded-lg bg-gray-800 px-4 py-3 placeholder-gray-500"
                />
              </div>
              {error && <div className="mt-3 text-red-500 text-center">{error}</div>}
              <button
                onClick={handleNextStep}
                disabled={loading || blocked}
                className="mt-8 w-full py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 font-semibold shadow-lg hover:from-blue-700 hover:to-blue-300 transition"
              >
                {loading ? 'Checking…' : 'Next Step'}
              </button>
            </>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <>
              <h1 className="mb-4 text-4xl font-bold text-center">Confirm</h1>
              <p className="mb-6 text-center text-gray-400">
                Is this your <span className="text-white font-semibold">Roblox</span> account?
              </p>
              <div className="flex justify-center mb-4">
                <img src={avatarUrl} alt="avatar" className="h-24 w-24 rounded-full border-4 border-blue-500" />
              </div>
              <p className="text-center text-lg mb-6">{username}</p>
              <div className="flex gap-4">  
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-full border border-blue-500 text-blue-500 hover:bg-blue-500/10 transition"
                >
                  Go Back
                </button>
                <button
                  onClick={confirmIdentity}
                  className="flex-1 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 font-semibold shadow-lg hover:from-blue-700 hover:to-blue-300 transition"
                >
                  That's Me
                </button>
              </div>
            </>
          )}

          {/* Step 3: Claim */}
          {step === 3 && (
            <>
              <h1 className="mb-4 text-4xl font-bold text-center">Claim</h1>
              <p className="mb-6 text-center text-gray-400">
                If your account is under 13, please add the delivery account. Claim times may vary, but we’ll get you your
                order as soon as the bot is online.
              </p>
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Delivery Bot</span>
                  <span className={botOnline ? 'text-green-400' : 'text-red-400'}>
                    {botOnline ? '🟢 Online' : '🔴 Offline'}  
                  </span>
                </div>
                <div className="flex gap-4">
                  <a
                    href="https://www.roblox.com/users/8651861428/profile"
                    className="flex-1 py-2 rounded-full bg-gray-700 text-white text-center hover:bg-gray-600 transition"
                  >
                    View Profile
                  </a>
                  {botOnline ? (
                    <a
                      href="https://www.roblox.com/share?code=0cc0c2ece513854f8a35fe346446f759&type=Server"
                      className="flex-1 py-2 rounded-full bg-blue-500 text-white text-center hover:bg-blue-600 transition"
                    >
                      Join Server
                    </a>
                  ) : (
                    <button
                      onClick={() => setShowModal(true)}
                      className="flex-1 py-2 rounded-full bg-gray-700 text-white text-center"
                    >
                      Offline
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Offline Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <div className="bg-gray-850 p-6 rounded-xl max-w-xs text-center shadow-xl">
                <h2 className="text-xl font-bold mb-4">Hey!</h2>
                <p className="mb-6 text-gray-300">
                  Our delivery team is currently offline. We'll email you once the claim system is back up.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 font-semibold hover:from-blue-700 hover:to-blue-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  )
}
