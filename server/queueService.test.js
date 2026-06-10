import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import db from './db.js'
import {
  callNext,
  getPatientLookup,
  getQueueState,
  registerPatient,
  resetQueue,
  updateSettings,
} from './queueService.js'

function clearTables() {
  db.exec('DELETE FROM patients')
  db.exec('DELETE FROM queue_sessions')
}

describe('queueService', () => {
  beforeEach(() => {
    clearTables()
  })

  afterEach(() => {
    clearTables()
  })

  it('registers a patient with an incrementing token', () => {
    const first = registerPatient({ name: 'Ramesh', phone: '9876543210' })
    const second = registerPatient({ name: 'Priya', phone: '9123456789' })

    expect(first.patient.tokenNumber).toBe(1)
    expect(second.patient.tokenNumber).toBe(2)
    expect(getQueueState().waiting).toHaveLength(2)
  })

  it('advances the queue on call next', () => {
    registerPatient({ name: 'Ramesh', phone: '9876543210' })
    registerPatient({ name: 'Priya', phone: '9123456789' })

    const state = callNext()

    expect(state.currentToken).toBe(1)
    expect(state.inConsultation?.tokenNumber).toBe(1)
    expect(state.waiting).toHaveLength(1)
    expect(state.waiting[0].tokenNumber).toBe(2)
  })

  it('calculates patient lookup ETA', () => {
    registerPatient({ name: 'A', phone: '111' })
    registerPatient({ name: 'B', phone: '222' })
    registerPatient({ name: 'C', phone: '333' })
    updateSettings({ avgConsultMin: 10 })

    const lookup = getPatientLookup(3)

    expect(lookup.tokensAhead).toBe(2)
    expect(lookup.estimatedWaitMinutes).toBe(20)
  })

  it('resets the queue for a new session', () => {
    registerPatient({ name: 'Ramesh', phone: '9876543210' })
    callNext()

    const state = resetQueue()

    expect(state.currentToken).toBe(0)
    expect(state.waiting).toHaveLength(0)
    expect(state.nextToken).toBe(1)
  })
})
