import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueueLive } from '../hooks/useQueueLive'

function formatWaitTime(minutes) {
  if (minutes === null || minutes === undefined) return '—'
  if (minutes === 0) return 'Up next'
  if (minutes < 60) return `~${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`
}

function formatLastUpdated(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '—'
  }
}

export default function PatientView() {
  const { state, loading, connected, lookupPatient } = useQueueLive()
  const [myToken, setMyToken] = useState('')
  const [lookup, setLookup] = useState(null)
  const [lookupError, setLookupError] = useState(null)
  const [pulse, setPulse] = useState(false)
  const prevTokenRef = useRef(0)

  useEffect(() => {
    if (!state) return

    if (state.currentToken !== prevTokenRef.current && state.currentToken > 0) {
      setPulse(true)
      const timer = setTimeout(() => setPulse(false), 1500)
      prevTokenRef.current = state.currentToken
      return () => clearTimeout(timer)
    }

    prevTokenRef.current = state.currentToken
    return undefined
  }, [state?.currentToken, state])

  useEffect(() => {
    if (!myToken) {
      setLookup(null)
      setLookupError(null)
      return undefined
    }

    const token = Number(myToken)
    if (!Number.isFinite(token) || token <= 0) {
      setLookup(null)
      setLookupError('Enter a valid token number')
      return undefined
    }

    let cancelled = false

    lookupPatient(token)
      .then((data) => {
        if (!cancelled) {
          setLookup(data)
          setLookupError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLookup(null)
          setLookupError(err.message)
        }
      })

    return () => {
      cancelled = true
    }
  }, [myToken, state?.lastUpdated, lookupPatient])

  if (loading || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        Loading display…
      </div>
    )
  }

  const isProceed = lookup?.status === 'in_consultation'
  const isGetReady = lookup?.status === 'waiting' && lookup?.tokensAhead === 0
  const isWaiting = lookup?.status === 'waiting' && lookup?.tokensAhead > 0

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-clinic-400">
            Queue Cure &apos;26
          </p>
          <h1 className="text-lg font-semibold text-white/90 sm:text-xl">Patient Waiting Room</h1>
          <p className="text-xs text-white/50">{connected ? 'Live' : 'Reconnecting…'}</p>
        </div>
        <span className="rounded-full bg-serve-500/20 px-3 py-1 text-xs font-medium text-serve-300">
          {connected ? '● Live' : '○ Reconnecting'}
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <p className="mb-3 text-base font-medium uppercase tracking-[0.25em] text-clinic-400 sm:text-xl sm:tracking-[0.3em]">
          Now Serving
        </p>
        <div
          className={`mb-8 flex h-40 w-40 items-center justify-center rounded-3xl bg-serve-600 sm:mb-12 sm:h-56 sm:w-56 lg:h-72 lg:w-72 ${
            pulse ? 'animate-token-pulse' : ''
          }`}
        >
          <span className="text-[5rem] font-bold leading-none tabular-nums sm:text-[8rem] lg:min-h-[96px] lg:text-[10rem]">
            {state.currentToken > 0 ? state.currentToken : '—'}
          </span>
        </div>

        <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-6">
          <h2 className="mb-4 text-center text-lg font-semibold text-white/90">
            Check Your Wait Time
          </h2>
          <label htmlFor="my-token" className="mb-2 block text-sm text-white/70">
            Enter your token number
          </label>
          <input
            id="my-token"
            type="number"
            min="1"
            inputMode="numeric"
            value={myToken}
            onChange={(e) => setMyToken(e.target.value)}
            placeholder="e.g. 12"
            className="mb-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-2xl font-bold tabular-nums text-white placeholder:text-white/30 focus:border-clinic-400 focus:outline-none focus:ring-2 focus:ring-clinic-400/30"
          />

          {lookupError && (
            <p className="text-center text-sm text-red-300">{lookupError}</p>
          )}

          {isProceed && (
            <div className="rounded-xl border border-serve-500 bg-serve-600/30 px-4 py-4 text-center">
              <p className="text-xl font-bold text-serve-400">Please Proceed</p>
              <p className="mt-1 text-white/80">{lookup.message}</p>
            </div>
          )}

          {isGetReady && (
            <div className="rounded-xl border border-amber-400/50 bg-amber-500/20 px-4 py-4 text-center">
              <p className="text-xl font-bold text-amber-300">Get Ready</p>
              <p className="mt-1 text-white/80">{lookup.message}</p>
            </div>
          )}

          {isWaiting && (
            <div className="grid grid-cols-2 gap-3 text-center sm:gap-4">
              <div className="rounded-xl bg-white/5 px-3 py-3 sm:px-4">
                <p className="text-sm text-white/60">Tokens ahead</p>
                <p className="text-3xl font-bold tabular-nums">{lookup.tokensAhead}</p>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-3 sm:px-4">
                <p className="text-sm text-white/60">Estimated wait</p>
                <p className="text-2xl font-bold sm:text-3xl">
                  {formatWaitTime(lookup.estimatedWaitMinutes)}
                </p>
              </div>
            </div>
          )}

          {lookup && lookup.status === 'done' && (
            <p className="text-center text-sm text-white/60">{lookup.message}</p>
          )}

          {!myToken && (
            <p className="text-center text-sm text-white/50">
              Enter your token to see your position and estimated wait time.
            </p>
          )}
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/20 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 text-sm text-white/70">
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <span>
              <strong className="text-white">{state.waiting.length}</strong> patients waiting
            </span>
            <span>
              Avg. consultation:{' '}
              <strong className="text-white">{state.avgConsultMin} min</strong>
            </span>
          </div>
          <span>
            Updated:{' '}
            <strong className="text-white">{formatLastUpdated(state.lastUpdated)}</strong>
          </span>
        </div>
      </footer>
    </div>
  )
}
