import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Role } from '../types'
import { useSession } from '../auth/SessionContext'
import axios from 'axios'
import { User, Lock, Mail, ChevronRight, UserPlus } from 'lucide-react'

const roles: Array<{ value: Role; label: string }> = [
  { value: 'OWNER', label: 'Chủ ngựa (Horse Owner)' },
  { value: 'JOCKEY', label: 'Nài ngựa (Jockey)' },
  { value: 'REFEREE', label: 'Trọng tài (Race Referee)' },
  { value: 'SPECTATOR', label: 'Khán giả (Spectator)' },
]

export function RegisterPage() {
  const { register } = useSession()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('SPECTATOR')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-[#070b19] flex items-center justify-center p-4 md:p-6 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Auth Card */}
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden border border-slate-800 bg-[#0f172a]/80 shadow-2xl flex flex-col md:flex-row min-h-[520px]">
        
        {/* Left Side: Hero Brand Banner */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-slate-900 via-amber-950/15 to-slate-900 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/60 relative overflow-hidden text-left">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />

          {/* Badge */}
          <div className="relative z-10 self-start flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/60 border border-slate-850">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[10px] font-bold text-amber-500 tracking-wider uppercase">Join the Season</span>
          </div>

          {/* App Logo & Descr */}
          <div className="relative z-10 my-12 md:my-0 flex flex-col gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <span className="text-3xl">🏇</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-100 uppercase mt-2">
              Horse Racing
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Tạo tài khoản thành viên để đặt cược dự đoán kết quả trận đua, theo dõi thống kê chi tiết ngựa chiến và đón xem kết quả trực tiếp.
            </p>
          </div>

          {/* Footer of Left Col */}
          <div className="relative z-10 text-xs text-slate-500">
            © 2026 Pro Betting System. Register to participate.
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center text-left">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wide">Đăng ký</h2>
            <p className="text-xs text-slate-400 mt-1">Tạo một tài khoản mới để tham gia vào giải đấu.</p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Name Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Họ và Tên</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  type="text"
                  placeholder="Nguyễn Văn A" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  type="email"
                  placeholder="email@example.com" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Two Column Row: Password & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mật khẩu</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    type="password"
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vai trò (Role)</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all duration-200 cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value} className="bg-slate-900 text-slate-200">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-4">
            <button
              disabled={loading}
              onClick={async () => {
                setLoading(true)
                setError(null)
                try {
                  await register({ name, email, password, role })
                  navigate('/dashboard')
                } catch (err: any) {
                  if (axios.isAxiosError(err) && err.response) {
                    const serverMessage = err.response.data?.message;
                    if (serverMessage === 'INVALID_PASSWORD_FORMAT') {
                      setError('Mật khẩu không hợp lệ (yêu cầu từ 8 ký tự trở lên).')
                    } else if (serverMessage === 'EMAIL_ALREADY_EXISTS') {
                      setError('Email này đã được đăng ký trên hệ thống.')
                    } else {
                      setError(err.response.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
                    }
                  } else {
                    setError('Đăng ký thất bại. Không thể kết nối với máy chủ Backend.')
                  }
                } finally {
                  setLoading(false)
                }
              }}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}</span>
            </button>
            
            <div className="text-xs text-slate-400 text-center">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-amber-500 hover:text-amber-400 font-bold transition-colors inline-flex items-center gap-0.5">
                Đăng nhập <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
