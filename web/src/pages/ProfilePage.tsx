import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'
import { ShieldCheck, Wallet, Mail, BadgeInfo, ArrowRight, LogOut, UserCircle2, KeyRound, Eye, EyeOff } from 'lucide-react'
import { changePassword, getCurrentUserProfile } from '../api'

function roleLabel(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    OWNER: 'Chủ ngựa',
    JOCKEY: 'Nài ngựa',
    REFEREE: 'Trọng tài',
    SPECTATOR: 'Khán giả',
  }
  return map[role] || role
}

function roleAccent(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'from-red-500/20 via-rose-500/10 to-transparent text-red-300 border-red-500/30'
    case 'OWNER':
      return 'from-amber-500/20 via-orange-500/10 to-transparent text-amber-300 border-amber-500/30'
    case 'JOCKEY':
      return 'from-blue-500/20 via-cyan-500/10 to-transparent text-blue-300 border-blue-500/30'
    case 'REFEREE':
      return 'from-emerald-500/20 via-teal-500/10 to-transparent text-emerald-300 border-emerald-500/30'
    default:
      return 'from-cyan-500/20 via-sky-500/10 to-transparent text-cyan-300 border-cyan-500/30'
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
}

function isJwtExpired(token?: string) {
  if (!token) return true
  const parts = token.split('.')
  if (parts.length !== 3) return false

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? Date.now() >= payload.exp * 1000 : false
  } catch {
    return false
  }
}

export function ProfilePage() {
  const { session, balance, logout } = useSession()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [changeOpen, setChangeOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    let active = true

    if (isJwtExpired(session?.token)) {
      setLoading(false)
      setProfile(null)
      setSyncError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')
      return () => {
        active = false
      }
    }

    setLoading(true)
    getCurrentUserProfile()
      .then((data) => {
        if (!active) return
        setProfile(data)
        setSyncError(null)
      })
      .catch((fetchError) => {
        if (!active) return
        const message = fetchError?.response?.data?.message || ''
        setSyncError(message || 'Không thể tải hồ sơ từ API')
        setProfile(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const user = useMemo(() => {
    const apiUser = profile || {}
    return {
      id: apiUser.userId || apiUser.id || session?.user.id || '—',
      name: apiUser.fullName || apiUser.name || session?.user.name || '—',
      email: apiUser.email || session?.user.email || '—',
      role: apiUser.role || session?.user.role || '',
    }
  }, [profile, session])

  const role = user.role || ''

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() || '')
    .join('') || 'U'

  const accent = roleAccent(role)

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không khớp.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
      return
    }

    setChangingPassword(true)
    setPasswordMessage(null)
    try {
      await changePassword({
        oldPassword: currentPassword,
        newPassword,
      })
      setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setChangeOpen(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Không thể đổi mật khẩu.'
      setPasswordMessage({ type: 'error', text: msg })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.4),rgba(2,6,23,0.85))] p-4 md:p-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[42px_42px] opacity-40" />
      <div className="absolute inset-x-16 top-0 h-56 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-8 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative mx-auto mt-4 flex w-full max-w-4xl justify-center">
        <section className="w-full rounded-[28px] border border-white/10 bg-slate-950/60 p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl md:p-8">
          <div className="absolute inset-0 rounded-[28px] bg-linear-to-b from-white/4 via-transparent to-transparent" />

          <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col items-center rounded-[24px] border border-white/10 bg-white/5 p-6 text-center">
              <div className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full border border-white/15 bg-linear-to-br from-cyan-500/20 via-slate-900/60 to-blue-500/20 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-slate-950/70">
                  <span className="text-3xl font-black tracking-widest text-cyan-300">{initials}</span>
                </div>
              </div>

              <h1 className="bg-linear-to-r from-slate-100 via-slate-50 to-cyan-300 bg-clip-text text-3xl font-black tracking-wide text-transparent">
                {user.name}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-300/80">{roleLabel(role)}</p>

              <div className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${accent}`}>
                <ShieldCheck className="h-4 w-4" />
                Tài khoản đang hoạt động
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-200 transition-all hover:border-cyan-300/40 hover:bg-cyan-500/20">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Vào Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200 transition-all hover:border-red-400/40 hover:bg-red-500/20"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Đăng xuất
                </button>
              </div>
            </div>

            <div className="relative rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(15,23,42,0.8))] p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-300/80">Profile Vault</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-100">Thông tin người dùng</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300/75">
                    Đây là hồ sơ hiển thị theo tài khoản đăng nhập. Dữ liệu ưu tiên từ <span className="font-bold text-cyan-200">GET /auth/me</span>, còn số dư vẫn lấy từ session cục bộ.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-300">
                  <UserCircle2 className="h-6 w-6" />
                </div>
              </div>

                {loading && (
                  <div className="mb-4 rounded-2xl border border-cyan-400/15 bg-cyan-500/5 px-4 py-3 text-sm font-bold text-cyan-100">
                    Đang tải hồ sơ từ API...
                  </div>
                )}

                {syncError && !profile && (
                  <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-100">
                      {syncError}
                  </div>
                )}

                {passwordMessage && (
                  <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-bold ${passwordMessage.type === 'success' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100' : 'border-red-400/20 bg-red-500/10 text-red-100'}`}>
                    {passwordMessage.text}
                  </div>
                )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    <BadgeInfo className="h-4 w-4 text-cyan-300" />
                    ID người dùng
                  </div>
                  <div className="mt-3 break-all text-sm font-black text-slate-100">{user.id}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    <Mail className="h-4 w-4 text-cyan-300" />
                    Email
                  </div>
                  <div className="mt-3 break-all text-sm font-black text-slate-100">{user.email || '—'}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-cyan-300" />
                    Vai trò
                  </div>
                  <div className="mt-3 text-sm font-black text-slate-100">{roleLabel(role)}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    <Wallet className="h-4 w-4 text-cyan-300" />
                    Số dư hiện tại
                  </div>
                  <div className="mt-3 text-sm font-black text-emerald-300">{formatMoney(balance)}</div>
                </div>
              </div>

              {/* <div className="mt-5 rounded-2xl border border-cyan-400/15 bg-cyan-500/5 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-200/80">Ghi chú</p>
                <p className="mt-2 text-sm leading-6 text-slate-300/80">
                  Trang này đã ưu tiên đồng bộ hồ sơ từ backend bằng <span className="font-bold text-cyan-200">GET /auth/me</span>.
                </p>
              </div> */}

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-200/80">Bảo mật</p>
                    <h3 className="mt-1 text-lg font-black text-slate-100">Đổi mật khẩu</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChangeOpen((value) => !value)}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-200 transition-all hover:border-cyan-300/40 hover:bg-cyan-500/20"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    {changeOpen ? 'Ẩn form' : 'Mở form'}
                  </button>
                </div>

                {changeOpen && (
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-2">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-400">Mật khẩu hiện tại</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 pr-11 text-sm font-semibold text-slate-100 outline-none focus:border-cyan-400/40"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((value) => !value)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-400">Mật khẩu mới</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 pr-11 text-sm font-semibold text-slate-100 outline-none focus:border-cyan-400/40"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((value) => !value)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-400">Xác nhận mật khẩu</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 pr-11 text-sm font-semibold text-slate-100 outline-none focus:border-cyan-400/40"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((value) => !value)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={changingPassword || isJwtExpired(session?.token)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-100 transition-all hover:border-amber-300/40 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <KeyRound className="h-4 w-4" />
                      {isJwtExpired(session?.token) ? 'Phiên đăng nhập hết hạn' : changingPassword ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}