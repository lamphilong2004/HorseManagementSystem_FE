export type Role = 'ADMIN' | 'OWNER' | 'JOCKEY' | 'REFEREE' | 'SPECTATOR'

export type User = {
  id: string
  name: string
  role: Role
  email?: string
}

export type Session = {
  token: string
  user: User
}

// ============================================================================
// Backend data models (MongoDB)
// ============================================================================

export type Tournament = {
  _id: string
  name: string
  venue: string
  startDate: string
  endDate: string
  status: string
  prizePool?: number
  currency?: string
  description?: string
  maxHorses?: number
}

export type Race = {
  _id: string
  name: string
  status: string
  scheduledAt: string
  distance?: number
  maxHorses?: number
  tournamentId?: any
  refereeId?: any
  prizeFirst?: number
  prizeSecond?: number
  prizeThird?: number
}

export type Horse = {
  _id: string
  name: string
  breed?: string
  age?: number
  weight?: number
  color?: string
  gender?: string
  origin?: string
  healthCertUrl?: string
  ownerId?: any
  status?: string
}

export type RaceHorseRegistration = {
  registrationId: string
  registrationStatus: string
  horse: Horse
  jockeyId?: any
  confirmedByOwner?: boolean
}

export type Violation = {
  _id: string
  raceId?: string
  horseId?: any
  jockeyId?: any
  type: string
  description: string
  penalty: string
  fineAmount?: number
  status: string
  resolutionNote?: string
  resolvedAt?: string
  createdAt?: string
}

export type RaceResult = {
  _id: string
  horseId: any
  jockeyId: any
  position: number
  finishTime?: number | string
  status: string
  prizeAmount?: number
  notes?: string
}

export type RaceReport = {
  _id: string
  raceId: string
  refereeId?: any
  summary: string
  weatherCondition?: string
  trackCondition?: string
  incidentDetails?: string
  additionalNotes?: string
  totalParticipants?: number
  totalViolations?: number
  createdAt?: string
  updatedAt?: string
}

export type PredictionItem = {
  _id: string
  raceId: any
  horseId: any
  userId?: string
  betAmount: number
  status: string
  payout?: number
  createdAt: string
}

export type NotificationItem = {
  _id: string
  message: string
  type?: string
  isRead: boolean
  createdAt: string
  predictionId?: string
}

export type LeaderboardEntry = {
  horseId?: any
  horseName?: string
  jockeyId?: any
  jockeyName?: string
  totalPoints?: number
  totalPrize?: number
  wins?: number
  races?: number
  position?: number
}

// Legacy aliases (backward compat for pages not yet migrated)
export type Invite = {
  id: string
  horseId: string
  horseName: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
}

export type Prediction = {
  id: string
  raceId: string
  pickedHorseName: string
  status: 'PENDING' | 'WON' | 'LOST'
}
