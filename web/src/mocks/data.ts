import type { Horse, Invite, Prediction, Race, Role, Tournament, User } from '../types'

export const demoUsers: Record<Role, User> = {
  ADMIN: { id: 'u_admin', name: 'Admin', role: 'ADMIN', email: 'admin@example.com', status: 'ACTIVE' },
  OWNER: { id: 'u_owner', name: 'Horse Owner', role: 'OWNER', email: 'owner@example.com', status: 'ACTIVE' },
  JOCKEY: { id: 'u_jockey', name: 'Jockey', role: 'JOCKEY', email: 'jockey@example.com', status: 'ACTIVE' },
  REFEREE: { id: 'u_ref', name: 'Referee', role: 'REFEREE', email: 'referee@example.com', status: 'ACTIVE' },
  SPECTATOR: { id: 'u_spec', name: 'Spectator', role: 'SPECTATOR', email: 'spec@example.com', status: 'ACTIVE' },
}

export const tournaments: Tournament[] = [
  { id: 't1', name: 'Spring Derby', venue: 'Hanoi', location: 'Hanoi', startDate: '2026-06-01', endDate: '2026-06-10', prizePool: 50000000, maxHorses: 12, status: 'PUBLISHED' },
  { id: 't2', name: 'Summer Cup', venue: 'Da Nang', location: 'Da Nang', startDate: '2026-07-05', endDate: '2026-07-12', prizePool: 100000000, maxHorses: 15, status: 'DRAFT' },
]

export const races: Race[] = [
  { id: 'r1', tournamentId: 't1', name: 'Race 1', scheduledAt: '2026-06-02T09:00:00Z', status: 'SCHEDULED', distance: 1000, maxHorses: 8, prizeFirst: 10000000, prizeSecond: 5000000, prizeThird: 2000000 },
  { id: 'r2', tournamentId: 't1', name: 'Race 2', scheduledAt: '2026-06-03T09:00:00Z', status: 'SCHEDULED', distance: 1200, maxHorses: 8, prizeFirst: 10000000, prizeSecond: 5000000, prizeThird: 2000000 },
  { id: 'r3', tournamentId: 't2', name: 'Final', scheduledAt: '2026-07-12T10:00:00Z', status: 'SCHEDULED', distance: 1500, maxHorses: 10, prizeFirst: 20000000, prizeSecond: 10000000, prizeThird: 5000000 },
]

export const horses: Horse[] = [
  { id: 'h1', name: 'Thunder', ownerId: 'u_owner', breed: 'Thoroughbred', age: 5, weight: 450, color: 'Brown', gender: 'MALE', origin: 'Vietnam', healthCertUrl: 'http://example.com/cert1', status: 'APPROVED' },
  { id: 'h2', name: 'Blaze', ownerId: 'u_owner', breed: 'Quarter Horse', age: 4, weight: 480, color: 'Black', gender: 'FEMALE', origin: 'Vietnam', healthCertUrl: 'http://example.com/cert2', status: 'APPROVED' },
]

export const invites: Invite[] = [
  { id: 'i1', horseId: 'h1', horseName: 'Thunder', status: 'PENDING' },
  { id: 'i2', horseId: 'h2', horseName: 'Blaze', status: 'ACCEPTED' },
]

export const predictions: Prediction[] = [
  { id: 'p1', raceId: 'r1', spectatorId: 'u_spec', horseId: 'h1', pickedHorseName: 'Thunder', status: 'PENDING', betAmount: 500000, predictedPosition: 1, prizeAmount: 900000 },
  { id: 'p2', raceId: 'r2', spectatorId: 'u_spec', horseId: 'h2', pickedHorseName: 'Blaze', status: 'LOST', betAmount: 1000000, predictedPosition: 1, prizeAmount: 0 },
]
