import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { WebSocketServer } from 'ws'
import { getDailyAnalytics } from './analytics.js'
import { requireReceptionist, verifyPin } from './auth.js'
import {
  callNext,
  getPatientLookup,
  getQueueState,
  registerPatient,
  resetQueue,
  updateSettings,
} from './queueService.js'

const PORT = Number(process.env.PORT) || 3001
const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/queue/live' })

app.use(cors())
app.use(express.json())

function broadcastQueueState() {
  const state = getQueueState()
  const payload = JSON.stringify({ type: 'queue:update', data: state })

  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(payload)
    }
  }

  return state
}

function sendState(res) {
  res.json(getQueueState())
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/verify', (req, res) => {
  const { pin } = req.body || {}
  if (!verifyPin(pin)) {
    res.status(401).json({ error: 'Invalid receptionist PIN' })
    return
  }
  res.json({ ok: true })
})

app.get('/api/queue', (_req, res) => {
  sendState(res)
})

app.get('/api/analytics', requireReceptionist, (_req, res) => {
  res.json(getDailyAnalytics())
})

app.post('/api/patients', requireReceptionist, (req, res) => {
  try {
    const result = registerPatient(req.body)
    broadcastQueueState()
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.get('/api/patients/:token', (req, res) => {
  try {
    const lookup = getPatientLookup(req.params.token)
    if (!lookup) {
      res.status(404).json({ error: 'Token not found' })
      return
    }
    res.json(lookup)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/queue/next', requireReceptionist, (_req, res) => {
  try {
    const state = callNext()
    broadcastQueueState()
    res.json(state)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/queue/settings', requireReceptionist, (req, res) => {
  try {
    const state = updateSettings(req.body)
    broadcastQueueState()
    res.json(state)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/queue/reset', requireReceptionist, (_req, res) => {
  try {
    const state = resetQueue()
    broadcastQueueState()
    res.json(state)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '..', 'dist')

if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get(/^(?!\/api|\/queue).*/, (_req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'queue:update', data: getQueueState() }))

  socket.on('error', () => {
    socket.terminate()
  })
})

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Queue Cure API listening on http://localhost:${PORT}`)
    console.log(`WebSocket live at ws://localhost:${PORT}/queue/live`)
  })
}

export { app, server, broadcastQueueState, wss }
