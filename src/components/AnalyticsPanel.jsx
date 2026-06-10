import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const panelClass =
  'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800'

export default function AnalyticsPanel({ refreshAt }) {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    api
      .getAnalytics()
      .then((data) => {
        if (!cancelled) {
          setStats(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [refreshAt])

  if (error) {
    return (
      <div className={panelClass}>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={panelClass}>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading analytics…</p>
      </div>
    )
  }

  const maxCount = Math.max(...stats.hourlyVolume.map((h) => h.count), 1)

  return (
    <div className={panelClass}>
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Today&apos;s Analytics</h2>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Patients seen" value={stats.totalPatientsSeen} />
        <Stat label="Registered" value={stats.totalRegistered} />
        <Stat label="Avg wait" value={`${stats.avgWaitMinutes} min`} />
        <Stat label="Peak hour" value={stats.peakHour || '—'} />
      </div>

      {stats.hourlyVolume.length > 0 ? (
        <div>
          <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            Registrations by hour
          </p>
          <div className="flex h-36 gap-2">
            {stats.hourlyVolume.map((bucket) => {
              const barHeight = Math.round((bucket.count / maxCount) * 100)
              return (
                <div
                  key={bucket.hour}
                  className="flex h-full min-w-0 flex-1 flex-col items-center"
                >
                  <div className="flex w-full flex-1 flex-col items-center justify-end">
                    <span className="mb-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      {bucket.count}
                    </span>
                    <div
                      className="w-full rounded-t bg-clinic-500 transition-all duration-300 dark:bg-clinic-600"
                      style={{ height: `${Math.max(barHeight, 12)}%` }}
                      title={`${bucket.label}: ${bucket.count} patient(s)`}
                    />
                  </div>
                  <span className="mt-2 shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                    {bucket.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">No registration data yet today.</p>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3 text-center dark:bg-slate-900/60">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}
