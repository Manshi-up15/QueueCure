import { useCallback, useEffect, useRef, useState } from 'react'
import { api, getWebSocketUrl } from '../lib/api'

const RECONNECT_MS = 3000

export function useQueueLive() {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)
  const reconnectRef = useRef(null)

  const applyState = useCallback((nextState) => {
    setState(nextState)
    setError(null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const data = await api.getQueue()
      applyState(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [applyState])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    function connect() {
      const socket = new WebSocket(getWebSocketUrl())
      socketRef.current = socket

      socket.onopen = () => setConnected(true)

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'queue:update') {
            applyState(message.data)
            setLoading(false)
          }
        } catch {
          // ignore malformed messages
        }
      }

      socket.onclose = () => {
        setConnected(false)
        reconnectRef.current = setTimeout(connect, RECONNECT_MS)
      }

      socket.onerror = () => {
        socket.close()
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectRef.current)
      socketRef.current?.close()
    }
  }, [applyState])

  const runAction = useCallback(
    async (action) => {
      try {
        const data = await action()
        applyState(data.queue ?? data)
        return data
      } catch (err) {
        setError(err.message)
        throw err
      }
    },
    [applyState],
  )

  return {
    state,
    loading,
    error,
    connected,
    registerPatient: useCallback(
      (body) => runAction(() => api.registerPatient(body)),
      [runAction],
    ),
    callNext: useCallback(() => runAction(() => api.callNext()), [runAction]),
    updateSettings: useCallback(
      (body) => runAction(() => api.updateSettings(body)),
      [runAction],
    ),
    resetQueue: useCallback(() => runAction(() => api.resetQueue()), [runAction]),
    lookupPatient: api.lookupPatient,
  }
}
