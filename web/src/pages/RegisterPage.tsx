import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Role } from '../types'
import { useSession } from '../auth/SessionContext'
import axios from 'axios'


export function RegisterPage() {
  const { register } = useSession()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const role: Role = 'SPECTATOR'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await register({ name, email, password, role })
      navigate('/app')
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const msg = err.response.data?.message
        setError(msg || 'Đăng ký thất bại. Vui lòng thử lại.')
      } else {
        setError('Không thể kết nối đến máy chủ. Kiểm tra Backend đang chạy chưa.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        '--color-primary': '#0ea5e9',
        '--color-secondary': '#0ea5e9',
        '--color-surface-container': '#f8fafc',
        '--color-on-surface': '#0f172a',
      } as React.CSSProperties}
    >
      <style>{`
        .glass-darker {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(14, 165, 233, 0.15);
          box-shadow: 0 20px 50px rgba(14, 165, 233, 0.08);
        }
      `}</style>

      <div className="glass-darker w-full max-w-6xl rounded-4xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        {/* Left Side Info Panel */}
        <div className="lg:col-span-4 bg-linear-to-br from-sky-600 via-sky-800 to-slate-900 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div>
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2 text-white no-underline mb-12">
              <span className="material-symbols-outlined text-3xl text-sky-300">stadium</span>
              <span className="font-headline font-bold text-xl tracking-tight">Equestrian Elite</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 mb-6">
              <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-200">Hệ Thống Trực Tuyến</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight leading-tight mb-4">
              Bắt đầu <br />
              hành trình! 🏆
            </h1>

            <p className="text-sky-100/80 font-medium text-sm leading-relaxed mb-8">
              Tạo tài khoản để quản lý chiến mã, tham gia giải đấu và theo dõi kết quả trực tiếp.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: 'pets', text: 'Quản lý chiến mã và jockey' },
              { icon: 'sports_score', text: 'Theo dõi kết quả real-time' },
              { icon: 'military_tech', text: 'Tham gia giải đấu danh giá' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="material-symbols-outlined text-sky-300 text-lg">{item.icon}</span>
                <span className="text-xs font-semibold text-sky-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Form Panel */}
        <div className="lg:col-span-8 bg-white p-10 md:p-14 flex flex-col justify-center" style={{ backgroundColor: '#ffffff' }}>
          <div className="mb-8">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>Tạo Tài Khoản</h2>
            <p className="text-slate-500 text-base font-medium" style={{ color: '#64748b' }}>Điền thông tin của bạn để tiếp tục</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Họ và tên */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ color: '#475569' }}>
                Họ Và Tên
              </span>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex h-14 w-14 items-center justify-center text-slate-500 border-r border-slate-200 bg-slate-50" style={{ color: '#94a3b8' }}>
                  <span className="material-symbols-outlined text-lg">person</span>
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="flex-1 min-w-0 px-4 py-4 text-base font-normal text-slate-900 focus:outline-none"
                  style={{
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ color: '#475569' }}>
                Email
              </span>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex h-14 w-14 items-center justify-center text-slate-500 border-r border-slate-200 bg-slate-50" style={{ color: '#94a3b8' }}>
                  <span className="material-symbols-outlined text-lg">mail</span>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="flex-1 min-w-0 px-4 py-4 text-base font-normal text-slate-900 focus:outline-none"
                  style={{
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ color: '#475569' }}>
                Mật Khẩu
              </span>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex h-14 w-14 items-center justify-center text-slate-500 border-r border-slate-200 bg-slate-50" style={{ color: '#94a3b8' }}>
                  <span className="material-symbols-outlined text-lg">lock</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 min-w-0 px-4 py-4 text-base font-normal text-slate-900 focus:outline-none"
                  style={{
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-14 w-14 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                  style={{ background: 'transparent', border: 'none' }}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>


            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white rounded-2xl font-semibold transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed mb-4"
                style={{
                  color: '#ffffff',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Tạo Tài Khoản</span>
                    <span className="material-symbols-outlined text-lg">person_add</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-sm font-semibold text-slate-500 mt-6" style={{ color: '#64748b' }}>
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-sky-500 hover:text-sky-600 no-underline font-bold transition-colors">Đăng nhập ngay →</Link>
          </p>

          <div className="text-center mt-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 no-underline font-medium transition-colors" style={{ color: '#94a3b8' }}>
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
