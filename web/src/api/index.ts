import { http } from './http'
import type { Invite, Prediction, Race, Role, Session, Tournament, Horse, User, RaceRegistration, Jockey, LeaderboardEntry, RaceHorseRegistration, Violation, NotificationItem, RaceReport } from '../types'

// Khai báo Base URL cho Backend Node.js thực tế
const BE_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// ============================================================================
// 1. CHỨC NĂNG AUTHENTICATION & PROFILE
// ============================================================================

export async function login(params: { email: string; password: string; role: Role }): Promise<Session> {
  const res = await http.post(`${BE_BASE_URL}/auth/login`, {
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
  await http.post(`${BE_BASE_URL}/auth/register`, {
    email: params.email,
    password: params.password,
    fullName: params.name,
    role: params.role,
  })
  
  return login({
    email: params.email,
    password: params.password,
    role: params.role,
  })
}

// ============================================================================
// 2. KHÁCH (PUBLIC) & OWNER / JOCKEY / SPECTATOR / REFEREE API KẾT NỐI BE
// ============================================================================

export async function getTournaments(): Promise<Tournament[]> {
  const res = await http.get(`${BE_BASE_URL}/tournaments`)
  const data = res.data.tournaments || res.data
  return data.map((t: any) => ({
    id: t._id || t.id,
    name: t.name,
    description: t.description,
    venue: t.venue,
    location: t.venue, // Legacy alias
    startDate: t.startDate,
    endDate: t.endDate,
    prizePool: t.prizePool,
    currency: t.currency,
    maxHorses: t.maxHorses,
    status: t.status,
  }))
}

export async function getTournament(id: string): Promise<Tournament> {
  const res = await http.get(`${BE_BASE_URL}/tournaments/${id}`)
  const t = res.data
  return {
    id: t._id || t.id,
    name: t.name,
    description: t.description,
    venue: t.venue,
    location: t.venue, // Legacy alias
    startDate: t.startDate,
    endDate: t.endDate,
    prizePool: t.prizePool,
    currency: t.currency,
    maxHorses: t.maxHorses,
    status: t.status,
  }
}

export async function getRaces(tournamentId?: string): Promise<Race[]> {
  const url = tournamentId 
    ? `${BE_BASE_URL}/races?tournamentId=${tournamentId}` 
    : `${BE_BASE_URL}/races`
  const res = await http.get(url)
  const data = res.data.races || res.data
  return data.map((r: any) => ({
    id: r._id || r.id,
    tournamentId: r.tournamentId,
    name: r.name,
    distance: r.distance,
    scheduledAt: r.scheduledAt,
    maxHorses: r.maxHorses,
    prizeFirst: r.prizeFirst,
    prizeSecond: r.prizeSecond,
    prizeThird: r.prizeThird,
    status: r.status,
    refereeId: r.refereeId,
  }))
}

export async function getRace(id: string): Promise<Race> {
  const res = await http.get(`${BE_BASE_URL}/races/${id}`)
  const r = res.data
  return {
    id: r._id || r.id,
    tournamentId: r.tournamentId,
    name: r.name,
    distance: r.distance,
    scheduledAt: r.scheduledAt,
    maxHorses: r.maxHorses,
    prizeFirst: r.prizeFirst,
    prizeSecond: r.prizeSecond,
    prizeThird: r.prizeThird,
    status: r.status,
    refereeId: r.refereeId,
  }
}

export async function getHorses(): Promise<Horse[]> {
  const res = await http.get(`${BE_BASE_URL}/horses/me`)
  return res.data.map((h: any) => ({
    id: h._id || h.id,
    name: h.name,
    breed: h.breed,
    age: h.age,
    weight: h.weight,
    color: h.color,
    gender: h.gender,
    origin: h.origin,
    healthCertUrl: h.healthCertUrl,
    status: h.status,
    ownerId: h.ownerId,
  }))
}

export async function createHorse(data: Partial<Horse>): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/horses`, data)
  return res.data
}

export async function updateHorse(id: string, data: Partial<Horse>): Promise<any> {
  const res = await http.put(`${BE_BASE_URL}/horses/${id}`, data)
  return res.data
}

export async function deleteHorse(id: string): Promise<any> {
  const res = await http.delete(`${BE_BASE_URL}/horses/${id}`)
  return res.data
}

export async function registerHorseRace(horseId: string, raceId: string): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/horses/${horseId}/register-race`, { raceId })
  return res.data
}

export async function confirmRaceParticipation(horseId: string, raceId: string): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/horses/me/${horseId}/confirm-race/${raceId}`)
  return res.data
}

export async function searchJockeys(params?: { status?: string; page?: number; limit?: number }): Promise<Jockey[]> {
  const res = await http.get(`${BE_BASE_URL}/jockeys`, { params })
  const data = res.data.jockeys || res.data.data || res.data
  return data.map((j: any) => ({
    id: j._id || j.id,
    userId: j.userId,
    age: j.age,
    experience: j.experience,
    winRate: j.winRate,
    bio: j.bio,
    image: j.image,
    status: j.status,
    specialties: j.specialties,
    wins: j.wins,
    races: j.races,
  }))
}

export async function sendJockeyInvitation(horseId: string, jockeyId: string, raceId: string, message?: string): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/horses/${horseId}/invitations`, { jockeyId, raceId, message })
  return res.data
}

export async function getHorseJockeys(horseId: string): Promise<any[]> {
  const res = await http.get(`${BE_BASE_URL}/horses/${horseId}/jockeys`)
  return res.data.jockeys || res.data
}

export async function confirmJockey(horseId: string, jockeyId: string, raceId: string): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/horses/${horseId}/jockeys/${jockeyId}/confirm`, { raceId })
  return res.data
}

export async function getInvites(): Promise<Invite[]> {
  const res = await http.get(`${BE_BASE_URL}/jockeys/me/invitations`)
  const data = res.data.invitations || res.data
  return data.map((inv: any) => ({
    id: inv._id || inv.id,
    horseId: inv.horseId?._id || inv.horseId,
    horseName: inv.horseId?.name || (typeof inv.horseId === 'object' ? inv.horseId?.name : inv.horseId) || 'Ngựa thi đấu',
    horseBreed: inv.horseId?.breed,
    horseAge: inv.horseId?.age,
    horseWeight: inv.horseId?.weight,
    horseColor: inv.horseId?.color,
    horseGender: inv.horseId?.gender,
    horseHealthCertUrl: inv.horseId?.healthCertUrl,
    jockeyId: inv.jockeyId,
    raceId: inv.raceId,
    raceName: inv.raceId?.name,
    raceScheduledAt: inv.raceId?.scheduledAt,
    raceDistance: inv.raceId?.distance,
    status: inv.status === 'REJECTED' ? 'DECLINED' : inv.status,
    message: inv.message,
    sentAt: inv.sentAt,
  }))
}

export async function acceptInvitation(inviteId: string): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/jockeys/me/invitations/${inviteId}/accept`)
  return res.data
}

export async function rejectInvitation(inviteId: string): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/jockeys/me/invitations/${inviteId}/reject`)
  return res.data
}

export async function markNotificationRead(notifId: string): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/me/notifications/${notifId}/read`)
  return res.data
}



export async function getPredictions(): Promise<Prediction[]> {
  const res = await http.get(`${BE_BASE_URL}/me/predictions`)
  const data = res.data.predictions || res.data.data || res.data
  return data.map((p: any) => ({
    id: p._id || p.id,
    raceId: p.raceId,
    spectatorId: p.spectatorId,
    horseId: p.horseId?._id || p.horseId,
    pickedHorseName: p.horseId?.name || (typeof p.horseId === 'object' ? p.horseId?.name : p.horseId) || 'Ngựa thi đấu',
    betAmount: p.betAmount,
    predictedPosition: p.predictedPosition,
    status: p.status === 'OPEN' ? 'PENDING' : p.status,
    prizeAmount: p.prizeAmount,
    actualPosition: p.actualPosition,
    createdAt: p.createdAt,
  }))
}

export async function getRefereeRaces(): Promise<Race[]> {
  const res = await http.get(`${BE_BASE_URL}/referee/races`)
  return res.data.map((r: any) => ({
    id: r._id || r.id,
    tournamentId: r.tournamentId,
    name: r.name,
    distance: r.distance,
    scheduledAt: r.scheduledAt,
    maxHorses: r.maxHorses,
    prizeFirst: r.prizeFirst,
    prizeSecond: r.prizeSecond,
    prizeThird: r.prizeThird,
    status: r.status,
    refereeId: r.refereeId,
  }))
}

// ============================================================================
// 3. HỆ THỐNG API QUẢN TRỊ (ADMIN ONLY)
// ============================================================================

// --- QUẢN LÝ USER ---
export async function getAdminUsers(params?: { search?: string; role?: string; status?: string }): Promise<User[]> {
  const res = await http.get(`${BE_BASE_URL}/admin/users`, { params })
  const data = res.data.data || res.data
  return data.map((u: any) => ({
    id: u.userId || u._id || u.id,
    name: u.fullName || u.name,
    role: u.role,
    email: u.email,
    status: u.status,
    phone: u.phone,
    createdAt: u.createdAt,
  }))
}

export async function updateUserRole(userId: string, role: Role): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/admin/users/${userId}/role`, { role })
  return res.data
}

export async function toggleUserStatus(userId: string, active: boolean): Promise<any> {
  const endpoint = active ? 'activate' : 'deactivate'
  const res = await http.patch(`${BE_BASE_URL}/admin/users/${userId}/${endpoint}`)
  return res.data
}

export async function deleteUser(userId: string): Promise<any> {
  const res = await http.delete(`${BE_BASE_URL}/admin/users/${userId}`)
  return res.data
}

// --- QUẢN LÝ GIẢI ĐẤU (TOURNAMENT) ---
export async function createTournament(data: Omit<Tournament, 'id'>): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/admin/tournaments`, data)
  return res.data
}

export async function updateTournament(id: string, data: Partial<Tournament>): Promise<any> {
  const res = await http.put(`${BE_BASE_URL}/admin/tournaments/${id}`, data)
  return res.data
}

export async function deleteTournament(id: string): Promise<any> {
  const res = await http.delete(`${BE_BASE_URL}/admin/tournaments/${id}`)
  return res.data
}

// --- QUẢN LÝ CUỘC ĐUA (RACE) & LỊCH TRÌNH ---
export async function createRace(data: Omit<Race, 'id'>): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/admin/races`, data)
  return res.data
}

export async function updateRace(id: string, data: Partial<Race>): Promise<any> {
  const res = await http.put(`${BE_BASE_URL}/admin/races/${id}`, data)
  return res.data
}

export async function assignReferee(raceId: string, refereeId: string): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/admin/races/${raceId}/assign-referee`, { refereeId })
  return res.data
}

export async function createSchedule(data: any): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/schedules`, data)
  return res.data
}

// --- DUYỆT ĐĂNG KÝ THAM GIA ---
export async function getRaceRegistrations(status?: string, raceId?: string): Promise<RaceRegistration[]> {
  const res = await http.get(`${BE_BASE_URL}/admin/races/registrations`, {
    params: { status, raceId },
  })
  const data = Array.isArray(res.data) ? res.data : (res.data.registrations || [])
  return data.map((r: any) => ({
    id: r._id || r.id,
    horseId: r.horseId,
    raceId: r.raceId,
    status: r.status,
    confirmedByOwner: r.confirmedByOwner,
    createdAt: r.createdAt,
  }))
}

export async function approveRaceRegistration(regId: string): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/admin/races/registrations/${regId}/approve`)
  return res.data
}

export async function rejectRaceRegistration(regId: string, reason?: string): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/admin/races/registrations/${regId}/reject`, { reason })
  return res.data
}

// --- QUẢN LÝ NGỰA & JOCKEY ---
export async function getAdminHorses(params?: { search?: string; status?: string }): Promise<Horse[]> {
  const res = await http.get(`${BE_BASE_URL}/admin/horses`, { params })
  return res.data.map((h: any) => ({
    id: h._id || h.id,
    name: h.name,
    breed: h.breed,
    age: h.age,
    weight: h.weight,
    color: h.color,
    gender: h.gender,
    origin: h.origin,
    healthCertUrl: h.healthCertUrl,
    status: h.status,
    ownerId: h.ownerId,
  }))
}

export async function approveHorse(horseId: string): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/admin/horses/${horseId}/approve`)
  return res.data
}

export async function rejectHorse(horseId: string, reason?: string): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/admin/horses/${horseId}/reject`, { reason })
  return res.data
}

export async function getAdminJockeys(params?: { status?: string }): Promise<Jockey[]> {
  const res = await http.get(`${BE_BASE_URL}/admin/horses/jockeys`, { params })
  const data = res.data.jockeys || res.data
  return data.map((j: any) => ({
    id: j._id || j.id,
    userId: j.userId,
    age: j.age,
    experience: j.experience,
    winRate: j.winRate,
    bio: j.bio,
    image: j.image,
    status: j.status,
    specialties: j.specialties,
    wins: j.wins,
    races: j.races,
  }))
}

// --- CÔNG BỐ KẾT QUẢ ---
export async function publishRaceResult(raceId: string, results: any[]): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/results/admin/races/${raceId}/publish`, { results })
  return res.data
}

export async function getRaceResults(raceId: string): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/results/races/${raceId}`)
  return res.data
}

export async function getHorseResults(horseId: string): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/results/horses/me/${horseId}`)
  return res.data
}

// --- QUẢN LÝ DỰ ĐOÁN (PREDICTIONS) ---
export async function getAdminPredictions(params?: { status?: string; raceId?: string }): Promise<Prediction[]> {
  const res = await http.get(`${BE_BASE_URL}/prediction/admin/predictions`, { params })
  const data = res.data.predictions || res.data.data || res.data
  return data.map((p: any) => ({
    id: p._id || p.id,
    raceId: p.raceId,
    spectatorId: p.spectatorId,
    horseId: p.horseId,
    betAmount: p.betAmount,
    predictedPosition: p.predictedPosition,
    status: p.status,
    prizeAmount: p.prizeAmount,
    actualPosition: p.actualPosition,
    createdAt: p.createdAt,
  }))
}

export async function getPredictionStats(raceId?: string): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/prediction/admin/predictions/stats`, { params: { raceId } })
  return res.data
}

export async function closePredictions(raceId: string): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/prediction/admin/races/${raceId}/predictions/close`)
  return res.data
}

export async function settlePredictions(raceId: string): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/prediction/admin/races/${raceId}/predictions/settle`)
  return res.data
}

// ============================================================================
// 4. BỔ SUNG CÁC API THIẾU CHO TOURNAMENT, PREDICTION, REFEREE & NOTIFICATIONS
// ============================================================================

export async function getPublicRaces(params?: { status?: string; tournamentId?: string }): Promise<Race[]> {
  const res = await http.get(`${BE_BASE_URL}/races`, { params })
  const data = res.data.races || res.data.data || res.data
  return data.map((r: any) => ({
    id: r._id || r.id,
    _id: r._id || r.id,
    tournamentId: r.tournamentId,
    name: r.name,
    distance: r.distance,
    scheduledAt: r.scheduledAt,
    maxHorses: r.maxHorses,
    prizeFirst: r.prizeFirst,
    prizeSecond: r.prizeSecond,
    prizeThird: r.prizeThird,
    status: r.status,
    refereeId: r.refereeId,
  }))
}

export async function getPublicTournament(id: string): Promise<Tournament> {
  return getTournament(id)
}

export async function getPublicTournaments(): Promise<Tournament[]> {
  return getTournaments()
}

export async function getTournamentLeaderboard(id: string): Promise<LeaderboardEntry[]> {
  const res = await http.get(`${BE_BASE_URL}/tournaments/${id}/leaderboard`)
  const data = res.data.leaderboard || res.data.data || res.data || []
  return data.map((entry: any, index: number) => ({
    id: entry._id || entry.id || String(index),
    _id: entry._id || entry.id || String(index),
    horseId: entry.horseId,
    horseName: entry.horseName,
    jockeyId: entry.jockeyId,
    jockeyName: entry.jockeyName,
    races: entry.races ?? 0,
    wins: entry.wins ?? 0,
    totalPoints: entry.totalPoints ?? 0,
    totalPrize: entry.totalPrize ?? 0,
  }))
}

export async function checkPredictionOpen(raceId: string): Promise<{ isOpen: boolean }> {
  const res = await http.get(`${BE_BASE_URL}/races/${raceId}/predictions/open`)
  return res.data
}

export async function getMyPredictions(): Promise<Prediction[]> {
  return getPredictions()
}

export async function getRaceHorses(raceId: string): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/races/${raceId}/horses`)
  const list = Array.isArray(res.data) ? res.data : (res.data.horses || res.data.data || [])
  return list.map((h: any) => ({
    id: h._id || h.id,
    _id: h._id || h.id,
    horse: h.horse || h,
    horseId: h.horseId || h.horse?._id || h.horse?.id,
    raceId: h.raceId,
    registrationStatus: h.registrationStatus || h.status || 'PENDING',
    status: h.status || h.registrationStatus || 'PENDING',
  }))
}

export async function getRefereeRaceHorses(raceId: string): Promise<{ horses: RaceHorseRegistration[] }> {
  const res = await http.get(`${BE_BASE_URL}/referee/races/${raceId}/horses`)
  const list = Array.isArray(res.data) ? res.data : (res.data.horses || res.data.data || [])
  return {
    horses: list.map((h: any) => ({
      id: h._id || h.id,
      _id: h._id || h.id,
      horse: h.horse || h,
      horseId: h.horseId || h.horse?._id || h.horse?.id,
      raceId: h.raceId,
      registrationStatus: h.registrationStatus || h.status || 'PENDING',
      status: h.status || h.registrationStatus || 'PENDING',
      confirmedByOwner: h.confirmedByOwner ?? false,
    }))
  }
}

export async function placePrediction(raceId: string, horseId: string, betAmount: number): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/predictions`, { raceId, horseId, betAmount })
  return res.data
}

export async function getPublicRace(id: string): Promise<Race> {
  return getRace(id)
}

export async function getRefereeViolations(raceId: string): Promise<{ violations: Violation[] }> {
  const res = await http.get(`${BE_BASE_URL}/referee/races/${raceId}/violations`)
  const list = Array.isArray(res.data) ? res.data : (res.data.violations || res.data.data || [])
  return {
    violations: list.map((v: any) => ({
      id: v._id || v.id,
      _id: v._id || v.id,
      raceId: v.raceId,
      horseId: v.horseId,
      jockeyId: v.jockeyId,
      type: v.type,
      description: v.description,
      penalty: v.penalty,
      fineAmount: v.fineAmount,
      status: v.status,
      resolutionNote: v.resolutionNote,
      createdAt: v.createdAt,
    }))
  }
}

export async function createViolation(raceId: string, data: any): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/referee/races/${raceId}/violations`, data)
  return res.data
}

export async function resolveViolation(violationId: string, resolutionNote: string): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/referee/violations/${violationId}/resolve`, { resolutionNote })
  return res.data
}

export async function confirmRaceResult(raceId: string, rankings: any[], notes?: string): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/referee/races/${raceId}/confirm-result`, { rankings, notes })
  return res.data
}

export async function getMyNotifications(): Promise<NotificationItem[]> {
  const res = await http.get(`${BE_BASE_URL}/me/notifications`)
  const list = Array.isArray(res.data) ? res.data : (res.data.notifications || res.data.data || [])
  return list.map((n: any) => ({
    id: n._id || n.id,
    _id: n._id || n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    read: n.read ?? false,
    createdAt: n.createdAt,
  }))
}

export async function createRaceReport(raceId: string, data: any): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/referee/races/${raceId}/report`, data)
  return res.data
}

export async function getRaceReport(raceId: string): Promise<RaceReport> {
  const res = await http.get(`${BE_BASE_URL}/referee/races/${raceId}/report`)
  const rep = res.data
  return {
    id: rep._id || rep.id,
    _id: rep._id || rep.id,
    raceId: rep.raceId,
    summary: rep.summary,
    weatherCondition: rep.weatherCondition,
    trackCondition: rep.trackCondition,
    incidentDetails: rep.incidentDetails,
    additionalNotes: rep.additionalNotes,
    totalParticipants: rep.totalParticipants,
    totalViolations: rep.totalViolations,
    refereeId: rep.refereeId,
    updatedAt: rep.updatedAt,
    createdAt: rep.createdAt,
  }
}
