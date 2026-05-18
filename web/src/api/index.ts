import { http } from './http'
import type { Invite, Prediction, Race, Role, Session, Tournament, Horse } from '../types'

// Khai báo Base URL cho Backend Node.js thực tế
const BE_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// ============================================================================
// 1. CÁC API THỰC TẾ ĐÃ KẾT NỐI VỚI NODE.JS BACKEND
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
  // 1. Đăng ký tài khoản mới trên Backend
  await http.post(`${BE_BASE_URL}/auth/register`, {
    email: params.email,
    password: params.password,
    fullName: params.name,
    role: params.role,
  })
  
  // 2. Tự động đăng nhập sau khi đăng ký để trả về Session
  return login({
    email: params.email,
    password: params.password,
    role: params.role,
  })
}

export async function getHorses(): Promise<Horse[]> {
  // Gọi API lấy danh sách ngựa của tôi (Chỉ dành cho OWNER)
  const res = await http.get(`${BE_BASE_URL}/horses/me`)
  // Map dữ liệu từ MongoDB Mongoose sang kiểu dữ liệu Horse của Frontend
  return res.data.map((h: any) => ({
    id: h._id,
    name: h.name,
    ownerId: h.ownerId,
  })) as Horse[]
}

// ============================================================================
// 2. CÁC API GIẢ LẬP MOCK (MSW INTERCEPTED) - DÀNH CHO CÁC CHỨC NĂNG CHƯA CÓ TRÊN BE
// ============================================================================

export async function getTournaments(): Promise<Tournament[]> {
  const res = await http.get('/api/tournaments')
  return res.data as Tournament[]
}

export async function getTournament(id: string): Promise<Tournament> {
  const res = await http.get(`/api/tournaments/${id}`)
  return res.data as Tournament
}

export async function getRaces(): Promise<Race[]> {
  const res = await http.get('/api/races')
  return res.data as Race[]
}

export async function getRace(id: string): Promise<Race> {
  const res = await http.get(`/api/races/${id}`)
  return res.data as Race
}

export async function getInvites(): Promise<Invite[]> {
  const res = await http.get('/api/invites')
  return res.data as Invite[]
}

export async function getPredictions(): Promise<Prediction[]> {
  const res = await http.get('/api/predictions')
  return res.data as Prediction[]
}

export async function getAdminUsers(): Promise<Array<{ id: string; name: string; role: Role }>> {
  const res = await http.get('/api/admin/users')
  return res.data as Array<{ id: string; name: string; role: Role }>
}

export async function getRefereeRaces(): Promise<Race[]> {
  const res = await http.get('/api/referee/races')
  return res.data as Race[]
}
