import type { Invite, Prediction, User, Role } from '../types'

// Legacy Horse/Tournament/Race types for mock data (uses 'id' instead of '_id')
type MockTournament = { id: string; name: string; location: string; startDate: string; endDate: string }
type MockRace = { id: string; tournamentId: string; name: string; scheduledAt: string; status: string }
type MockHorse = { id: string; name: string; ownerId: string }

export const demoUsers: Record<Role, User> = {
  ADMIN: { id: 'u_admin', name: 'Admin', role: 'ADMIN', email: 'admin@example.com' },
  OWNER: { id: 'u_owner', name: 'Horse Owner', role: 'OWNER', email: 'owner@example.com' },
  JOCKEY: { id: 'u_jockey', name: 'Jockey', role: 'JOCKEY', email: 'jockey@example.com' },
  REFEREE: { id: 'u_ref', name: 'Referee', role: 'REFEREE', email: 'referee@example.com' },
  SPECTATOR: { id: 'u_spec', name: 'Spectator', role: 'SPECTATOR', email: 'spec@example.com' },
}

export const tournaments: MockTournament[] = [
  { id: 't1', name: 'Spring Derby', location: 'Hanoi', startDate: '2026-06-01', endDate: '2026-06-10' },
  { id: 't2', name: 'Summer Cup', location: 'Da Nang', startDate: '2026-07-05', endDate: '2026-07-12' },
]

export const races: MockRace[] = [
  { id: 'r1', tournamentId: 't1', name: 'Race 1', scheduledAt: '2026-06-02T09:00:00Z', status: 'SCHEDULED' },
  { id: 'r2', tournamentId: 't1', name: 'Race 2', scheduledAt: '2026-06-03T09:00:00Z', status: 'SCHEDULED' },
  { id: 'r3', tournamentId: 't2', name: 'Final', scheduledAt: '2026-07-12T10:00:00Z', status: 'SCHEDULED' },
]

export const horses: MockHorse[] = [
  { id: 'h1', name: 'Thunder', ownerId: 'u_owner' },
  { id: 'h2', name: 'Blaze', ownerId: 'u_owner' },
]

export const invites: Invite[] = [
  { id: 'i1', horseId: 'h1', horseName: 'Thunder', status: 'PENDING' },
  { id: 'i2', horseId: 'h2', horseName: 'Blaze', status: 'ACCEPTED' },
]

export const predictions: Prediction[] = [
  { id: 'p1', raceId: 'r1', pickedHorseName: 'Thunder', status: 'PENDING' },
  { id: 'p2', raceId: 'r2', pickedHorseName: 'Blaze', status: 'LOST' },
]
