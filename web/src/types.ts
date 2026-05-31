export type Role = 'ADMIN' | 'OWNER' | 'JOCKEY' | 'REFEREE' | 'SPECTATOR'

export type User = {
  id: string
  name: string
  role: Role
  email?: string
  status?: 'ACTIVE' | 'INACTIVE'
  phone?: string
  createdAt?: string
}

export type Session = {
  token: string
  user: User
}

export type Tournament = {
  id: string
  name: string
  description?: string
  venue: string
  location?: string // Legacy alias
  startDate: string
  endDate: string
  prizePool?: number
  currency?: string
  maxHorses?: number
  status?: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
}

export type Race = {
  id: string
  tournamentId: any
  name: string
  distance: number
  scheduledAt: string
  maxHorses: number
  prizeFirst: number
  prizeSecond: number
  prizeThird: number
  status?: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'RUNNING' | 'FINISHED' // Merge legacy and actual statuses
  refereeId?: any
}

export type Horse = {
  id: string
  name: string
  breed?: string
  age?: number
  weight?: number
  color?: string
  gender?: 'MALE' | 'FEMALE'
  origin?: string
  healthCertUrl?: string
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  ownerId?: any
}

export type Jockey = {
  id: string
  userId: any
  age: number
  experience: number
  winRate: number
  bio?: string
  image?: string
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'INACTIVE'
  specialties: string[]
  wins: number
  races: number
}

export type Invite = {
  id: string
  horseId: any
  horseName?: string // Legacy alias
  jockeyId?: any
  raceId?: any
  ownerId?: any
  message?: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DECLINED'
  sentAt?: string
  expiresAt?: string
}

export type RaceRegistration = {
  id: string
  horseId: any
  raceId: any
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CONFIRMED'
  confirmedByOwner: boolean
  createdAt?: string
}

export type Prediction = {
  id: string
  raceId: any
  spectatorId: any
  horseId: any
  pickedHorseName?: string // Legacy alias
  betAmount?: number
  predictedPosition?: number
  status: 'OPEN' | 'CLOSED' | 'WON' | 'LOST' | 'PENDING'
  prizeAmount?: number
  actualPosition?: number
  createdAt?: string
}

export type RaceResult = {
  id: string
  raceId: string
  rankings: Array<{
    position: number
    horseId: any
    jockeyId: any
    finishTime: string
  }>
  notes?: string
  confirmedBy?: string
  confirmedAt?: string
}
