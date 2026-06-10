import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getStoredPin, setStoredPin } from '../lib/auth'

export default function PinGate({ children }) {
  const [pin, setPin] = useState(getStoredPin() || '')
  const [authenticated, setAuthenticated] = useState(Boolean(getStoredPin()))
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(false)
  const [serverOnline, setServerOnline] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => setServerOnline(res.ok))
      .catch(() => setServerOnline(false))
  }, [])

  if (authenticated) {
    return children
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setChecking(true)
    setError(null)

    try {
      await api.verifyPin(pin)
      setStoredPin(pin)
      setAuthenticated(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-clinic-600">
          Queue Cure &apos;26
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Receptionist Login</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter the clinic PIN to access queue controls. Default PIN: <strong>1234</strong>
        </p>

        {serverOnline === false && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            API server is offline. In the project folder run: <code className="font-mono">npm run dev</code>
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="pin" className="mb-1 block text-sm font-medium text-slate-700">
              PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-clinic-500 focus:outline-none focus:ring-2 focus:ring-clinic-500/20"
              autoComplete="off"
            />
          </div>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!pin || checking}
            className="w-full rounded-lg bg-clinic-600 px-4 py-3 font-semibold text-white transition hover:bg-clinic-700 focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {checking ? 'Verifying…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  )
}
