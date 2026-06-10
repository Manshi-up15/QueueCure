import { useEffect, useRef, useState } from 'react'
import ThemeToggle from '../components/ThemeToggle'
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
  const [liveTime, setLiveTime] = useState(() => new Date())
  const prevTokenRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

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
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-white">
        Loading display…
      </div>
    )
  }

  const isProceed = lookup?.status === 'in_consultation'
  const isGetReady = lookup?.status === 'waiting' && lookup?.tokensAhead === 0
  const isWaiting = lookup?.status === 'waiting' && lookup?.tokensAhead > 0

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 dark:border-white/10">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-clinic-600 dark:text-clinic-400">
            Queue Cure &apos;26
          </p>
          <h1 className="text-lg font-semibold sm:text-xl">Patient Waiting Room</h1>
          <p className="text-xs text-slate-500 dark:text-white/50">
            {connected ? 'Live' : 'Reconnecting…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="rounded-full bg-serve-500/15 px-3 py-1 text-xs font-medium text-serve-700 dark:bg-serve-950 dark:text-serve-300">
            {connected ? '● Live' : '○ Reconnecting'}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <p className="mb-3 text-base font-medium uppercase tracking-[0.25em] text-clinic-600 sm:text-xl sm:tracking-[0.3em] dark:text-clinic-400">
          Now Serving
        </p>
        <div
          className={`mb-8 flex h-40 w-40 items-center justify-center rounded-3xl bg-serve-600 text-white dark:bg-serve-800 dark:ring-2 dark:ring-serve-700 sm:mb-12 sm:h-56 sm:w-56 lg:h-72 lg:w-72 ${
            pulse ? 'animate-token-pulse' : ''
          }`}
        >
          <span className="text-[5rem] font-bold leading-none tabular-nums sm:text-[8rem] lg:min-h-[96px] lg:text-[10rem]">
            {state.currentToken > 0 ? state.currentToken : '—'}
          </span>
        </div>

        <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 text-center text-lg font-semibold">Check Your Wait Time</h2>
          <label htmlFor="my-token" className="mb-2 block text-sm text-slate-600 dark:text-white/70">
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
            className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-bold tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-clinic-500 focus:outline-none focus:ring-2 focus:ring-clinic-500/20 dark:border-white/20 dark:bg-white/10 dark:text-white dark:placeholder:text-white/30 dark:focus:border-clinic-400 dark:focus:ring-clinic-400/30"
          />

          {lookupError && (
            <p className="text-center text-sm text-red-600 dark:text-red-300">{lookupError}</p>
          )}

          {isProceed && (
            <div className="rounded-xl border border-serve-500 bg-serve-50 px-4 py-4 text-center dark:border-serve-800 dark:bg-serve-950">
              <p className="text-xl font-bold text-serve-700 dark:text-serve-200">Please Proceed</p>
              <p className="mt-1 text-slate-600 dark:text-white/80">{lookup.message}</p>
            </div>
          )}

          {isGetReady && (
            <div className="rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-4 text-center dark:bg-amber-500/20">
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">Get Ready</p>
              <p className="mt-1 text-slate-600 dark:text-white/80">{lookup.message}</p>
            </div>
          )}

          {isWaiting && (
            <div className="grid grid-cols-2 gap-3 text-center sm:gap-4">
              <div className="rounded-xl bg-slate-100 px-3 py-3 dark:bg-white/5 sm:px-4">
                <p className="text-sm text-slate-500 dark:text-white/60">Tokens ahead</p>
                <p className="text-3xl font-bold tabular-nums">{lookup.tokensAhead}</p>
              </div>
              <div className="rounded-xl bg-slate-100 px-3 py-3 dark:bg-white/5 sm:px-4">
                <p className="text-sm text-slate-500 dark:text-white/60">Estimated wait</p>
                <p className="text-2xl font-bold sm:text-3xl">
                  {formatWaitTime(lookup.estimatedWaitMinutes)}
                </p>
              </div>
            </div>
          )}

          {lookup && lookup.status === 'done' && (
            <p className="text-center text-sm text-slate-500 dark:text-white/60">{lookup.message}</p>
          )}

          {!myToken && (
            <p className="text-center text-sm text-slate-500 dark:text-white/50">
              Enter your token to see your position and estimated wait time.
            </p>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-100/80 px-4 py-4 sm:px-6 dark:border-white/10 dark:bg-black/20">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-white/70">
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <span>
              <strong className="text-slate-900 dark:text-white">{state.waiting.length}</strong> patients waiting
            </span>
            <span>
              Avg. consultation:{' '}
              <strong className="text-slate-900 dark:text-white">{state.avgConsultMin} min</strong>
            </span>
          </div>
          <span>
            Updated:{' '}
            <strong className="tabular-nums text-slate-900 dark:text-white">
              {formatLastUpdated(liveTime.toISOString())}
            </strong>
          </span>
        </div>
      </footer>
    </div>
  )
}
