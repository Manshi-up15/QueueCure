const STORAGE_KEY = 'queuecure:pin'

export function getStoredPin() {
  return sessionStorage.getItem(STORAGE_KEY)
}

export function setStoredPin(pin) {
  sessionStorage.setItem(STORAGE_KEY, pin)
}

export function clearStoredPin() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function authHeaders() {
  const pin = getStoredPin()
  return pin ? { 'X-Receptionist-Pin': pin } : {}
}
