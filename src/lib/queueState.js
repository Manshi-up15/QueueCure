export const DEFAULT_CLINIC_NAME = 'Queue Cure Clinic'

export function createInitialState() {
  return {
    clinicName: DEFAULT_CLINIC_NAME,
    currentToken: 0,
    nextTokenNumber: 1,
    avgConsultationTime: 10,
    queue: [],
    lastUpdated: new Date().toISOString(),
  }
}

export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') {
    return createInitialState()
  }

  return {
    clinicName: raw.clinicName || DEFAULT_CLINIC_NAME,
    currentToken: Number(raw.currentToken) || 0,
    nextTokenNumber: Number(raw.nextTokenNumber) || 1,
    avgConsultationTime: Math.max(1, Number(raw.avgConsultationTime) || 10),
    queue: Array.isArray(raw.queue) ? raw.queue : [],
    lastUpdated: raw.lastUpdated || new Date().toISOString(),
  }
}

function stamp(state) {
  return {
    ...state,
    lastUpdated: new Date().toISOString(),
  }
}

export function addPatient(state, patientName) {
  const trimmed = patientName.trim()
  if (!trimmed) return state

  let nextTokenNumber = state.nextTokenNumber

  if (nextTokenNumber > 999) {
    nextTokenNumber = 1
  }

  const newPatient = {
    tokenNumber: nextTokenNumber,
    patientName: trimmed,
    addedAt: new Date().toISOString(),
  }

  return stamp({
    ...state,
    nextTokenNumber: nextTokenNumber >= 999 ? 1 : nextTokenNumber + 1,
    queue: [...state.queue, newPatient],
  })
}

export function callNext(state) {
  if (state.queue.length === 0) return state

  const [nextPatient, ...remaining] = state.queue

  return stamp({
    ...state,
    currentToken: nextPatient.tokenNumber,
    queue: remaining,
  })
}

export function setAvgConsultationTime(state, minutes) {
  const parsed = Number(minutes)
  const safeMinutes = Number.isFinite(parsed) && parsed > 0 ? parsed : 1

  return stamp({
    ...state,
    avgConsultationTime: safeMinutes,
  })
}

export function getEffectiveAvgTime(minutes) {
  const parsed = Number(minutes)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function getPatientStatus(state, tokenNumber) {
  if (!tokenNumber) return null

  const token = Number(tokenNumber)
  if (!Number.isFinite(token) || token <= 0) return null

  if (state.currentToken === token) {
    return 'proceed'
  }

  const index = state.queue.findIndex((p) => p.tokenNumber === token)
  if (index === -1) return 'not_found'

  if (index === 0) return 'get_ready'

  return 'waiting'
}

export function getTokensAhead(state, tokenNumber) {
  const index = state.queue.findIndex((p) => p.tokenNumber === tokenNumber)
  return index === -1 ? null : index
}

export function getEstimatedWaitMinutes(state, tokenNumber) {
  const tokensAhead = getTokensAhead(state, tokenNumber)
  if (tokensAhead === null) return null

  return tokensAhead * getEffectiveAvgTime(state.avgConsultationTime)
}
