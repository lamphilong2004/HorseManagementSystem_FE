import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'
import { 
  LayoutDashboard, 
  Trophy, 
  Target, 
  Bell, 
  Mail, 
  Scale, 
  Users, 
  Calendar, 
  LogOut, 
  Zap,
  Sparkles,
  User as UserIcon
} from 'lucide-react'

// Define nav items per role with their icons
function getRoleNav(role: string) {
  const common = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tournaments', label: 'Giải đấu', icon: Trophy },
    { to: '/races', label: 'Cuộc đua', icon: Zap },
  ]

  if (role === 'OWNER') {
    return [...common, { to: '/horses', label: 'Ngựa của tôi', icon: Sparkles }]
  }
  if (role === 'JOCKEY') {
    return [...common, { to: '/invites', label: 'Lời mời', icon: Mail }]
  }
  if (role === 'SPECTATOR') {
    return [
      ...common,
      { to: '/predictions', label: 'Dự đoán', icon: Target },
      { to: '/notifications', label: 'Thông báo', icon: Bell },
    ]
  }
  if (role === 'REFEREE') {
    return [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/referee/races', label: 'Quản lý đua', icon: Scale },
      { to: '/tournaments', label: 'Giải đấu', icon: Trophy },
      { to: '/races', label: 'Cuộc đua', icon: Zap },
    ]
  }
  if (role === 'ADMIN') {
    return [
      ...common,
      { to: '/admin/users', label: 'Tài khoản', icon: Users },
      { to: '/admin/scheduling', label: 'Lập lịch', icon: Calendar },
    ]
  }

  return common
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'Quản trị',
    OWNER: 'Chủ ngựa',
    JOCKEY: 'Nài ngựa',
    REFEREE: 'Trọng tài',
    SPECTATOR: 'Khán giả',
  }
  return map[role] || role
}

export function AppLayout() {
  const { session, logout } = useSession()
  const navigate = useNavigate()
  const role = session?.user.role ?? ''
  const navItems = getRoleNav(role)

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Sticky Premium Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-[#070b19]/90 backdrop-blur-md transition-all duration-300 shadow-lg shadow-[#03060f]/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
          
          {/* Logo */}
          <Link 
            to="/dashboard" 
            className="flex items-center gap-3 group transition-transform duration-200 active:scale-95 whitespace-nowrap"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-all duration-300">
              <span className="text-xl font-bold text-slate-950">🏇</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-black tracking-wide text-slate-100 group-hover:text-amber-400 transition-colors duration-300 uppercase">
                Horse Racing
              </span>
              <span className="text-[10px] tracking-wider text-slate-400 uppercase font-bold bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/80">
                Pro Betting Club
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 bg-slate-900/40 p-1.5 rounded-xl border border-slate-800/40">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 whitespace-nowrap
                    ${isActive 
                      ? 'bg-amber-500 text-slate-950 shadow-md border border-amber-600' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                    }
                  `}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* User profile & Actions */}
          <div className="flex items-center gap-4">
            {/* Live Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">LIVE</span>
            </div>

            {/* Profile Info */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-xl bg-slate-900/30 border border-slate-800/50">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                <UserIcon className="w-4.5 h-4.5 text-slate-300" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-200 line-clamp-1 max-w-[120px]">{session?.user.name}</span>
                <span className="text-[10px] font-semibold text-amber-500">{roleLabel(role)}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-800 bg-slate-900/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-900 bg-slate-950 px-2 py-2.5 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  flex flex-col items-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold tracking-wide transition-all duration-200
                  ${isActive ? 'text-amber-400 bg-slate-900' : 'text-slate-400 hover:text-slate-200'}
                `}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Luxury Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Horse Racing Pro Betting Club. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Liên hệ</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
