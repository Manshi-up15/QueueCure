import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueueState } from '../hooks/useQueueState'
import {
  getEstimatedWaitMinutes,
  getPatientStatus,
  getTokensAhead,
} from '../lib/queueState'

function formatWaitTime(minutes) {
  if (minutes === null) return '—'
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
  const { state, loading } = useQueueState({ writable: false })
  const [myToken, setMyToken] = useState('')
  const [pulse, setPulse] = useState(false)
  const prevTokenRef = useRef(state.currentToken)

  useEffect(() => {
    if (state.currentToken !== prevTokenRef.current && state.currentToken > 0) {
      setPulse(true)
      const timer = setTimeout(() => setPulse(false), 1500)
      prevTokenRef.current = state.currentToken
      return () => clearTimeout(timer)
    }
    prevTokenRef.current = state.currentToken
    return undefined
  }, [state.currentToken])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        Loading display…
      </div>
    )
  }

  const tokenNum = myToken ? Number(myToken) : null
  const status = tokenNum ? getPatientStatus(state, tokenNum) : null
  const tokensAhead = tokenNum ? getTokensAhead(state, tokenNum) : null
  const etaMinutes = tokenNum ? getEstimatedWaitMinutes(state, tokenNum) : null

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-clinic-400">
            Queue Cure &apos;26
          </p>
          <h1 className="text-xl font-semibold text-white/90">{state.clinicName}</h1>
        </div>
        <Link
          to="/"
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-clinic-400"
        >
          ← Receptionist
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <p className="mb-4 text-lg font-medium uppercase tracking-[0.3em] text-clinic-400 sm:text-xl">
          Now Serving
        </p>
        <div
          className={`mb-12 flex h-40 w-40 items-center justify-center rounded-3xl bg-serve-600 sm:h-52 sm:w-52 ${
            pulse ? 'animate-token-pulse' : ''
          }`}
        >
          <span className="text-[6rem] font-bold leading-none tabular-nums sm:min-h-[96px] sm:text-[8rem]">
            {state.currentToken > 0 ? state.currentToken : '—'}
          </span>
        </div>

        <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-center text-lg font-semibold text-white/90">
            Check Your Wait Time
          </h2>
          <label htmlFor="my-token" className="mb-2 block text-sm text-white/70">
            Enter your token number (optional)
          </label>
          <input
            id="my-token"
            type="number"
            min="1"
            value={myToken}
            onChange={(e) => setMyToken(e.target.value)}
            placeholder="e.g. 12"
            className="mb-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-2xl font-bold tabular-nums text-white placeholder:text-white/30 focus:border-clinic-400 focus:outline-none focus:ring-2 focus:ring-clinic-400/30"
          />

          {tokenNum && status === 'proceed' && (
            <div className="rounded-xl bg-serve-600/30 border border-serve-500 px-4 py-4 text-center">
              <p className="text-xl font-bold text-serve-400">Please Proceed</p>
              <p className="mt-1 text-white/80">Your token is being called now.</p>
            </div>
          )}

          {tokenNum && status === 'get_ready' && (
            <div className="rounded-xl border border-amber-400/50 bg-amber-500/20 px-4 py-4 text-center">
              <p className="text-xl font-bold text-amber-300">Get Ready</p>
              <p className="mt-1 text-white/80">You are next in line.</p>
            </div>
          )}

          {tokenNum && status === 'waiting' && (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="text-sm text-white/60">Tokens ahead</p>
                <p className="text-3xl font-bold tabular-nums">{tokensAhead}</p>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="text-sm text-white/60">Estimated wait</p>
                <p className="text-3xl font-bold">{formatWaitTime(etaMinutes)}</p>
              </div>
            </div>
          )}

          {tokenNum && status === 'not_found' && (
            <p className="text-center text-sm text-white/60">
              Token not found in the current queue. You may have already been called.
            </p>
          )}

          {!tokenNum && (
            <p className="text-center text-sm text-white/50">
              Enter your token to see your position and estimated wait time.
            </p>
          )}
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/20 px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 text-sm text-white/70">
          <div className="flex flex-wrap gap-6">
            <span>
              <strong className="text-white">{state.queue.length}</strong> patients waiting
            </span>
            <span>
              Avg. consultation:{' '}
              <strong className="text-white">{state.avgConsultationTime} min</strong>
            </span>
          </div>
          <span>
            Last updated:{' '}
            <strong className="text-white">{formatLastUpdated(state.lastUpdated)}</strong>
          </span>
        </div>
      </footer>
    </div>
  )
}
