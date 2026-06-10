import { authHeaders } from './auth.js'

async function request(path, options = {}) {
  let response

  try {
    response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch {
    throw new Error(
      'Cannot reach the API server. Run npm run dev (not just the Vite client).',
    )
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`)
  }

  return data
}

function protectedRequest(path, options = {}) {
  return request(path, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  })
}

export const api = {
  verifyPin: (pin) =>
    request('/api/auth/verify', { method: 'POST', body: JSON.stringify({ pin }) }),
  getQueue: () => request('/api/queue'),
  getAnalytics: () => protectedRequest('/api/analytics'),
  registerPatient: (body) =>
    protectedRequest('/api/patients', { method: 'POST', body: JSON.stringify(body) }),
  callNext: () => protectedRequest('/api/queue/next', { method: 'POST' }),
  updateSettings: (body) =>
    protectedRequest('/api/queue/settings', { method: 'POST', body: JSON.stringify(body) }),
  resetQueue: () => protectedRequest('/api/queue/reset', { method: 'POST' }),
  lookupPatient: (token) => request(`/api/patients/${token}`),
}

export function getWebSocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/queue/live`
}
