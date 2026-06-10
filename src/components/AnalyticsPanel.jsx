import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function AnalyticsPanel() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .getAnalytics()
      .then(setStats)
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading analytics…</p>
      </div>
    )
  }

  const maxCount = Math.max(...stats.hourlyVolume.map((h) => h.count), 1)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Today&apos;s Analytics</h2>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Patients seen" value={stats.totalPatientsSeen} />
        <Stat label="Registered" value={stats.totalRegistered} />
        <Stat label="Avg wait" value={`${stats.avgWaitMinutes} min`} />
        <Stat label="Peak hour" value={stats.peakHour || '—'} />
      </div>

      {stats.hourlyVolume.length > 0 ? (
        <div>
          <p className="mb-3 text-sm font-medium text-slate-700">Registrations by hour</p>
          <div className="flex items-end gap-1 h-32">
            {stats.hourlyVolume.map((bucket) => (
              <div key={bucket.hour} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-clinic-500 transition-all"
                  style={{ height: `${(bucket.count / maxCount) * 100}%`, minHeight: '4px' }}
                  title={`${bucket.label}: ${bucket.count}`}
                />
                <span className="text-[10px] text-slate-500">{bucket.hour}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No registration data yet today.</p>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
