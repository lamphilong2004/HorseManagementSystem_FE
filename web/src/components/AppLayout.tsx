import { Link, NavLink, Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'
import { useEffect, useRef, useState } from 'react'
import { getMyNotifications, markNotificationRead } from '@/api'

const roleNavItems: Record<string, { to: string; label: string }[]> = {
  OWNER: [
    { to: '/app/dashboard', label: 'Dashboard' },
    { to: '/app/tournaments', label: 'Giải đấu' },
    { to: '/app/races', label: 'Cuộc đua' },
    { to: '/app/horses', label: 'Ngựa của tôi' },
  ],
  JOCKEY: [
    { to: '/app/dashboard', label: 'Dashboard' },
    { to: '/app/tournaments', label: 'Giải đấu' },
    { to: '/app/races', label: 'Cuộc đua' },
    { to: '/app/invites', label: 'Lời mời' },
    { to: '/app/jockey/races', label: 'Cuộc đua của tôi' },
    { to: '/app/jockey/schedule', label: 'Lịch thi đấu' },
    { to: '/app/jockey/results', label: 'Kết quả' },
    { to: '/app/jockey/profile', label: 'Profile' },
  ],
  SPECTATOR: [
    { to: '/app/dashboard', label: 'Dashboard' },
    { to: '/app/tournaments', label: 'Giải đấu' },
    { to: '/app/races', label: 'Cuộc đua' },
    { to: '/app/predictions', label: 'Dự đoán' },
  ],
  REFEREE: [
    { to: '/app/dashboard', label: 'Dashboard' },
    { to: '/app/tournaments', label: 'Giải đấu' },
    { to: '/app/races', label: 'Cuộc đua' },
    { to: '/app/referee/races', label: 'Trọng tài' },
  ],
  ADMIN: [
    { to: '/app/admin/scheduling', label: '⚙️ Quản lý' },
    { to: '/app/admin/users', label: '👥 Người dùng' },
    { to: '/app/tournaments', label: '🏆 Giải đấu' },
    { to: '/app/races', label: '🏁 Cuộc đua' },
  ],
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  OWNER: 'Horse Owner',
  JOCKEY: 'Jockey',
  REFEREE: 'Referee',
  SPECTATOR: 'Spectator',
}

const roleBadgeClass: Record<string, string> = {
  ADMIN: 'role-admin',
  OWNER: 'role-owner',
  JOCKEY: 'role-jockey',
  REFEREE: 'role-referee',
  SPECTATOR: 'role-spectator',
}

const avatarClass: Record<string, string> = {
  ADMIN: 'avatar-admin',
  OWNER: 'avatar-owner',
  JOCKEY: 'avatar-jockey',
  REFEREE: 'avatar-referee',
  SPECTATOR: 'avatar-spectator',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// ── Notification Bell ─────────────────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const unread = notifs.filter((n) => !n.read).length

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifs = async () => {
    try {
      setLoading(true)
      const data = await getMyNotifications()
      setNotifs(data || [])
    } catch {
      // silently fail — notifications are non-critical
    } finally {
      setLoading(false)
    }
  }

  const handleRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch { /* ignore */ }
  }

  const handleMarkAllRead = async () => {
    const unreadList = notifs.filter((n) => !n.read)
    await Promise.allSettled(unreadList.map((n) => markNotificationRead(n.id)))
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifs() }}
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          background: open ? 'var(--surface-2)' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          transition: 'background 150ms',
          color: 'var(--text)',
        }}
        title="Thông báo"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            background: '#ef4444',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid var(--bg)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown" style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          width: 360,
          maxHeight: 420,
          overflowY: 'auto',
          background: 'linear-gradient(180deg, rgba(13,22,38,0.99), rgba(10,16,30,0.99))',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 200,
          animation: 'modalIn 0.15s ease-out',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>🔔 Thông báo</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {loading && notifs.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Đang tải...</div>
          ) : notifs.length === 0 ? (
            <div style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chưa có thông báo nào</div>
            </div>
          ) : (
            <div>
              {notifs.slice(0, 15).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleRead(n.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: n.read ? 'transparent' : 'rgba(16,185,129,0.06)',
                    transition: 'background 150ms',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : 'rgba(16,185,129,0.06)' }}
                >
                  {!n.read && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 5 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    {n.title && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{n.title}</div>}
                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{n.message}</div>
                    {n.createdAt && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, opacity: 0.7 }}>
                        {new Date(n.createdAt).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── AppLayout ─────────────────────────────────────────────────────────────────
export function AppLayout() {
  const { session, logout } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const role = session?.user.role ?? ''
  const navItems = roleNavItems[role] ?? [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/tournaments', label: 'Giải đấu' },
    { to: '/races', label: 'Cuộc đua' },
  ]

  // Detect active tab for admin sidebar
  const currentTab = searchParams.get('tab') || 'dashboard'
  const isUsersPage = location.pathname.includes('/admin/users')

  return (
    <div className={`app-shell theme-${role.toLowerCase()}`}>
      {role === 'ADMIN' ? (
        <>
          {/* SideNavBar for Admin */}
          <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r border-outline-variant bg-surface/80 backdrop-blur-xl z-40" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
            <div className="p-8 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-3xl">stadium</span>
                <h1 className="text-xl font-headline font-bold tracking-tight text-primary">Glacier Admin</h1>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold" style={{ color: '#64748b' }}>Equestrian Platform</p>
            </div>
            
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
              <button
                onClick={() => navigate('/app/admin/scheduling?tab=dashboard')}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all font-body text-sm rounded-lg ${
                  !isUsersPage && currentTab === 'dashboard'
                    ? 'active-nav font-semibold'
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 font-medium'
                }`}
                style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">dashboard</span> Bảng điều khiển
              </button>

              <button
                onClick={() => navigate('/app/admin/scheduling?tab=tournaments')}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all font-body text-sm rounded-lg ${
                  !isUsersPage && currentTab === 'tournaments'
                    ? 'active-nav font-semibold'
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 font-medium'
                }`}
                style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">emoji_events</span> Giải đấu
              </button>

              <button
                onClick={() => navigate('/app/admin/scheduling?tab=registrations')}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all font-body text-sm rounded-lg ${
                  !isUsersPage && currentTab === 'registrations'
                    ? 'active-nav font-semibold'
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 font-medium'
                }`}
                style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">app_registration</span> Đăng ký đua
              </button>

              <button
                onClick={() => navigate('/app/admin/scheduling?tab=horses-jockeys')}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all font-body text-sm rounded-lg ${
                  !isUsersPage && currentTab === 'horses-jockeys'
                    ? 'active-nav font-semibold'
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 font-medium'
                }`}
                style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">pets</span> Ngựa &amp; Jockeys
              </button>

              <button
                onClick={() => navigate('/app/admin/scheduling?tab=referee-results')}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all font-body text-sm rounded-lg ${
                  !isUsersPage && currentTab === 'referee-results'
                    ? 'active-nav font-semibold'
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 font-medium'
                }`}
                style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">leaderboard</span> Trọng tài &amp; Kết quả
              </button>

              <button
                onClick={() => navigate('/app/admin/scheduling?tab=predictions')}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all font-body text-sm rounded-lg ${
                  !isUsersPage && currentTab === 'predictions'
                    ? 'active-nav font-semibold'
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 font-medium'
                }`}
                style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">analytics</span> Dự đoán (Bets)
              </button>

              <button
                onClick={() => navigate('/app/admin/users')}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all font-body text-sm rounded-lg ${
                  isUsersPage
                    ? 'active-nav font-semibold'
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 font-medium'
                }`}
                style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">group</span> Quản lý Người dùng
              </button>
            </nav>

            <div className="p-4 border-t border-outline-variant">
              <div className="space-y-1">
                <button
                  onClick={() => navigate('/app/admin/scheduling?tab=dashboard')}
                  className="w-full text-on-surface-variant hover:text-primary px-4 py-2 flex items-center gap-3 transition-all text-xs font-medium"
                  style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                >
                  <span className="material-symbols-outlined text-lg">settings</span> Cài đặt
                </button>
                <button
                  onClick={() => navigate('/app/admin/scheduling?tab=dashboard')}
                  className="w-full text-on-surface-variant hover:text-primary px-4 py-2 flex items-center gap-3 transition-all text-xs font-medium"
                  style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                >
                  <span className="material-symbols-outlined text-lg">contact_support</span> Hỗ trợ
                </button>
              </div>
            </div>
          </aside>

          {/* Top Bar for Admin */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-8 h-16 border-b border-outline-variant bg-surface/80 backdrop-blur-md">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" style={{ color: '#94a3b8' }}>search</span>
                <input
                  className="w-full border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline"
                  placeholder="Tìm kiếm giải đấu, ngựa hoặc nài..."
                  type="text"
                  style={{ color: '#0f172a', backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', paddingLeft: '40px' }}
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 pr-6 border-r border-outline-variant" style={{ borderColor: 'rgba(14, 165, 233, 0.15)' }}>
                <NotificationBell />
              </div>
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right">
                  <p className="text-sm font-bold text-on-surface leading-none group-hover:text-primary transition-colors" style={{ color: '#0f172a' }}>{session?.user.name}</p>
                  <p className="text-[10px] text-on-surface-variant mt-1 font-medium" style={{ color: '#64748b' }}>Quản trị viên cấp cao</p>
                </div>
                <div className={`avatar avatar-sm ${avatarClass[role] ?? 'avatar-default'}`} style={{ color: '#ffffff', fontWeight: 'bold' }}>
                  {getInitials(session?.user.name ?? '?')}
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  style={{ fontSize: '12px', padding: '4px 8px', color: '#64748b' }}
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </header>
        </>
      ) : (
        <div className="topbar">
          <div
            className="container"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
          >
            {/* Brand */}
            <Link to="/dashboard" className="topbar-brand" style={{ textDecoration: 'none' }}>
              <div className="topbar-brand-icon">🏇</div>
              <span>HorseRacing</span>
            </Link>

            {/* Navigation */}
            <nav className="nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* User info + notification + logout */}
            <div className="topbar-user">
              {/* Notification Bell */}
              <NotificationBell />

              <Link
                to={role === 'JOCKEY' ? '/app/jockey/profile' : '/app/dashboard'}
                className="user-badge"
                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <div className={`avatar avatar-sm ${avatarClass[role] ?? 'avatar-default'}`}>
                  {getInitials(session?.user.name ?? '?')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span className="user-badge-name" style={{ fontSize: '13px' }}>
                    {session?.user.name}
                  </span>
                  <span className={`user-badge-role ${roleBadgeClass[role] ?? ''}`}>
                    {roleLabels[role] ?? role}
                  </span>
                </div>
              </Link>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <Outlet />
      </div>

      <style>{`
        .theme-admin {
          --bg: #f8fafc;
          --bg2: #f1f5f9;
          --surface: rgba(255, 255, 255, 0.7);
          --surface-2: rgba(255, 255, 255, 0.85);
          --surface-3: #f1f5f9;
          --text: #0f172a;
          --text-2: #1e293b;
          --muted: #64748b;
          --border: rgba(14, 165, 233, 0.15);
          --border-2: rgba(14, 165, 233, 0.25);
          --primary: #0ea5e9;
          --primary-dark: #0284c7;
          --primary-light: rgba(14, 165, 233, 0.1);
          --primary-ring: rgba(14, 165, 233, 0.2);
          --accent: #a855f7;
          --accent-light: rgba(168, 85, 247, 0.1);
          color-scheme: light;
        }
        .app-shell.theme-admin {
          min-height: 100vh;
          background: #f8fafc !important;
          color: #0f172a;
          padding-left: 256px;
        }
        .theme-admin .container {
          max-width: 100% !important;
          width: 100% !important;
          padding: 32px !important;
          margin: 0 !important;
        }
        .active-nav {
          background: rgba(14, 165, 233, 0.08) !important;
          color: #0ea5e9 !important;
          border-right: 3px solid #0ea5e9 !important;
          box-shadow: inset -4px 0 0 -2px #0ea5e9;
        }
        
        /* Premium Card style updates for admin pages */
        .theme-admin .card {
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(24px) !important;
          border: 1px solid rgba(14, 165, 233, 0.12) !important;
          box-shadow: 0 10px 40px rgba(14, 165, 233, 0.04) !important;
          color: #0f172a !important;
          border-radius: 1.5rem !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-admin .card:hover {
          box-shadow: 0 20px 45px rgba(14, 165, 233, 0.07) !important;
        }
        .theme-admin .card.card-light {
          background: #ffffff !important;
          border: 1px solid rgba(14, 165, 233, 0.18) !important;
          box-shadow: 0 15px 35px rgba(14, 165, 233, 0.06) !important;
        }
        .theme-admin .stat-card {
          background: rgba(255, 255, 255, 0.9) !important;
          border: 1px solid rgba(14, 165, 233, 0.15) !important;
          box-shadow: 0 8px 24px rgba(14, 165, 233, 0.04) !important;
        }
        .theme-admin .admin-table-wrapper {
          border: 1px solid rgba(14, 165, 233, 0.12) !important;
          background: rgba(255, 255, 255, 0.5) !important;
          border-radius: 1.25rem !important;
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.02) !important;
        }
        .theme-admin .admin-table th {
          background: rgba(14, 165, 233, 0.04) !important;
          color: #475569 !important;
          border-bottom: 1px solid rgba(14, 165, 233, 0.12) !important;
          font-weight: 700 !important;
        }
        .theme-admin .admin-table td {
          color: #1e293b !important;
          border-bottom: 1px solid rgba(14, 165, 233, 0.06) !important;
          padding: 16px !important;
        }
        .theme-admin .admin-table tbody tr:hover td {
          background: rgba(14, 165, 233, 0.03) !important;
        }
        .theme-admin .tab-link {
          color: #64748b !important;
          border-bottom-color: rgba(14, 165, 233, 0.1) !important;
          font-weight: 600 !important;
          transition: all 0.2s ease;
        }
        .theme-admin .tab-link:hover {
          color: #0ea5e9 !important;
          background: rgba(14, 165, 233, 0.04) !important;
        }
        .theme-admin .tab-link.active {
          color: #0ea5e9 !important;
          border-bottom-color: #0ea5e9 !important;
          background: rgba(14, 165, 233, 0.02) !important;
        }
        
        /* Admin dialog / modal styling */
        .theme-admin .modal-content {
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(32px) !important;
          border: 1px solid rgba(14, 165, 233, 0.2) !important;
          color: #0f172a !important;
          box-shadow: 0 30px 60px rgba(14, 165, 233, 0.15) !important;
          border-radius: 2rem !important;
        }
        .theme-admin .modal-header {
          border-bottom: 1px solid rgba(14, 165, 233, 0.1) !important;
        }
        .theme-admin .modal-footer {
          border-top: 1px solid rgba(14, 165, 233, 0.1) !important;
          background: rgba(14, 165, 233, 0.03) !important;
          border-radius: 0 0 2rem 2rem !important;
        }
        .theme-admin .modal-close {
          background: rgba(14, 165, 233, 0.08) !important;
          color: #64748b !important;
        }
        .theme-admin .modal-close:hover {
          background: rgba(14, 165, 233, 0.15) !important;
          color: #0ea5e9 !important;
        }
        .theme-admin input, .theme-admin select, .theme-admin textarea {
          background: rgba(255, 255, 255, 0.8) !important;
          border: 1.5px solid rgba(14, 165, 233, 0.15) !important;
          color: #0f172a !important;
          border-radius: 12px !important;
          padding: 10px 14px !important;
          transition: all 0.2s ease;
        }
        .theme-admin input[placeholder*="Tìm kiếm"] {
          padding-left: 40px !important;
        }
        .theme-admin input:focus, .theme-admin select:focus, .theme-admin textarea:focus {
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.12) !important;
          background: #ffffff !important;
        }
        
        .theme-admin .btnPrimary {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
          border: none !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(14, 165, 233, 0.3) !important;
          border-radius: 12px !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .theme-admin .btnPrimary:hover {
          background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%) !important;
          box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4) !important;
          transform: translateY(-1.5px);
        }
        .theme-admin .btn {
          border-radius: 12px !important;
          transition: all 0.25s ease;
        }
        .theme-admin .btn:not(.btnPrimary):hover {
          background: rgba(14, 165, 233, 0.08) !important;
          border-color: rgba(14, 165, 233, 0.3) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  )
}
