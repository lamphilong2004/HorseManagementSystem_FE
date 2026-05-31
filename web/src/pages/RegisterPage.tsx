import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Role } from '../types'
import { useSession } from '../auth/SessionContext'
import axios from 'axios'

const roleOptions: Array<{ value: Role; label: string; icon: string; desc: string }> = [
  { value: 'OWNER',    label: 'Horse Owner',    icon: '👑', desc: 'Quản lý ngựa & tuyển jockey' },
  { value: 'JOCKEY',   label: 'Jockey',          icon: '🏇', desc: 'Cưỡi ngựa thi đấu chuyên nghiệp' },
  { value: 'REFEREE',  label: 'Race Referee',    icon: '⚖️', desc: 'Giám sát và xác nhận kết quả' },
  { value: 'SPECTATOR',label: 'Spectator',       icon: '🔮', desc: 'Xem & đặt cược dự đoán' },
]

export function RegisterPage() {
  const { register } = useSession()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('SPECTATOR')
  const [showPass, setShowPass] = useState(false)
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
        if (msg === 'INVALID_PASSWORD_FORMAT') {
          setError('Mật khẩu không hợp lệ (yêu cầu từ 8 ký tự trở lên).')
        } else if (msg === 'EMAIL_ALREADY_EXISTS') {
          setError('Email này đã được đăng ký trên hệ thống.')
        } else {
          setError(msg || 'Đăng ký thất bại. Vui lòng thử lại.')
        }
      } else {
        setError('Không thể kết nối đến máy chủ. Kiểm tra Backend đang chạy chưa.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #071a12 0%, #0a1628 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '-200px', right: '30%', width: '800px', height: '600px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(5,150,105,0.12), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-100px', left: '10%', width: '500px', height: '400px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(59,130,246,0.08), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: 960,
        display: 'grid', gridTemplateColumns: '0.9fr 1.1fr',
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 40px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)',
        position: 'relative',
      }}>

        {/* ── Left side: Form ── */}
        <div style={{ padding: '48px 40px', background: 'white', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Tạo tài khoản</h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Tham gia giải đấu đua ngựa chuyên nghiệp</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Họ và tên</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s, box-shadow 0.15s', fontFamily: 'inherit' }}
                onFocus={(e) => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.15)' }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s, box-shadow 0.15s', fontFamily: 'inherit' }}
                onFocus={(e) => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.15)' }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Từ 8 ký tự trở lên"
                  style={{ width: '100%', padding: '10px 42px 10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s, box-shadow 0.15s', fontFamily: 'inherit' }}
                  onFocus={(e) => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.15)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8', padding: 0 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Bạn là ai?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {roleOptions.map((r) => (
                  <label key={r.value} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    border: `1.5px solid ${role === r.value ? '#059669' : '#e2e8f0'}`,
                    borderRadius: 10, cursor: 'pointer',
                    background: role === r.value ? '#f0fdf4' : 'white',
                    transition: 'all 0.15s',
                  }}>
                    <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} style={{ display: 'none' }} />
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: role === r.value ? '#065f46' : '#0f172a' }}>{r.label}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 700,
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #059669, #047857)',
                border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(5,150,105,0.35)',
                transition: 'all 0.2s', fontFamily: 'inherit', marginTop: 4,
              }}
            >
              {loading ? '⏳ Đang đăng ký...' : '🚀 Tạo tài khoản'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: '#059669', fontWeight: 700, textDecoration: 'none' }}>Đăng nhập →</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13 }}>
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>← Về trang chủ</Link>
          </p>
        </div>

        {/* ── Right side: Hero ── */}
        <div style={{
          background: 'linear-gradient(145deg, #064e3b 0%, #0a1628 100%)',
          padding: '48px 40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: 300, height: 300, borderRadius: '50%', background: 'rgba(5,150,105,0.12)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: 240, height: 240, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '-0.02em' }}>HorseRacing</span>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#059669,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏇</div>
            </Link>
          </div>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(5,150,105,0.4)', marginBottom: 20 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Join the Season</span>
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-0.03em', margin: '0 0 14px' }}>
              Bắt đầu hành trình<br />vô địch của bạn
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>
              Tham gia cộng đồng đua ngựa chuyên nghiệp. Quản lý, thi đấu và theo dõi giải đấu một cách dễ dàng.
            </p>
          </div>

          {/* Testimonial / Highlight */}
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.06)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>🌟🌟🌟🌟🌟</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '0 0 12px', fontStyle: 'italic', lineHeight: 1.5 }}>
              "Nền tảng tuyệt vời nhất để quản lý ngựa đua và tìm kiếm jockey tài năng cho các giải đấu lớn."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 700 }}>HO</div>
              <div style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>Cộng đồng Horse Owner</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          div[style*="grid-template-columns: 0.9fr 1.1fr"] {
            display: flex !important;
            flex-direction: column-reverse;
          }
        }
      `}</style>
    </div>
  )
}
