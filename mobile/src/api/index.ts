import { http } from './http'
import type { Invite, Prediction, Race, Role, Session, Tournament, Horse, User, RaceRegistration, Jockey, LeaderboardEntry, RaceHorseRegistration, Violation, NotificationItem, RaceReport } from '../types'

// Khai báo Base URL cho Backend Node.js thực tế
const BE_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://managerhourse-be.onrender.com'

// ============================================================================
// 1. CHỨC NĂNG AUTHENTICATION & PROFILE
// ============================================================================

export async function login(params: { email: string; password: string; role?: Role }): Promise<Session> {
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

export async function getMyProfile(): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/auth/me`)
  return res.data
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
  const res = await http.get(`${BE_BASE_URL}/tournaments?limit=100`)
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
    status: t.status,
    createdAt: t.createdAt,
  })).reverse()
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
    ? `${BE_BASE_URL}/races?tournamentId=${tournamentId}&limit=1000` 
    : `${BE_BASE_URL}/races?limit=1000`
  const res = await http.get(url)
  const data = res.data.races || res.data.data || (Array.isArray(res.data) ? res.data : [])
  
  return data.map((r: any) => ({
    id: String(r._id || r.id || '').trim(),
    _id: String(r._id || r.id || '').trim(),
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
    results: r.results,
    rankings: r.rankings,
    confirmedAt: r.confirmedAt,
    isLive: r.isLive,
    playbackId: r.playbackId,
    streamKey: r.streamKey,
    createdAt: r.createdAt,
  })).reverse()
}

export async function getRace(id: string): Promise<any> {
  const raceId = String(id || '').trim()
  const res = await http.get(`${BE_BASE_URL}/races/${raceId}`)
  const r = res.data.race || res.data

  // Extract result from nested object if BE added it
  const backendResult = r.result || r.results || r.rankings;
  let extractedRankings = backendResult;
  if (backendResult && typeof backendResult === 'object' && !Array.isArray(backendResult)) {
    extractedRankings = backendResult.rankings || backendResult.results || backendResult.data || backendResult;
  }

  return {
    id: String(r._id || r.id || '').trim(),
    _id: String(r._id || r.id || '').trim(),
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
    results: extractedRankings,
    rankings: extractedRankings,
    confirmedAt: r.confirmedAt,
    isLive: r.isLive,
    playbackId: r.playbackId,
    streamKey: r.streamKey,
    createdAt: r.createdAt,
  }
}

export async function getRaceStreamUrl(id: string): Promise<string | null> {
  try {
    const raceId = String(id || '').trim()
    const res = await http.get(`${BE_BASE_URL}/races/${raceId}/stream`)
    return res.data?.streamUrl || res.data?.url || null
  } catch (err) {
    console.error('Failed to get race stream URL', err)
    return null
  }
}

export async function getHorses(): Promise<Horse[]> {
  const res = await http.get(`${BE_BASE_URL}/horses/me`)
  const data = res.data.horses || res.data.data || (Array.isArray(res.data) ? res.data : [])

  return data.map((h: any) => ({
    id: String(h._id || h.id || '').trim(),
    _id: String(h._id || h.id || '').trim(),
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
    createdAt: h.createdAt,
  })).reverse()
}

export async function createHorse(data: Partial<Horse>): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/horses`, data)
  return res.data
}

export async function updateHorse(id: string, data: Partial<Horse>): Promise<any> {
  const horseId = String(id || '').trim()
  const res = await http.put(`${BE_BASE_URL}/horses/${horseId}`, data)
  return res.data
}

export async function deleteHorse(id: string): Promise<any> {
  const horseId = String(id || '').trim()
  const res = await http.delete(`${BE_BASE_URL}/horses/${horseId}`)
  return res.data
}

export async function registerHorseRace(horseId: string, raceId: string): Promise<any> {
  const hId = String(horseId || '').trim()
  const rId = String(raceId || '').trim()
  const res = await http.post(`${BE_BASE_URL}/horses/${hId}/register-race`, { raceId: rId })
  return res.data
}

export async function confirmRaceParticipation(horseId: string, raceId: string): Promise<any> {
  const hId = String(horseId || '').trim()
  const rId = String(raceId || '').trim()
  const res = await http.patch(`${BE_BASE_URL}/horses/me/${hId}/confirm-race/${rId}`)
  return res.data
}

export async function searchJockeys(params?: { status?: string; page?: number; limit?: number }): Promise<Jockey[]> {
  const res = await http.get(`${BE_BASE_URL}/jockeys`, { params })
  const data = res.data.jockeys || res.data.data || (Array.isArray(res.data) ? res.data : [])
  
  return data.map((j: any) => ({
    id: String(j._id || j.id || '').trim(),
    _id: String(j._id || j.id || '').trim(),
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
    createdAt: j.createdAt,
  })).reverse()
}

export async function sendJockeyInvitation(horseId: string, jockeyId: string, raceId: string, message?: string, registrationId?: string, raceName?: string): Promise<any> {
  const hId = String(horseId || '').trim()
  const jId = String(jockeyId || '').trim()
  const rId = String(raceId || '').trim()
  const regId = String(registrationId || '').trim()

  if (!hId || !jId || !rId) {
    throw new Error('Thiếu thông tin ID để gửi lời mời')
  }

  const msg = message || 'Mời bạn cưỡi ngựa của tôi'

  // Try with raceId first
  try {
    const res = await http.post(`${BE_BASE_URL}/horses/${hId}/invitations`, {
      jockeyId: jId,
      raceId: rId,
      raceName: raceName || '',
      message: msg
    })
    return res.data
  } catch (err: any) {
    const errMsg = err?.response?.data?.message || ''
    const isRaceNotFound = err?.response?.status === 404 && errMsg.toLowerCase().includes('race')
    // If backend says "Race not found" and we have a registrationId, try using registrationId as raceId
    if (isRaceNotFound && regId) {
      console.log('[FALLBACK] Retrying invitation with registrationId as raceId:', regId)
      const res2 = await http.post(`${BE_BASE_URL}/horses/${hId}/invitations`, {
        jockeyId: jId,
        raceId: regId,
        raceName: raceName || '',
        message: msg
      })
      return res2.data
    }
    throw err
  }
}

export async function getHorseJockeys(horseId: string): Promise<any[]> {
  const hId = String(horseId || '').trim()
  const res = await http.get(`${BE_BASE_URL}/horses/${hId}/jockeys`)
  const data = res.data.jockeys || res.data || []
  return data.map((inv: any) => {
    // Extract embedded RACE_ID if present (to bypass backend bug)
    let extractedRaceId = '';
    let displayMessage = inv.message || '';
    if (displayMessage.includes('|RACE_ID:')) {
      const parts = displayMessage.split('|RACE_ID:');
      displayMessage = parts[0];
      extractedRaceId = parts[1]?.trim();
    }
    inv.message = displayMessage;

    // Determine Horse Data
    const horseObj = inv.horse || inv.horseId || {}
    const hasHorseObj = typeof horseObj === 'object' && horseObj !== null && !Array.isArray(horseObj)
    
    // Determine Race Data
    const raceObj = inv.race || inv.raceId || {}
    const hasRaceObj = typeof raceObj === 'object' && raceObj !== null && !Array.isArray(raceObj)

    // Determine Owner Data
    const ownerObj = inv.ownerId || inv.owner || inv.horseId?.ownerId || {}
    const hasOwnerObj = typeof ownerObj === 'object' && ownerObj !== null && !Array.isArray(ownerObj)

    return {
      id: inv._id || inv.id,
      horseId: hasHorseObj ? (horseObj._id || horseObj.id) : (typeof inv.horseId === 'string' ? inv.horseId : undefined),
      horseName: inv.horseName || horseObj.name || inv.horse_name || (typeof inv.horseId === 'string' && !inv.horseId.match(/^[0-9a-fA-F]{24}$/) ? inv.horseId : undefined) || 'Ngựa thi đấu',
      horseBreed: inv.horseBreed || horseObj.breed || inv.breed || 'Chưa rõ',
      horseAge: inv.horseAge || horseObj.age || inv.age,
      horseWeight: inv.horseWeight || horseObj.weight || inv.weight,
      horseColor: inv.horseColor || horseObj.color || inv.color,
      horseGender: inv.horseGender || horseObj.gender || inv.gender,
      horseHealthCertUrl: inv.horseHealthCertUrl || horseObj.healthCertUrl || inv.healthCertUrl,
      
      jockeyId: inv.jockeyId?._id || inv.jockeyId,
      
      raceId: extractedRaceId || (hasRaceObj ? (raceObj._id || raceObj.id) : (typeof inv.raceId === 'string' ? inv.raceId : undefined)),
      raceName: inv.raceName || raceObj.name || inv.race_name || (typeof inv.raceId === 'string' && !inv.raceId.match(/^[0-9a-fA-F]{24}$/) ? inv.raceId : undefined) || 'Chưa xác định',
      raceScheduledAt: inv.raceScheduledAt || raceObj.scheduledAt || inv.scheduledAt || inv.scheduledTime || raceObj.scheduledTime,
      raceDistance: inv.raceDistance || raceObj.distance || inv.distance || raceObj.raceDistance,
      
      status: inv.status === 'REJECTED' ? 'DECLINED' : inv.status,
      message: inv.message,
      sentAt: inv.sentAt,
      ownerId: hasOwnerObj ? (ownerObj._id || ownerObj.id) : (typeof inv.ownerId === 'string' ? inv.ownerId : undefined),
      ownerName: inv.ownerName || ownerObj.fullName || ownerObj.name || inv.owner_name || 'Chủ ngựa',
    }
  })
}

export async function confirmJockey(horseId: string, jockeyId: string, raceId: string): Promise<any> {
  const hId = String(horseId || '').trim()
  const jId = String(jockeyId || '').trim()
  const rId = String(raceId || '').trim()
  const res = await http.patch(`${BE_BASE_URL}/horses/${hId}/jockeys/${jId}/confirm`, { raceId: rId })
  return res.data
}

export async function getInvites(): Promise<Invite[]> {
  const res = await http.get(`${BE_BASE_URL}/jockeys/me/invitations?limit=100`)
  
  // #region debug-point jockey-invites-data
  fetch('http://127.0.0.1:7777/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'jockey-invites-missing-data',
      runId: 'pre-fix',
      hypothesisId: 'H1',
      msg: '[DEBUG] Raw invitations data',
      data: res.data
    })
  }).catch(() => {});
  // #endregion

  const data = res.data.invitations || res.data || []
  return data.map((inv: any) => {
    
    // Extract embedded RACE_ID if present (to bypass backend bug)
    let extractedRaceId = '';
    let displayMessage = inv.message || '';
    if (displayMessage.includes('|RACE_ID:')) {
      const parts = displayMessage.split('|RACE_ID:');
      displayMessage = parts[0];
      extractedRaceId = parts[1]?.trim();
    }
    inv.message = displayMessage;
    
    // Determine Horse Data
    const horseObj = inv.horse || inv.horseId || {};
    const hasHorseObj = typeof horseObj === 'object' && horseObj !== null && !Array.isArray(horseObj);
    
    // Determine Race Data
    const raceObj = inv.race || inv.raceId || {};
    const hasRaceObj = typeof raceObj === 'object' && raceObj !== null && !Array.isArray(raceObj);

    // Determine Owner Data
    const ownerObj = inv.ownerId || inv.owner || inv.horseId?.ownerId || {};
    const hasOwnerObj = typeof ownerObj === 'object' && ownerObj !== null && !Array.isArray(ownerObj);

    return {
      id: inv._id || inv.id,
      horseId: hasHorseObj ? (horseObj._id || horseObj.id) : (typeof inv.horseId === 'string' ? inv.horseId : undefined),
      horseName: inv.horseName || horseObj.name || inv.horse_name || (typeof inv.horseId === 'string' && !inv.horseId.match(/^[0-9a-fA-F]{24}$/) ? inv.horseId : undefined) || 'Ngựa thi đấu',
      horseBreed: inv.horseBreed || horseObj.breed || inv.breed || 'Chưa rõ',
      horseAge: inv.horseAge || horseObj.age || inv.age,
      horseWeight: inv.horseWeight || horseObj.weight || inv.weight,
      horseColor: inv.horseColor || horseObj.color || inv.color,
      horseGender: inv.horseGender || horseObj.gender || inv.gender,
      horseHealthCertUrl: inv.horseHealthCertUrl || horseObj.healthCertUrl || inv.healthCertUrl,
      
      jockeyId: inv.jockeyId?._id || inv.jockeyId,
      
      raceId: extractedRaceId || (hasRaceObj ? (raceObj._id || raceObj.id) : (typeof inv.raceId === 'string' ? inv.raceId : undefined)),
      raceName: inv.raceName || raceObj.name || inv.race_name || (typeof inv.raceId === 'string' && !inv.raceId.match(/^[0-9a-fA-F]{24}$/) ? inv.raceId : undefined) || 'Chưa xác định',
      raceScheduledAt: inv.raceScheduledAt || raceObj.scheduledAt || inv.scheduledAt || inv.scheduledTime || raceObj.scheduledTime,
      raceDistance: inv.raceDistance || raceObj.distance || inv.distance || raceObj.raceDistance,
      
      status: inv.status === 'REJECTED' ? 'DECLINED' : inv.status,
      message: inv.message,
      sentAt: inv.sentAt,
      ownerId: hasOwnerObj ? (ownerObj._id || ownerObj.id) : (typeof inv.ownerId === 'string' ? inv.ownerId : undefined),
      ownerName: inv.ownerName || ownerObj.fullName || ownerObj.name || inv.owner_name || 'Chủ ngựa',
    };
  })
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
    predictedPosition: p.predictedPosition ?? 1,
    status: p.status,
    prizeAmount: p.prizeAmount ?? (p.status === 'WON' ? Math.round((p.betAmount || 0) * 1.8) : 0),
    actualPosition: p.actualPosition,
    raceName: p.raceName || (p.raceId && typeof p.raceId === 'object' ? p.raceId.name : p.race?.name),
    raceScheduledAt: p.raceScheduledAt || (p.raceId && typeof p.raceId === 'object' ? p.raceId.scheduledAt : p.race?.scheduledAt),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    payout: p.payout,
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
export async function getAdminUsers(params?: { search?: string; role?: string; status?: string; limit?: number; page?: number }): Promise<User[]> {
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

export async function createAdminUser(params: { name: string; email: string; password: string; role: Role; phone?: string }): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/admin/users`, {
    fullName: params.name,
    email: params.email,
    password: params.password,
    role: params.role,
    phone: params.phone,
  })
  return res.data
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
  const data = Array.isArray(res.data) ? res.data : (res.data.registrations || res.data.data || [])

  return data.map((r: any) => ({
    id: r.regId || r._id || r.id,
    horseId: (r.horse && typeof r.horse === 'object') ? (r.horse._id || r.horse.id || r.horse) : (r.horseId && typeof r.horseId === 'object' ? (r.horseId._id || r.horseId.id || r.horseId) : r.horseId),
    horseName: r.horseName || (r.horse && typeof r.horse === 'object' ? r.horse.name : undefined) || (r.horseId && typeof r.horseId === 'object' ? r.horseId.name : undefined),
    horseBreed: r.horseBreed || (r.horse && typeof r.horse === 'object' ? r.horse.breed : undefined) || (r.horseId && typeof r.horseId === 'object' ? r.horseId.breed : undefined),
    raceId: (r.race && typeof r.race === 'object') ? (r.race._id || r.race.id || r.race) : (r.raceId && typeof r.raceId === 'object' ? (r.raceId._id || r.raceId.id || r.raceId) : r.raceId),
    raceName: r.raceName || (r.race && typeof r.race === 'object' ? r.race.name : undefined) || (r.raceId && typeof r.raceId === 'object' ? r.raceId.name : undefined),
    status: r.status,
    confirmedByOwner: r.confirmedByOwner,
    createdAt: r.createdAt,
    rejectionReason: r.rejectionReason,
    ownerName: r.ownerName || r.ownerFullName || (r.horse && typeof r.horse === 'object' ? (r.horse.ownerId?.fullName || r.horse.ownerId?.name || r.horse.owner?.fullName || r.horse.owner) : undefined) || (r.horseId && typeof r.horseId === 'object' ? (r.horseId?.ownerId?.fullName || r.horseId?.ownerId?.name || r.horseId?.owner?.fullName || r.horseId?.owner) : undefined) || r.owner,
  })).reverse()
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
    createdAt: h.createdAt,
  })).reverse()
}

export async function approveHorse(horseId: string): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/admin/horses/${horseId}/approve`)
  return res.data
}

export async function rejectHorse(horseId: string, reason?: string): Promise<any> {
  const res = await http.patch(`${BE_BASE_URL}/admin/horses/${horseId}/reject`, { reason })
  return res.data
}

export async function getAdminJockeys(params?: { status?: string; page?: number; limit?: number }): Promise<Jockey[]> {
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
    createdAt: j.createdAt,
  })).reverse()
}

// --- CÔNG BỐ KẾT QUẢ ---
export async function publishRaceResult(raceId: string, results: any[]): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/admin/races/${raceId}/publish-result`, { results })
  return res.data
}

export async function getRaceResults(raceId: string): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/races/${raceId}/results`)
  return res.data
}

export async function getHorseResults(horseId: string): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/horses/me/${horseId}/results`)
  return res.data
}

// --- QUẢN LÝ DỰ ĐOÁN (PREDICTIONS) ---
export async function getAdminPredictions(params?: { status?: string; raceId?: string }): Promise<Prediction[]> {
  const res = await http.get(`${BE_BASE_URL}/admin/predictions`, { params })
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
  })).reverse()
}

export async function getPredictionStats(raceId?: string): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/admin/predictions/stats`, { params: { raceId } })
  return res.data
}

export async function closePredictions(raceId: string): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/admin/races/${raceId}/predictions/close`)
  return res.data
}

export async function settlePredictions(raceId: string): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/admin/races/${raceId}/predictions/settle`)
  return res.data
}

// ============================================================================
// 4. BỔ SUNG CÁC API THIẾU CHO TOURNAMENT, PREDICTION, REFEREE & NOTIFICATIONS
// ============================================================================

export async function getPublicRaces(params?: { status?: string; tournamentId?: string; limit?: number }): Promise<Race[]> {
  const res = await http.get(`${BE_BASE_URL}/races`, { params: { limit: 1000, ...params } })
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
    results: r.results,
    rankings: r.rankings,
    confirmedAt: r.confirmedAt,
    isLive: r.isLive,
    playbackId: r.playbackId,
    streamKey: r.streamKey,
    createdAt: r.createdAt,
  })).reverse()
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
  const rId = String(raceId).trim();
  const res = await http.get(`${BE_BASE_URL}/races/${rId}/horses`)
  const list = Array.isArray(res.data) ? res.data : (res.data.horses || res.data.data || [])
  return list.map((h: any) => {
    const rawHorseId = (h.horse && typeof h.horse === 'object') 
      ? (h.horse._id || h.horse.id) 
      : (h.horseId && typeof h.horseId === 'object' ? (h.horseId._id || h.horseId.id) : (h.horseId || h.horse || h._id || h.id));
    
    const horseId = String(rawHorseId || '').trim();
    const entryRaceId = (h.raceId && typeof h.raceId === 'object')
      ? (h.raceId._id || h.raceId.id)
      : (h.raceId || res.data.raceId || rId);

    const rawJockeyId = (h.jockey && typeof h.jockey === 'object') 
      ? (h.jockey._id || h.jockey.id) 
      : (h.jockeyId && typeof h.jockeyId === 'object' ? (h.jockeyId._id || h.jockeyId.id) : h.jockeyId);
    
    return {
      id: String(h.registrationId || h._id || h.id || '').trim(),
      _id: String(h.registrationId || h._id || h.id || '').trim(),
      registrationId: String(h.registrationId || '').trim(),
      horse: h.horse || h,
      horseId: horseId,
      raceId: String(entryRaceId || '').trim(),
      registrationStatus: h.registrationStatus || h.status || 'PENDING',
      status: h.status || h.registrationStatus || 'PENDING',
      confirmedByOwner: h.confirmedByOwner !== undefined ? h.confirmedByOwner : undefined,
      jockeyId: rawJockeyId,
      jockey: h.jockey,
      jockeyName: h.jockeyName,
    };
  })
}

export async function getRefereeRaceHorses(raceId: string): Promise<{ horses: RaceHorseRegistration[] }> {
  const res = await http.get(`${BE_BASE_URL}/referee/races/${raceId}/horses`)
  const list = Array.isArray(res.data) ? res.data : (res.data.horses || res.data.data || [])
  return {
    horses: list.map((h: any) => ({
      id: h._id || h.id,
      _id: h._id || h.id,
      horse: h.horse || h,
      horseId: h.horseId || h.horse?._id || h.horse?.id || h._id || h.id,
      raceId: h.raceId,
      registrationStatus: h.registrationStatus || h.status || 'PENDING',
      status: h.status || h.registrationStatus || 'PENDING',
      confirmedByOwner: h.confirmedByOwner ?? false,
      jockeyId: h.jockeyId,
      jockey: h.jockey,
      jockeyName: h.jockeyName,
    }))
  }
}

export async function placePrediction(raceId: string, horseId: string, betAmount: number, predictedPosition?: number): Promise<any> {
  const body: Record<string, any> = { horseId, betAmount }
  if (predictedPosition !== undefined && predictedPosition > 0) {
    body.predictedPosition = predictedPosition
  }
  const res = await http.post(`${BE_BASE_URL}/races/${raceId}/predictions`, body)
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

// ============================================================================
// 5. JOCKEY-SPECIFIC APIs
// ============================================================================

export async function acceptInvite(invId: string): Promise<void> {
  await http.patch(`${BE_BASE_URL}/jockeys/me/invitations/${invId}/accept`)
}

export async function rejectInvite(invId: string): Promise<void> {
  await http.patch(`${BE_BASE_URL}/jockeys/me/invitations/${invId}/reject`)
}

export async function getJockeyProfile(): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/jockeys/me`)
  return res.data
}

export async function updateJockeyProfile(data: {
  age?: number
  experience?: number
  bio?: string
  image?: string
  specialties?: string[]
}): Promise<any> {
  const res = await http.put(`${BE_BASE_URL}/jockeys/me`, data)
  return res.data
}

export async function getJockeyRaces(): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/jockeys/me/races`)
  return res.data
}

export async function getJockeyRaceDetail(raceId: string): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/jockeys/me/races/${raceId}`)
  return res.data
}

export async function getJockeySchedule(): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/me/schedule`)
  return res.data
}

export async function getJockeyResults(): Promise<any> {
  const res = await http.get(`${BE_BASE_URL}/jockeys/me/results`)
  return res.data
}

// ============================================================================
// 6. STREAM APIs
// ============================================================================

export async function startRaceStream(raceId: string): Promise<any> {
  const res = await http.post(`${BE_BASE_URL}/admin/races/${raceId}/stream/start`)
  return res.data
}

export async function getNotifications(): Promise<any[]> {
  const res = await http.get(`${BE_BASE_URL}/prediction/me/notifications`);
  const data = res.data;
  const list = data.notifications || data;
  return Array.isArray(list) ? list : [];
}
