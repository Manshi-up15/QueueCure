const STORAGE_KEY = 'queuecure:state'

function hasPlatformStorage() {
  return typeof window !== 'undefined' && window.storage?.get && window.storage?.set
}

export async function readQueueState() {
  try {
    if (hasPlatformStorage()) {
      const result = await window.storage.get(STORAGE_KEY, { shared: true })
      if (result?.value) {
        return JSON.parse(result.value)
      }
      return null
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function writeQueueState(state) {
  const payload = JSON.stringify(state)

  if (hasPlatformStorage()) {
    await window.storage.set(STORAGE_KEY, payload, { shared: true })
    return
  }

  localStorage.setItem(STORAGE_KEY, payload)
}

export function isUsingFallbackStorage() {
  return !hasPlatformStorage()
}
