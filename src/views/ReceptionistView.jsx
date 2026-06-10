import { useState } from 'react'
import { Link } from 'react-router-dom'
import AnalyticsPanel from '../components/AnalyticsPanel'
import ThemeToggle from '../components/ThemeToggle'
import TokenSlip from '../components/TokenSlip'
import { clearStoredPin } from '../lib/auth'
import { useQueueLive } from '../hooks/useQueueLive'

const cardClass =
  'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800'
const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-clinic-500 focus:outline-none focus:ring-2 focus:ring-clinic-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-clinic-400/30'

function truncateName(name, max = 28) {
  return name.length > max ? `${name.slice(0, max)}…` : name
}

function statusLabel(status) {
  switch (status) {
    case 'waiting':
      return {
        text: 'Waiting',
        className: 'bg-clinic-100 text-clinic-700 dark:bg-clinic-900/50 dark:text-clinic-300',
      }
    case 'in_consultation':
      return {
        text: 'In consultation',
        className: 'bg-serve-100 text-serve-700 dark:bg-serve-900/50 dark:text-serve-300',
      }
    default:
      return {
        text: status,
        className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
      }
  }
}

export default function ReceptionistView() {
  const {
    state,
    loading,
    error,
    connected,
    registerPatient,
    callNext,
    updateSettings,
    resetQueue,
  } = useQueueLive()
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [avgTimeInput, setAvgTimeInput] = useState('')
  const [actionError, setActionError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [lastRegistered, setLastRegistered] = useState(null)

  if (loading || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
        Loading queue…
      </div>
    )
  }

  const handleAddPatient = async (event) => {
    event.preventDefault()
    if (!patientName.trim() || !patientPhone.trim()) return

    setSubmitting(true)
    setActionError(null)
    try {
      const result = await registerPatient({ name: patientName, phone: patientPhone })
      setLastRegistered(result.patient)
      setPatientName('')
      setPatientPhone('')
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCallNext = async () => {
    setActionError(null)
    try {
      await callNext()
    } catch (err) {
      setActionError(err.message)
    }
  }

  const handleAvgTimeBlur = async () => {
    const value = avgTimeInput === '' ? state.avgConsultMin : avgTimeInput
    setActionError(null)
    try {
      await updateSettings({ avgConsultMin: value })
      setAvgTimeInput('')
    } catch (err) {
      setActionError(err.message)
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Reset the queue for a new day? All waiting patients will be cleared.')) {
      return
    }
    setActionError(null)
    try {
      await resetQueue()
    } catch (err) {
      setActionError(err.message)
    }
  }

  const isQueueEmpty = state.waiting.length === 0

  const handleLogout = () => {
    clearStoredPin()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {lastRegistered && (
        <TokenSlip patient={lastRegistered} onClose={() => setLastRegistered(null)} />
      )}
      <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-clinic-600 dark:text-clinic-400">
              Queue Cure &apos;26
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Receptionist View</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {connected ? 'Live sync active' : 'Reconnecting…'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="rounded-xl bg-serve-500/10 px-5 py-3 text-center dark:bg-serve-500/20">
              <p className="text-xs font-medium uppercase tracking-wider text-serve-700 dark:text-serve-400">
                Now Serving
              </p>
              <p className="text-4xl font-bold tabular-nums text-serve-700 dark:text-serve-400">
                {state.currentToken > 0 ? state.currentToken : '—'}
              </p>
            </div>
            <ThemeToggle />
            <Link
              to="/patient"
              className="rounded-lg border border-clinic-200 bg-clinic-50 px-4 py-2 text-sm font-medium text-clinic-700 transition hover:bg-clinic-100 focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:ring-offset-2 dark:border-clinic-800 dark:bg-clinic-950 dark:text-clinic-300 dark:hover:bg-clinic-900 dark:focus:ring-offset-slate-900"
            >
              Open Patient View →
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      {(error || actionError) && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {actionError || error}
        </div>
      )}

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-2 lg:px-6">
        <section className="space-y-6">
          <div className={cardClass}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Register Patient</h2>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label htmlFor="patient-name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Patient name
                </label>
                <input
                  id="patient-name"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="patient-phone" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone number
                </label>
                <input
                  id="patient-phone"
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className={inputClass}
                  autoComplete="tel"
                />
              </div>
              <button
                type="submit"
                disabled={!patientName.trim() || !patientPhone.trim() || submitting}
                className="w-full rounded-lg bg-clinic-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-clinic-700 focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-900"
              >
                {submitting ? 'Registering…' : 'Register Patient'}
              </button>
            </form>
          </div>

          <div className={cardClass}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Consultation Time</h2>
            <label htmlFor="avg-time" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Average consultation (minutes)
            </label>
            <input
              id="avg-time"
              type="number"
              min="1"
              max="120"
              value={avgTimeInput !== '' ? avgTimeInput : state.avgConsultMin}
              onChange={(e) => setAvgTimeInput(e.target.value)}
              onBlur={handleAvgTimeBlur}
              className={inputClass}
            />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Used to calculate estimated wait times for patients.
            </p>
          </div>

          <AnalyticsPanel key={state.lastUpdated} />

          <div className={cardClass}>
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">End of Day</h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Clear the queue and start fresh token numbering for tomorrow.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60 dark:focus:ring-offset-slate-900"
            >
              Reset Queue
            </button>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Waiting Queue</h2>
              <span className="rounded-full bg-clinic-100 px-3 py-1 text-sm font-semibold text-clinic-700 dark:bg-clinic-900/50 dark:text-clinic-300">
                {state.waiting.length} waiting
              </span>
            </div>
            <button
              type="button"
              onClick={handleCallNext}
              disabled={isQueueEmpty}
              className="rounded-lg bg-serve-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-serve-700 focus:outline-none focus:ring-2 focus:ring-serve-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-900"
            >
              Call Next
            </button>
          </div>

          {state.inConsultation && (
            <div className="mb-4 rounded-xl border border-serve-200 bg-serve-50 px-4 py-3 dark:border-serve-800 dark:bg-serve-950/40">
              <p className="text-xs font-medium uppercase tracking-wide text-serve-700 dark:text-serve-400">
                In consultation
              </p>
              <p className="font-semibold text-slate-900 dark:text-white">
                #{state.inConsultation.tokenNumber} — {state.inConsultation.name}
              </p>
            </div>
          )}

          {isQueueEmpty ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-600">
              <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No patients in queue</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Register a patient to get started.
              </p>
            </div>
          ) : (
            <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
              {state.waiting.map((patient, index) => {
                const badge = statusLabel(patient.status)
                return (
                  <li
                    key={patient.id}
                    className="flex items-center gap-4 rounded-xl border border-clinic-100 bg-clinic-50 px-4 py-3 dark:border-clinic-900 dark:bg-clinic-950/30"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-clinic-600 text-lg font-bold text-white">
                      {patient.tokenNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-white" title={patient.name}>
                        {truncateName(patient.name)}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Position {index + 1} · {patient.phone}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                      {badge.text}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
