import { randomUUID } from 'crypto'
import db from './db.js'

const PATIENT_STATUSES = ['waiting', 'in_consultation', 'done', 'skipped']

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function mapPatient(row) {
  if (!row) return null
  return {
    id: row.id,
    tokenNumber: row.token_number,
    name: row.name,
    phone: row.phone,
    status: row.status,
    registeredAt: row.registered_at,
    calledAt: row.called_at,
  }
}

function mapSession(row) {
  if (!row) return null
  return {
    id: row.id,
    currentToken: row.current_token,
    nextToken: row.next_token,
    avgConsultMin: row.avg_consult_min,
    date: row.date,
    isActive: Boolean(row.is_active),
  }
}

export function getActiveSession() {
  const row = db
    .prepare(
      `SELECT * FROM queue_sessions
       WHERE is_active = 1 AND date = ?
       ORDER BY rowid DESC
       LIMIT 1`,
    )
    .get(todayDate())

  if (row) return mapSession(row)

  const id = randomUUID()
  const date = todayDate()

  db.prepare(
    `INSERT INTO queue_sessions (id, current_token, next_token, avg_consult_min, date, is_active)
     VALUES (?, 0, 1, 10, ?, 1)`,
  ).run(id, date)

  return mapSession(
    db.prepare('SELECT * FROM queue_sessions WHERE id = ?').get(id),
  )
}

export function getQueueState() {
  const session = getActiveSession()

  const patients = db
    .prepare(
      `SELECT * FROM patients
       WHERE session_id = ?
         AND status IN ('waiting', 'in_consultation')
       ORDER BY token_number ASC`,
    )
    .all(session.id)
    .map(mapPatient)

  const waiting = patients.filter((p) => p.status === 'waiting')
  const inConsultation = patients.find((p) => p.status === 'in_consultation') || null

  return {
    sessionId: session.id,
    currentToken: session.currentToken,
    nextToken: session.nextToken,
    avgConsultMin: Math.max(1, session.avgConsultMin),
    date: session.date,
    isActive: session.isActive,
    waiting,
    inConsultation,
    lastUpdated: new Date().toISOString(),
  }
}

export function registerPatient(input = {}) {
  const { name, phone } = input
  const trimmedName = name?.trim()
  const trimmedPhone = phone?.trim()

  if (!trimmedName) {
    throw new Error('Patient name is required')
  }
  if (!trimmedPhone) {
    throw new Error('Phone number is required')
  }

  const session = getActiveSession()
  let tokenNumber = session.nextToken

  if (tokenNumber > 999) {
    tokenNumber = 1
  }

  const id = randomUUID()
  const registeredAt = new Date().toISOString()
  const nextToken = tokenNumber >= 999 ? 1 : tokenNumber + 1

  const insert = db.transaction(() => {
    db.prepare(
      `INSERT INTO patients (id, session_id, token_number, name, phone, status, registered_at)
       VALUES (?, ?, ?, ?, ?, 'waiting', ?)`,
    ).run(id, session.id, tokenNumber, trimmedName, trimmedPhone, registeredAt)

    db.prepare('UPDATE queue_sessions SET next_token = ? WHERE id = ?').run(
      nextToken,
      session.id,
    )
  })

  insert()

  return {
    patient: mapPatient(
      db.prepare('SELECT * FROM patients WHERE id = ?').get(id),
    ),
    queue: getQueueState(),
  }
}

export function callNext() {
  const session = getActiveSession()

  const waiting = db
    .prepare(
      `SELECT * FROM patients
       WHERE session_id = ? AND status = 'waiting'
       ORDER BY token_number ASC
       LIMIT 1`,
    )
    .get(session.id)

  if (!waiting) {
    throw new Error('No patients in queue')
  }

  const advance = db.transaction(() => {
    db.prepare(
      `UPDATE patients SET status = 'done'
       WHERE session_id = ? AND status = 'in_consultation'`,
    ).run(session.id)

    const calledAt = new Date().toISOString()

    db.prepare(
      `UPDATE patients
       SET status = 'in_consultation', called_at = ?
       WHERE id = ?`,
    ).run(calledAt, waiting.id)

    db.prepare('UPDATE queue_sessions SET current_token = ? WHERE id = ?').run(
      waiting.token_number,
      session.id,
    )
  })

  advance()

  return getQueueState()
}

export function updateSettings({ avgConsultMin }) {
  const parsed = Number(avgConsultMin)
  const safeMinutes = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  const session = getActiveSession()

  db.prepare('UPDATE queue_sessions SET avg_consult_min = ? WHERE id = ?').run(
    safeMinutes,
    session.id,
  )

  return getQueueState()
}

export function resetQueue() {
  const session = getActiveSession()

  const reset = db.transaction(() => {
    db.prepare(
      `UPDATE patients SET status = 'done'
       WHERE session_id = ? AND status IN ('waiting', 'in_consultation')`,
    ).run(session.id)

    db.prepare('UPDATE queue_sessions SET is_active = 0 WHERE id = ?').run(session.id)

    const id = randomUUID()
    const date = todayDate()

    db.prepare(
      `INSERT INTO queue_sessions (id, current_token, next_token, avg_consult_min, date, is_active)
       VALUES (?, 0, 1, ?, ?, 1)`,
    ).run(id, session.avgConsultMin, date)
  })

  reset()

  return getQueueState()
}

export function getPatientLookup(tokenNumber) {
  const token = Number(tokenNumber)
  if (!Number.isFinite(token) || token <= 0) {
    throw new Error('Invalid token number')
  }

  const session = getActiveSession()
  const patient = db
    .prepare(
      `SELECT * FROM patients
       WHERE session_id = ? AND token_number = ?`,
    )
    .get(session.id, token)

  if (!patient) {
    return null
  }

  const mapped = mapPatient(patient)
  const queue = getQueueState()

  if (mapped.status === 'in_consultation') {
    return {
      ...mapped,
      tokensAhead: 0,
      estimatedWaitMinutes: 0,
      message: 'Please proceed — your token is being called now.',
    }
  }

  if (mapped.status === 'waiting') {
    const index = queue.waiting.findIndex((p) => p.tokenNumber === token)
    const tokensAhead = index === -1 ? 0 : index
    const estimatedWaitMinutes = tokensAhead * queue.avgConsultMin

    return {
      ...mapped,
      tokensAhead,
      estimatedWaitMinutes,
      message:
        tokensAhead === 0
          ? 'Get ready — you are next in line.'
          : `${tokensAhead} token(s) ahead.`,
    }
  }

  return {
    ...mapped,
    tokensAhead: null,
    estimatedWaitMinutes: null,
    message: 'This token has already been served.',
  }
}

export { PATIENT_STATUSES }
