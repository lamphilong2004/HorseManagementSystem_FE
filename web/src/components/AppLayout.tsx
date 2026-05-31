import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'

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

export function AppLayout() {
  const { session, logout } = useSession()
  const navigate = useNavigate()
  const role = session?.user.role ?? ''
  const navItems = roleNavItems[role] ?? [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/tournaments', label: 'Giải đấu', icon: '🏆' },
    { to: '/races', label: 'Cuộc đua', icon: '🏁' },
  ]

  return (
    <div>
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

          {/* User info + logout */}
          <div className="topbar-user">
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
