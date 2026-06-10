const RECEPTIONIST_PIN = process.env.RECEPTIONIST_PIN || '1234'

export function verifyPin(pin) {
  return pin === RECEPTIONIST_PIN
}

export function requireReceptionist(req, res, next) {
  const pin = req.headers['x-receptionist-pin']

  if (!pin || !verifyPin(pin)) {
    res.status(401).json({ error: 'Invalid receptionist PIN' })
    return
  }

  next()
}
