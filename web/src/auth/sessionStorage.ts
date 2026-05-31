import type { Session } from '../types'

const KEY = 'hr_session'

export function loadSession(): Session | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function updateSessionToken(token: string) {
  const session = loadSession()
  if (!session) return
  saveSession({
    ...session,
    token,
  })
}

export function clearSession() {
  localStorage.removeItem(KEY)
}
