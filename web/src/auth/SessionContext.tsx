import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Role, Session } from '../types'
import { clearSession, loadSession, saveSession } from './sessionStorage'
import * as api from '../api'

type SessionContextValue = {
  session: Session | null
  login: (params: { email: string; password: string; role: Role }) => Promise<void>
  register: (params: { name: string; email: string; password: string; role: Role }) => Promise<void>
  logout: () => void
  balance: number
  updateBalance: (newBalance: number) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider(props: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('hr_user_balance')
    return saved ? Number(saved) : 10000000 // 10 million VND default
  })

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance)
    localStorage.setItem('hr_user_balance', String(newBalance))
  }

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      login: async (params) => {
        const next = await api.login(params)
        saveSession(next)
        setSession(next)
      },
      register: async (params) => {
        const next = await api.register(params)
        saveSession(next)
        setSession(next)
      },
      logout: () => {
        clearSession()
        setSession(null)
      },
      balance,
      updateBalance,
    }),
    [session, balance],
  )

  return <SessionContext.Provider value={value}>{props.children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
