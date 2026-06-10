import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  addPatient,
  callNext,
  createInitialState,
  normalizeState,
  setAvgConsultationTime,
} from '../lib/queueState'
import { isUsingFallbackStorage, readQueueState, writeQueueState } from '../lib/storage'

const POLL_INTERVAL_MS = 2000

function stateReducer(state, action) {
  switch (action.type) {
    case 'SYNC':
      return normalizeState(action.payload)
    case 'ADD_PATIENT':
      return addPatient(state, action.payload)
    case 'CALL_NEXT':
      return callNext(state)
    case 'SET_AVG_TIME':
      return setAvgConsultationTime(state, action.payload)
    default:
      return state
  }
}

export function useQueueState({ writable = false } = {}) {
  const [state, dispatch] = useReducer(stateReducer, null, () => createInitialState())
  const [loading, setLoading] = useState(true)
  const [storageWarning, setStorageWarning] = useState(false)
  const stateRef = useRef(state)

  stateRef.current = state

  const persistState = useCallback(async (nextState) => {
    try {
      await writeQueueState(nextState)
      setStorageWarning(false)
    } catch {
      setStorageWarning(true)
    }
  }, [])

  const refreshFromStorage = useCallback(async () => {
    const stored = await readQueueState()
    if (stored) {
      dispatch({ type: 'SYNC', payload: stored })
    } else if (writable && !stored) {
      const initial = createInitialState()
      dispatch({ type: 'SYNC', payload: initial })
      await persistState(initial)
    }
    setLoading(false)
  }, [writable, persistState])

  useEffect(() => {
    refreshFromStorage()
  }, [refreshFromStorage])

  useEffect(() => {
    const intervalId = setInterval(refreshFromStorage, POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [refreshFromStorage])

  useEffect(() => {
    if (!isUsingFallbackStorage()) return undefined

    const onStorage = (event) => {
      if (event.key === 'queuecure:state') {
        refreshFromStorage()
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refreshFromStorage])

  const commit = useCallback(
    async (action) => {
      const nextState = stateReducer(stateRef.current, action)
      dispatch({ type: 'SYNC', payload: nextState })
      await persistState(nextState)
    },
    [persistState],
  )

  const actions = {
    addPatient: useCallback(
      (name) => commit({ type: 'ADD_PATIENT', payload: name }),
      [commit],
    ),
    callNext: useCallback(() => commit({ type: 'CALL_NEXT' }), [commit]),
    setAvgConsultationTime: useCallback(
      (minutes) => commit({ type: 'SET_AVG_TIME', payload: minutes }),
      [commit],
    ),
  }

  return {
    state,
    loading,
    storageWarning,
    ...actions,
  }
}
