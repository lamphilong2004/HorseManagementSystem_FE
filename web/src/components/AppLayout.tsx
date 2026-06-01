import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
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
        <div style={{
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
  const role = session?.user.role ?? ''
  const navItems = roleNavItems[role] ?? [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/tournaments', label: 'Giải đấu' },
    { to: '/races', label: 'Cuộc đua' },
  ]

  return (
    <div className={`app-shell theme-${role.toLowerCase()}`}>
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

            <div className="user-badge">
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
            </div>
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

      <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <Outlet />
      </div>
    </div>
  )
}
