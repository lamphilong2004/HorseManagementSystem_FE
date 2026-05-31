import { http, HttpResponse } from 'msw'
import type { Role, Session } from '../types'
import { demoUsers, horses, invites, predictions, races, tournaments } from './data'

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; role?: Role }
    const role = body.role ?? 'SPECTATOR'

    const session: Session = {
      token: 'dev-token',
      user: demoUsers[role],
    }

    return HttpResponse.json(session)
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as { name?: string; email?: string; role?: Role }
    const role = body.role ?? 'SPECTATOR'

    const session: Session = {
      token: 'dev-token',
      user: {
        ...demoUsers[role],
        name: body.name ?? demoUsers[role].name,
        email: body.email ?? demoUsers[role].email,
      },
    }

    return HttpResponse.json(session)
  }),

  http.post('/api/auth/change-password', async () => {
    return HttpResponse.json({
      message: 'Password changed successfully',
    })
  }),

  http.get('/api/auth/me', () => {
    try {
      const rawSession = localStorage.getItem('hr_session')
      const parsed = rawSession ? JSON.parse(rawSession) : null
      const role = parsed?.user?.role || 'SPECTATOR'

      return HttpResponse.json({
        userId: demoUsers[role as Role].id,
        fullName: demoUsers[role as Role].name,
        email: demoUsers[role as Role].email,
        role,
      })
    } catch {
      const fallback = demoUsers.SPECTATOR
      return HttpResponse.json({
        userId: fallback.id,
        fullName: fallback.name,
        email: fallback.email,
        role: fallback.role,
      })
    }
  }),

  http.get('/api/tournaments', () => HttpResponse.json(tournaments)),

  http.get('/api/tournaments/:id', ({ params }) => {
    const found = tournaments.find((t) => t.id === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(found)
  }),

  http.get('/api/races', () => HttpResponse.json(races)),

  http.get('/api/races/:id', ({ params }) => {
    const found = races.find((r) => r.id === params.id)
    if (!found) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(found)
  }),

  http.get('/api/horses', () => HttpResponse.json(horses)),
  http.get('/api/invites', () => HttpResponse.json(invites)),
  http.get('/api/predictions', () => HttpResponse.json(predictions)),

  http.get('/api/admin/users', () => {
    return HttpResponse.json(Object.values(demoUsers))
  }),

  http.get('/api/referee/races', () => HttpResponse.json(races)),
]
