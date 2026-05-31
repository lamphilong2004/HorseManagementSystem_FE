import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Role } from '../types'
import { useSession } from '../auth/SessionContext'
import axios from 'axios'

const roles: Array<{ value: Role; label: string }> = [
  { value: 'OWNER', label: 'Horse Owner' },
  { value: 'JOCKEY', label: 'Jockey' },
  { value: 'REFEREE', label: 'Race Referee' },
  { value: 'SPECTATOR', label: 'Spectator' },
  { value: 'ADMIN', label: 'Admin' },
]

export function LoginPage() {
  const { login } = useSession()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('SPECTATOR')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHero">
          <div className="authHeroContent">
            <div className="authHeroBadge">
              <span className="authHeroDot" />
              <span style={{ fontWeight: 700 }}>Tournament day ready</span>
            </div>
            <h1 style={{ margin: '14px 0 6px', color: '#f8fafc' }}>Horse Racing</h1>
            <p style={{ margin: 0, color: 'rgba(248,250,252,0.85)' }}>
              Quản lý giải đấu, lịch đua, kết quả, bảng xếp hạng và dự đoán.
            </p>
          </div>
        </div>

        <div className="authForm">
          <h2 className="authTitle">Login</h2>
          <p className="muted authSubtitle">Đăng nhập tài khoản hệ thống.</p>

          <div className="row">
            <div className="field">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '10px' }}>{error}</p> : null}

          <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btnPrimary"
              disabled={loading}
              onClick={async () => {
                setLoading(true)
                setError(null)
                try {
                  await login({ email, password, role })
                  navigate('/dashboard')
                } catch (err: any) {
                  if (axios.isAxiosError(err) && err.response) {
                    const serverMessage = err.response.data?.message;
                    if (serverMessage === 'INVALID_CREDENTIALS') {
                      setError('Thông tin đăng nhập không chính xác (Sai email hoặc mật khẩu).')
                    } else {
                      setError(err.response.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
                    }
                  } else {
                    setError('Đăng nhập thất bại. Không thể kết nối với máy chủ Backend.')
                  }
                } finally {
                  setLoading(false)
                }
              }}
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>
            <span className="muted">
              Chưa có tài khoản? <Link to="/register">Register</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}