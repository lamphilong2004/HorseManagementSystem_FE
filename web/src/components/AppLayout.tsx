import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'
import { motion, AnimatePresence } from 'motion/react'
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
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  ClipboardList,
  Tv2
} from 'lucide-react'
import { useState as useStateReact, useEffect as useEffectReact } from 'react'
import { getPublicRaces } from '@/api'

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const StarParticle = ({ style }: { style: React.CSSProperties }) => (
  <div
    style={{
      position: "absolute",
      width: 2,
      height: 2,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.8)",
      ...style,
    }}
  />
)

interface NavItem {
  to: string
  label: string
  icon: any
  children?: { to: string; label: string; icon?: any }[]
}

// Define nav items per role with their icons
function getRoleNav(role: string): NavItem[] {
  const common: NavItem[] = [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/tournaments', label: 'Giải đấu', icon: Trophy },
    { to: '/app/races', label: 'Cuộc đua', icon: Zap },
    { to: '/app/livestream', label: 'Livestream', icon: Tv2 },
  ]

  if (role === 'OWNER') {
    return [...common, { to: '/app/horses', label: 'Ngựa của tôi', icon: Sparkles }]
  }
  if (role === 'JOCKEY') {
    return [
      ...common,
      { to: '/app/invites', label: 'Lời mời', icon: Mail },
      { to: '/app/jockey/schedule', label: 'Lịch thi đấu', icon: Calendar },
      { to: '/app/jockey/results', label: 'Kết quả', icon: Trophy },
    ]
  }
  if (role === 'SPECTATOR') {
    return [
      ...common,
      { to: '/app/predictions', label: 'Dự đoán', icon: Target },
      { to: '/app/notifications', label: 'Thông báo', icon: Bell },
    ]
  }
  if (role === 'REFEREE') {
    return [
      ...common,
      { to: '/app/referee/races', label: 'Quản lý đua', icon: Scale },
    ]
  }
  if (role === 'ADMIN') {
    return [
      ...common,
      { to: '/app/admin/users', label: 'Tài khoản', icon: Users },
      {
        to: '/app/admin/scheduling',
        label: 'Quản lý',
        icon: Calendar,
        children: [
          { to: '/app/admin/scheduling/tournaments', label: 'Giải Đấu & Lịch Trình', icon: Trophy },
          { to: '/app/admin/scheduling/registrations', label: 'Duyệt Đăng Ký Đua', icon: ClipboardList },
          { to: '/app/admin/scheduling/horses-jockeys', label: 'Ngựa & Jockeys', icon: Sparkles },
          { to: '/app/admin/scheduling/referee-results', label: 'Trọng Tài & Kết Quả', icon: Scale },
          { to: '/app/admin/scheduling/predictions', label: 'Thống kê dự đoán', icon: Target }
        ]
      },
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
  const { session, logout, balance } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const actualRole = session?.user.role ?? ''

  // Live race count badge
  const [liveRaceCount, setLiveRaceCount] = useStateReact(0)
  useEffectReact(() => {
    getPublicRaces()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.races || data?.data || [])
        const count = list.filter((r: any) => ['ONGOING', 'LIVE'].includes(r.status || '')).length
        setLiveRaceCount(count)
      })
      .catch(() => {})
    const interval = setInterval(() => {
      getPublicRaces()
        .then((data: any) => {
          const list = Array.isArray(data) ? data : (data?.races || data?.data || [])
          const count = list.filter((r: any) => ['ONGOING', 'LIVE'].includes(r.status || '')).length
          setLiveRaceCount(count)
        })
        .catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Admin can "view as" another role (Spectator / Referee). Persist choice in localStorage.
  const [adminViewAs, setAdminViewAs] = useState<string | null>(() => {
    try {
      return localStorage.getItem('admin_view_as')
    } catch {
      return null
    }
  })

  const effectiveRole = actualRole === 'ADMIN' && adminViewAs ? adminViewAs : actualRole
  const navItems = getRoleNav(effectiveRole)
  const profileActive = location.pathname.startsWith('/app/jockey/profile')

  // Sidebar open state (unified for all screen sizes)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-open')
    return saved === null ? true : saved === 'true'
  })

  const [isSchedulingOpen, setIsSchedulingOpen] = useState(() => {
    return location.pathname.startsWith('/app/admin/scheduling')
  })

  // Open scheduling dropdown automatically when navigating to any scheduling subpage
  useEffect(() => {
    if (location.pathname.startsWith('/app/admin/scheduling')) {
      setIsSchedulingOpen(true)
    }
  }, [location.pathname])

  // Loading simulation for tab transition
  const [isLoading, setIsLoading] = useState(false)

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true
  })
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-open', String(isSidebarOpen))
  }, [isSidebarOpen])

  // Close mobile sidebar on route change
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }, [location.pathname])

  // Route guard: restrict only routes that involve placing bets/predictions to SPECTATOR.
  // Public pages like /tournaments and /races are readable by all roles.
  useEffect(() => {
    const path = location.pathname

    const isPredictionPath = path === '/app/predictions' || path.startsWith('/app/predictions/')
    const isRefereePath = path.startsWith('/app/referee')

    // Predictions (bet) pages are spectator-only
    if (isPredictionPath && effectiveRole !== 'SPECTATOR') {
      navigate('/app/dashboard', { replace: true })
      return
    }

    // Referee pages remain referee-only (unless admin view-as REFEREE)
    if (isRefereePath && effectiveRole !== 'REFEREE') {
      navigate('/app/dashboard', { replace: true })
      return
    }
  }, [location.pathname, effectiveRole, navigate])

  // Loading effect on route change
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 350)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const toggleTheme = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setTimeout(() => {
      setIsDark((prev) => !prev)
      setIsAnimating(false)
    }, 300)
  }

  const trackBg = isDark
    ? "linear-gradient(90deg, #1a1a2e, #16213e)"
    : "linear-gradient(90deg, #87ceeb, #fddb92)"

  const thumbBg = isDark
    ? "radial-gradient(circle at 30% 30%, #e0e0e0, #9e9e9e)"
    : "radial-gradient(circle at 30% 30%, #fff7a1, #f6c90e)"

  const thumbShadow = isDark
    ? "0 0 8px 2px rgba(180,180,255,0.4), 1px 1px 4px rgba(0,0,0,0.5)"
    : "0 0 10px 3px rgba(255,220,50,0.5), 1px 1px 4px rgba(0,0,0,0.2)"

  const stars = [
    { top: "18%", left: "12%", animDelay: "0s" },
    { top: "30%", left: "22%", animDelay: "0.3s" },
    { top: "60%", left: "15%", animDelay: "0.6s" },
    { top: "70%", left: "28%", animDelay: "0.9s" },
  ]

  const clouds = [
    { top: "22%", right: "14%", width: 16, height: 8 },
    { top: "55%", right: "20%", width: 12, height: 6 },
  ]

  // Find current active nav index
  const activeIndex = navItems.findIndex(item => location.pathname.startsWith(item.to))

  const sidebarWidth = isSidebarOpen ? 250 : 0

  return (
    <div className="h-screen bg-transparent text-(--text) flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200 overflow-hidden">
      {/* Sticky Premium Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-(--surface)/90 backdrop-blur-md transition-all duration-300 shadow-sm shrink-0">
        <div className="w-full px-4 h-14 flex items-center justify-between gap-4">

          {/* Left: Mobile menu + Logo */}
          <div className="flex items-center gap-3">
            {/* Menu toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-(--bg2)/40 hover:bg-(--surface-strong)/50 transition-all duration-200 cursor-pointer text-(--text)"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>

            {/* Logo */}
            <Link
              to="/app/dashboard"
              className="flex items-center gap-2.5 group transition-transform duration-200 active:scale-95 whitespace-nowrap"
            >
              <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-sky-600 to-sky-400 flex items-center justify-center shadow-md shadow-sky-500/10 group-hover:scale-105 transition-all duration-300">
                <span className="material-symbols-outlined text-white text-lg" data-icon="stadium">stadium</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-black tracking-wide text-(--text) group-hover:text-sky-500 transition-colors duration-300 uppercase">
                  Equestrian
                </span>
                <span className="text-[8px] tracking-wider text-sky-600 uppercase font-bold bg-(--bg2) px-1.5 py-0.5 rounded border border-sky-500/20">
                  Elite
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5">
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-500 tracking-wider uppercase">TRỰC TIẾP</span>
            </div>

            {/* Profile Info */}
            <button
              type="button"
              onClick={() => actualRole === 'JOCKEY' && navigate('/app/jockey/profile')}
              className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-(--bg2) border border-border hover:bg-(--surface-strong)/50 transition-all duration-200 ${actualRole === 'JOCKEY' ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="w-6 h-6 rounded-md bg-(--surface-strong) flex items-center justify-center border border-border">
                <UserIcon className="w-3.5 h-3.5 text-muted" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-(--text) line-clamp-1 max-w-22.5">{session?.user.name}</span>
                <span className="text-[9px] font-semibold text-amber-500">{roleLabel(actualRole)}</span>
              </div>
            </button>

            {/* Admin "view as" selector: allow admins to view app as other roles */}
            {actualRole === 'ADMIN' && (
              <div className="hidden md:flex items-center ml-2">
                <label className="text-[10px] mr-2 text-muted">Xem như</label>
                <select
                  value={adminViewAs ?? ''}
                  onChange={(e) => {
                    const v = e.target.value || null
                    try {
                      if (v) localStorage.setItem('admin_view_as', v)
                      else localStorage.removeItem('admin_view_as')
                    } catch { }
                    setAdminViewAs(v)
                    // Go to dashboard to avoid landing on restricted pages unexpectedly
                    navigate('/app/dashboard')
                  }}
                  className="h-9 px-2 rounded-lg border border-border bg-(--bg2) text-[12px] text-(--text)"
                >
                  <option value="">Chính</option>
                  <option value="SPECTATOR">Khán giả</option>
                  <option value="REFEREE">Trọng tài</option>
                </select>
              </div>
            )}

            {/* Account Balance */}
            {actualRole === 'SPECTATOR' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 shadow-sm transition-all duration-300">
                <span className="text-xs font-black text-amber-500">💰</span>
                <span className="text-xs font-black text-(--text)">
                  {new Intl.NumberFormat('vi-VN').format(balance)} VND
                </span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="relative border-0 cursor-pointer overflow-hidden p-0 shrink-0 transition-all duration-500 ease-in-out active:scale-95"
              style={{
                width: 54,
                height: 26,
                borderRadius: 13,
                background: trackBg,
                boxShadow: isDark
                  ? "0 0 0 1.5px #4a4a8a, 0 2px 8px rgba(80,60,160,0.3), inset 0 1px 2px rgba(0,0,0,0.4)"
                  : "0 0 0 1.5px #f7b733, 0 2px 8px rgba(246,180,30,0.2), inset 0 1px 2px rgba(255,255,255,0.3)",
              }}
            >
              {isDark &&
                stars.map((s, i) => (
                  <StarParticle
                    key={i}
                    style={{
                      top: s.top,
                      left: s.left,
                      opacity: isDark ? 1 : 0,
                      transition: `opacity 0.4s ${s.animDelay}`,
                    }}
                  />
                ))}
              {!isDark &&
                clouds.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      top: c.top,
                      right: c.right,
                      width: c.width,
                      height: c.height,
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.75)",
                      filter: "blur(1px)",
                    }}
                  />
                ))}
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: isDark ? "28px" : "2px",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: thumbBg,
                  boxShadow: thumbShadow,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "left 0.4s cubic-bezier(0.34,1.56,0.64,1), background 0.5s, box-shadow 0.5s",
                  color: isDark ? "#aaa" : "#e65c00",
                  transform: isAnimating ? "scale(0.88) rotate(20deg)" : "scale(1) rotate(0deg)",
                }}
              >
                {isDark ? <MoonIcon /> : <SunIcon />}
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border bg-(--bg2) hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 active:scale-95 transition-all duration-300 cursor-pointer text-(--text)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>

        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Mobile Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:relative top-14 lg:top-0 left-0 z-40 
            h-[calc(100vh-3.5rem)] lg:h-full flex flex-col
            border-r border-border bg-(--surface) 
            transition-all duration-300 ease-in-out shrink-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${!isSidebarOpen ? 'lg:border-r-0' : ''}
          `}
          style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            overflow: 'hidden'
          }}
        >

          {/* Sidebar Navigation */}
          <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
            {/* Section Label */}
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="px-3 pt-0 pb-2"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-300">
                    Điều hướng
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {navItems.map((item, index) => {
              const Icon = item.icon
              const hasChildren = !!item.children
              const isActive = hasChildren
                ? location.pathname.startsWith(item.to)
                : activeIndex === index

              return (
                <div key={item.to} className="flex flex-col">
                  <NavLink
                    to={item.to}
                    onClick={() => {
                      if (hasChildren) {
                        setIsSchedulingOpen(prev => !prev)
                      }
                    }}
                    className="relative block"
                    style={{ textDecoration: 'none' }}
                  >
                    {/* Active Background Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-bg"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.08))',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          boxShadow: '0 0 20px rgba(245, 158, 11, 0.05)',
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Active Left Accent Bar */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-bar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 rounded-full"
                        style={{
                          height: '60%',
                          background: 'linear-gradient(180deg, #f59e0b, #d97706)',
                          boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)',
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}

                    <div
                      className={`
                        relative flex items-center justify-between px-3 py-2.5 rounded-xl
                        transition-all duration-200 group
                        ${isActive
                          ? 'text-amber-500 font-bold'
                          : 'text-(--muted) hover:text-(--text) hover:bg-amber-500/5'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3" style={{ justifyContent: 'flex-start' }}>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="shrink-0"
                        >
                          {item.label === 'Giải đấu' || item.label === 'Kết quả' ? (
                            <img
                              src="/trophy.gif"
                              className="w-5 h-5 object-contain"
                              alt={item.label}
                            />
                          ) : item.label === 'Cuộc đua' || item.label === 'Cuộc đua của tôi' ? (
                            <img
                              src="/race.gif"
                              className="w-5 h-5 object-contain"
                              alt={item.label}
                            />
                          ) : item.label === 'Dự đoán' ? (
                            <img
                              src="/prediction.gif"
                              className="w-5 h-5 object-contain"
                              alt={item.label}
                            />
                          ) : item.label === 'Livestream' ? (
                            <div className="relative">
                              <Tv2 className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]' : 'text-red-400'}`} />
                              {liveRaceCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                                </span>
                              )}
                            </div>
                          ) : (
                            <Icon
                              className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]' : ''
                                }`}
                            />
                          )}
                        </motion.div>

                        <AnimatePresence>
                          {isSidebarOpen && (
                            <motion.span
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -8 }}
                              transition={{ duration: 0.15 }}
                              className={`text-[13px] font-semibold tracking-wide whitespace-nowrap ${isActive ? 'font-bold' : ''
                                }`}
                            >
                              {item.label}
                              {item.label === 'Livestream' && liveRaceCount > 0 && (
                                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white leading-none">
                                  {liveRaceCount}
                                </span>
                              )}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Dropdown Chevron toggle */}
                      {hasChildren && isSidebarOpen && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsSchedulingOpen(prev => !prev)
                          }}
                          className="p-1 rounded-md hover:bg-amber-500/10 transition-colors text-muted hover:text-(--text) cursor-pointer flex items-center justify-center border-0 bg-transparent"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${isSchedulingOpen ? 'rotate-180' : 'rotate-0'
                              }`}
                          />
                        </button>
                      )}
                    </div>
                  </NavLink>

                  {/* Children Sub-Routes List */}
                  {hasChildren && item.children && (
                    <AnimatePresence initial={false}>
                      {isSchedulingOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-4 border-l border-border/60 ml-5 space-y-1 mt-1 flex flex-col"
                        >
                          {item.children.map((child) => {
                            const isChildActive = location.pathname === child.to
                            const ChildIcon = child.icon
                            return (
                              <NavLink
                                key={child.to}
                                to={child.to}
                                className={`
                                  flex items-center gap-2 py-2 px-3 rounded-lg text-[12px] font-semibold transition-all duration-200
                                  ${isChildActive
                                    ? 'text-amber-500 font-bold bg-amber-500/8'
                                    : 'text-(--muted) hover:text-(--text) hover:bg-amber-500/4'
                                  }
                                `}
                                style={{ textDecoration: 'none' }}
                              >
                                {ChildIcon && <ChildIcon className="w-3.5 h-3.5 shrink-0" />}
                                <span>{child.label}</span>
                              </NavLink>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              )
            })}

          </nav>

          {/* Sidebar Footer - User Info */}
          <div className="p-2 border-t border-border shrink-0">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-linear-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                <UserIcon className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex flex-col min-w-0"
                  >
                    <span className="text-[11px] font-bold text-(--text) truncate">{session?.user.name}</span>
                    <span className="text-[9px] font-semibold text-amber-500">{roleLabel(actualRole)}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {actualRole === 'JOCKEY' && (
              <NavLink
                to="/app/jockey/profile"
                className="relative block mt-2"
                style={{ textDecoration: 'none' }}
              >
                {profileActive && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.08))',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      boxShadow: '0 0 20px rgba(245, 158, 11, 0.05)',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                {profileActive && (
                  <motion.div
                    layoutId="sidebar-active-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 rounded-full"
                    style={{
                      height: '60%',
                      background: 'linear-gradient(180deg, #f59e0b, #d97706)',
                      boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <div
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${profileActive
                      ? 'text-amber-500 font-bold'
                      : 'text-(--muted) hover:text-(--text) hover:bg-amber-500/5'
                    }`}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="shrink-0">
                    <UserIcon
                      className={`w-5 h-5 transition-all duration-200 ${profileActive ? 'text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]' : ''
                        }`}
                    />
                  </motion.div>

                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className={`text-[13px] font-semibold tracking-wide whitespace-nowrap ${profileActive ? 'font-bold' : ''}`}
                      >
                        Hồ sơ
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </NavLink>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col justify-between h-[calc(100vh-3.5rem)] min-h-[calc(100vh-3.5rem)]">
          <div className="flex-1">
            {/* Loading bar */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ scaleX: 0, opacity: 1 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-0.5 bg-linear-to-r from-amber-500 via-amber-400 to-transparent origin-left"
                  style={{ boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}
                />
              )}
            </AnimatePresence>

            <div className="w-full mx-auto px-6 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Luxury Footer */}
          <footer className="border-t border-border bg-(--surface)/20 py-2.5 text-center text-[11px] text-slate-400 mt-auto shrink-0">
            <div className="w-full mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted font-medium flex items-center gap-1.5">
                <span>© 2026 Equestrian Racing Management System (ERMS). All rights reserved.</span>
              </div>
              <div className="flex gap-6">
                <a href="#" className="hover:text-(--text) transition-colors">Điều khoản</a>
                <a href="#" className="hover:text-(--text) transition-colors">Bảo mật</a>
                <a href="#" className="hover:text-(--text) transition-colors">Liên hệ</a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
