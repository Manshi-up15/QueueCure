import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'
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
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-medium uppercase tracking-wide text-clinic-600 dark:text-clinic-400">
          Queue Cure &apos;26
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Receptionist Login</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enter the clinic PIN to access queue controls. Default PIN: <strong>1234</strong>
        </p>

        {serverOnline === false && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            API server is offline. In the project folder run: <code className="font-mono">npm run dev</code>
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="pin" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] text-slate-900 focus:border-clinic-500 focus:outline-none focus:ring-2 focus:ring-clinic-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-clinic-400/30"
              autoComplete="off"
            />
          </div>

          {error && <p className="text-center text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={!pin || checking}
            className="w-full rounded-lg bg-clinic-600 px-4 py-3 font-semibold text-white transition hover:bg-clinic-700 focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-slate-900"
          >
            {checking ? 'Verifying…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  )
}
