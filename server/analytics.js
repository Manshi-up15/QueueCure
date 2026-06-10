import db from './db.js'
import { getActiveSession } from './queueService.js'

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

export function getDailyAnalytics() {
  const session = getActiveSession()
  const date = todayDate()

  const donePatients = db
    .prepare(
      `SELECT registered_at, called_at FROM patients
       WHERE session_id = ? AND status = 'done' AND called_at IS NOT NULL`,
    )
    .all(session.id)

  const totalRegistered = db
    .prepare(`SELECT COUNT(*) as count FROM patients WHERE session_id = ?`)
    .get(session.id).count

  const waitTimes = donePatients
    .map((p) => {
      const registered = new Date(p.registered_at).getTime()
      const called = new Date(p.called_at).getTime()
      return Math.max(0, Math.round((called - registered) / 60000))
    })
    .filter((m) => Number.isFinite(m))

  const avgWaitMinutes =
    waitTimes.length > 0
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0

  const hourBuckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${hour.toString().padStart(2, '0')}:00`,
    count: 0,
  }))

  const registeredPatients = db
    .prepare(`SELECT registered_at FROM patients WHERE session_id = ?`)
    .all(session.id)

  for (const row of registeredPatients) {
    const hour = new Date(row.registered_at).getHours()
    if (hour >= 0 && hour < 24) {
      hourBuckets[hour].count += 1
    }
  }

  const peakHour = hourBuckets.reduce(
    (best, bucket) => (bucket.count > best.count ? bucket : best),
    hourBuckets[0],
  )

  return {
    date,
    totalPatientsSeen: donePatients.length,
    totalRegistered,
    currentlyWaiting: db
      .prepare(`SELECT COUNT(*) as count FROM patients WHERE session_id = ? AND status = 'waiting'`)
      .get(session.id).count,
    avgWaitMinutes,
    peakHour: peakHour.count > 0 ? peakHour.label : null,
    peakHourCount: peakHour.count,
    hourlyVolume: hourBuckets.filter((b) => b.count > 0),
  }
}
