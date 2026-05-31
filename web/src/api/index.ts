import { http } from './http'
import { loadSession, saveSession } from '../auth/sessionStorage'
import type {
  Session,
  Role,
  Horse,
  Tournament,
  Race,
  Violation,
  RaceResult,
  RaceReport,
  RaceHorseRegistration,
  PredictionItem,

  LeaderboardEntry,
  Invite,
} from '../types'

function getApiBaseUrl(): string {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  if (!rawBaseUrl) {
    return ''
  }

  const normalized = rawBaseUrl.replace(/\/+$/, '')

  if (normalized.endsWith('/api-docs')) {
    return normalized.slice(0, -'/api-docs'.length)
  }

  return normalized
}

const BE = getApiBaseUrl() || 'http://localhost:3000'

// ============================================================================
// AUTH
// ============================================================================

export async function login(params: { email: string; password: string; role: Role }): Promise<Session> {
  const res = await http.post(`${BE}/auth/login`, {
    email: params.email,
    password: params.password,
  })
  const data = res.data
  return {
    token: data.accessToken,
    user: {
      id: data.user.userId,
      name: data.user.fullName,
      role: data.user.role,
      email: params.email,
    },
  }
}

export async function register(params: { name: string; email: string; password: string; role: Role }): Promise<Session> {
  await http.post(`${BE}/auth/register`, {
    email: params.email,
    password: params.password,
    fullName: params.name,
    role: params.role,
  })
  return login({ email: params.email, password: params.password, role: params.role })
}

export async function getCurrentUserProfile(): Promise<any> {
  try {
    const res = await http.get(`${BE}/auth/me`)
    return res.data?.data || res.data?.user || res.data
  } catch (error: any) {
    if (error?.response?.status !== 401) throw error

    const refreshed = await refreshAccessToken().catch(() => null)
    if (!refreshed) throw error

    const retry = await http.get(`${BE}/auth/me`)
    return retry.data?.data || retry.data?.user || retry.data
  }
}

export async function changePassword(params: {
  oldPassword: string
  newPassword: string
}): Promise<any> {
  try {
    const res = await http.post(`${BE}/auth/change-password`, params)
    return res.data?.data || res.data
  } catch (error: any) {
    if (error?.response?.status !== 401) throw error

    const refreshed = await refreshAccessToken().catch(() => null)
    if (!refreshed) throw error

    const retry = await http.post(`${BE}/auth/change-password`, params)
    return retry.data?.data || retry.data
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const res = await http.post(
    `${BE}/auth/refresh`,
    {},
    { withCredentials: true },
  )

  const data = res.data?.data || res.data || {}
  const token = data.accessToken || data.token || data?.access_token || null

  if (token) {
    const session = loadSession()
    if (session) {
      saveSession({
        ...session,
        token,
      })
    }
  }

  return token
}

// ============================================================================
// HORSES (Owner)
// ============================================================================

export async function getHorses(): Promise<Horse[]> {
  const res = await http.get(`${BE}/horses/me`)
  return (res.data || []).map((h: any) => ({
    ...h,
    _id: h._id,
    id: h._id,
    name: h.name,
    ownerId: h.ownerId,
  }))
}

// ============================================================================
// TOURNAMENTS (Public)
// ============================================================================

export async function getPublicTournaments(params?: { status?: string; page?: number; limit?: number }): Promise<{ tournaments: Tournament[]; total: number; page: number; totalPages?: number }> {
  const res = await http.get(`${BE}/tournaments`, { params })
  return res.data
}

export async function getPublicTournament(id: string): Promise<Tournament> {
  const res = await http.get(`${BE}/tournaments/${id}`)
  return res.data
}

export async function getTournamentLeaderboard(tournId: string, params?: { page?: number; limit?: number }): Promise<any> {
  const res = await http.get(`${BE}/tournaments/${tournId}/leaderboard`, { params })
  return res.data
}

// ============================================================================
// RACES (Public)
// ============================================================================

export async function getPublicRaces(params?: { tournamentId?: string; status?: string; page?: number; limit?: number }): Promise<any> {
  const res = await http.get(`${BE}/races`, { params })
  return res.data
}

export async function getPublicRace(raceId: string): Promise<Race> {
  const res = await http.get(`${BE}/races/${raceId}`)
  return res.data
}

export async function getRaceHorses(raceId: string): Promise<any> {
  const res = await http.get(`${BE}/races/${raceId}/horses`)
  return res.data
}

export async function getRaceResults(raceId: string): Promise<RaceResult[]> {
  const res = await http.get(`${BE}/races/${raceId}/results`)
  return Array.isArray(res.data) ? res.data : (res.data?.results || [])
}

// ============================================================================
// JOCKEYS / INVITES
// ============================================================================

export async function getInvites(): Promise<Invite[]> {
  const res = await http.get(`${BE}/jockeys/me/invitations`)
  return (res.data?.data || res.data || []).map((inv: any) => ({
    id: inv._id,
    horseId: inv.horseId?._id || inv.horseId,
    horseName: inv.horseId?.name || 'N/A',
    status: inv.status,
  }))
}

export async function getJockeyLeaderboard(params?: { page?: number; limit?: number }): Promise<LeaderboardEntry[]> {
  const res = await http.get(`${BE}/jockeys/leaderboard`, { params })
  return Array.isArray(res.data) ? res.data : (res.data?.data || [])
}

// ============================================================================
// PREDICTIONS (Spectator)
// ============================================================================

export async function checkPredictionOpen(raceId: string): Promise<{ isOpen: boolean }> {
  const res = await http.get(`${BE}/races/${raceId}/predictions/open`)
  return res.data
}

export async function placePrediction(raceId: string, horseId: string, betAmount: number): Promise<any> {
  const res = await http.post(`${BE}/races/${raceId}/predictions`, { horseId, betAmount })
  return res.data
}

export async function getMyPredictions(params?: { page?: number; limit?: number; status?: string }): Promise<any> {
  const res = await http.get(`${BE}/me/predictions`, { params })
  return res.data
}

export async function getPredictionDetail(predId: string): Promise<PredictionItem> {
  const res = await http.get(`${BE}/me/predictions/${predId}`)
  return res.data
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function getMyNotifications(params?: { page?: number; limit?: number; isRead?: boolean }): Promise<any> {
  const res = await http.get(`${BE}/me/notifications`, { params })
  return res.data
}

// ============================================================================
// REFEREE
// ============================================================================

export async function getRefereeRaces(): Promise<Race[]> {
  const res = await http.get(`${BE}/referee/races`)
  return Array.isArray(res.data) ? res.data : (res.data?.data || [])
}

export async function getRefereeRaceHorses(raceId: string): Promise<{ raceId: string; raceName: string; horses: RaceHorseRegistration[] }> {
  const res = await http.get(`${BE}/referee/races/${raceId}/horses`)
  return res.data
}

export async function getRefereeViolations(raceId: string): Promise<{ raceId: string; raceName: string; violations: Violation[] }> {
  const res = await http.get(`${BE}/referee/races/${raceId}/violations`)
  return res.data
}

export async function createViolation(raceId: string, data: {
  horseId: string; jockeyId: string; type: string; description: string; penalty: string; fineAmount?: number
}): Promise<any> {
  const res = await http.post(`${BE}/referee/races/${raceId}/violations`, data)
  return res.data
}

export async function resolveViolation(vId: string, resolutionNote?: string): Promise<any> {
  const res = await http.patch(`${BE}/referee/violations/${vId}/resolve`, { resolutionNote })
  return res.data
}

export async function confirmRaceResult(raceId: string, rankings: Array<{
  position: number; horseId: string; jockeyId: string; finishTime: string
}>, notes?: string): Promise<any> {
  const res = await http.post(`${BE}/referee/races/${raceId}/confirm-result`, { rankings, notes })
  return res.data
}

export async function createRaceReport(raceId: string, data: {
  summary: string; weatherCondition?: string; trackCondition?: string; incidentDetails?: string; additionalNotes?: string
}): Promise<any> {
  const res = await http.post(`${BE}/referee/races/${raceId}/report`, data)
  return res.data
}

export async function getRaceReport(raceId: string): Promise<RaceReport> {
  const res = await http.get(`${BE}/referee/races/${raceId}/report`)
  return res.data
}

// ============================================================================
// ADMIN (kept for other pages)
// ============================================================================

export async function getAdminUsers(): Promise<any> {
  const res = await http.get(`${BE}/admin/users`)
  return res.data
}

// Legacy wrapper — some old pages use getTournaments/getRaces/getPredictions
export async function getTournaments(): Promise<Tournament[]> {
  const data = await getPublicTournaments()
  return data.tournaments || []
}

export async function getTournament(id: string): Promise<Tournament> {
  return getPublicTournament(id)
}

export async function getRaces(): Promise<Race[]> {
  const data = await getPublicRaces()
  return Array.isArray(data) ? data : (data?.races || data?.data || [])
}

export async function getRace(id: string): Promise<Race> {
  return getPublicRace(id)
}

export async function getPredictions(): Promise<PredictionItem[]> {
  const data = await getMyPredictions()
  return Array.isArray(data) ? data : (data?.data || [])
}
