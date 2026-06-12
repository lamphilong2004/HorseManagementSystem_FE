import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../../auth/SessionContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  getTournaments,
  getRaces,
  getAdminUsers,
  getAdminHorses,
  getRaceRegistrations,
  getAdminPredictions,
  approveRaceRegistration,
  rejectRaceRegistration,
} from '@/api'
import { 
  RefreshCw, 
  FileCheck2,
  ChevronRight,
  ShieldCheck,
  Crown,
  Coins,
  TrendingUp,
  Award,
  Settings,
  Users,
  BarChart3
} from 'lucide-react'
import { NumberCounter } from '@/components/ui/number-counter'
import { AnimatedTable, type SortDirection } from '@/components/ui/animated-table'

// Toast notifications configuration
type ToastItem = { id: number; type: 'success' | 'error' | 'warning' | 'info'; message: string }
let toastIdCounter = 0

export function AdminDashboard() {
  const { session } = useSession()
  const [activeTab, setActiveTab] = useState<'financial' | 'operations' | 'members'>('financial')
  
  // Data loading states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // System stats state
  const [tournaments, setTournaments] = useState<any[]>([])
  const [races, setRaces] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [registrations, setRegistrations] = useState<any[]>([])
  const [registrationOwners, setRegistrationOwners] = useState<Record<string, { fullName?: string; phone?: string }>>({})
  const [predictions, setPredictions] = useState<any[]>([])

  // Dashboard Tables State
  const [racesSortColumn, setRacesSortColumn] = useState<string | undefined>()
  const [racesSortDirection, setRacesSortDirection] = useState<SortDirection>(null)
  
  const [predsSortColumn, setPredsSortColumn] = useState<string | undefined>()
  const [predsSortDirection, setPredsSortDirection] = useState<SortDirection>(null)

  const handleRacesSort = (columnId: string, direction: SortDirection) => {
    setRacesSortColumn(columnId)
    setRacesSortDirection(direction)
  }

  const handlePredsSort = (columnId: string, direction: SortDirection) => {
    setPredsSortColumn(columnId)
    setPredsSortDirection(direction)
  }

  // Toast functions
  const showToast = (message: string, type: ToastItem['type'] = 'success') => {
    const id = ++toastIdCounter
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  // Fetch metrics from Server APIs
  const fetchAllStats = async () => {
    try {
      setError(null)
      const [tData, rData, uData, hData, regData, pData] = await Promise.all([
        getTournaments().catch(() => []),
        getRaces().catch(() => []),
        getAdminUsers().catch(() => []),
        getAdminHorses().catch(() => []),
        getRaceRegistrations().catch(() => []),
        getAdminPredictions().catch(() => []),
      ])

      setTournaments(tData)
      setRaces(rData)
      setUsers(uData)
      setRegistrations(regData)
      setPredictions(pData)

      const ownerMap: Record<string, { fullName?: string; phone?: string }> = {}
      hData.forEach((horse: any) => {
        const ownerData = typeof horse.ownerId === 'object' ? horse.ownerId : { fullName: horse.ownerId }
        ownerMap[horse.id] = {
          fullName: ownerData?.fullName || ownerData?.name || '',
          phone: ownerData?.phone || ownerData?.email || ''
        }
      })
      setRegistrationOwners(ownerMap)
    } catch (err: any) {
      console.error(err)
      setError('Lỗi kết nối đến máy chủ. Không thể đồng bộ số liệu thời gian thực.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAllStats()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchAllStats()
    showToast('Đang đồng bộ dữ liệu API thực tế...', 'info')
  }

  // Quick Action Handlers
  const handleApprove = async (regId: string) => {
    setActionLoading(regId)
    try {
      await approveRaceRegistration(regId)
      showToast('Đã phê duyệt ngựa tham gia cuộc đua!', 'success')
      fetchAllStats()
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Lỗi khi phê duyệt đăng ký', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (regId: string) => {
    setActionLoading(regId)
    try {
      await rejectRaceRegistration(regId, 'Không đạt yêu cầu thể chất hoặc nài ngựa')
      showToast('Từ chối đơn đăng ký thành công.', 'warning')
      fetchAllStats()
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Lỗi khi từ chối đăng ký', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Real Financial Calculations from API ───
  const totalPrizePool = tournaments.reduce((sum, t) => sum + (t.prizePool || 0), 0)
  const totalBets = predictions.reduce((sum, p) => sum + (p.betAmount || 0), 0)
  const totalPayouts = predictions.reduce((sum, p) => sum + (p.prizeAmount || p.payout || 0), 0)
  const netCommission = totalBets - totalPayouts

  // Formatter helpers


  const formatMoneyCompact = (val: number) => {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)} tỷ`
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)} tr`
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
    return String(val)
  }

  // Donut chart calculations (100% real prediction data)
  const wonCount = predictions.filter(p => p.status === 'WON').length
  const lostCount = predictions.filter(p => p.status === 'LOST').length
  const pendingCount = predictions.filter(p => ['PENDING', 'OPEN', 'CLOSED'].includes(p.status || '')).length
  const totalDonut = wonCount + lostCount + pendingCount

  const wonPct = totalDonut > 0 ? wonCount / totalDonut : 0
  const lostPct = totalDonut > 0 ? lostCount / totalDonut : 0
  const pendingPct = totalDonut > 0 ? pendingCount / totalDonut : 0

  const donutRadius = 60
  const donutC = 2 * Math.PI * donutRadius // 376.99
  
  // Bar Chart calculations for User Roles (100% real API data)
  const rolesCount = {
    SPECTATOR: users.filter(u => u.role === 'SPECTATOR').length,
    OWNER: users.filter(u => u.role === 'OWNER').length,
    JOCKEY: users.filter(u => u.role === 'JOCKEY').length,
    REFEREE: users.filter(u => u.role === 'REFEREE').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
  }

  // Monthly economic volume data generated dynamically from actual API predictions
  const getMonthlyDataFromRealApi = (preds: any[]) => {
    const months: Array<{ label: string; monthKey: string; bets: number; payouts: number }> = []
    const now = new Date()
    // Generate the last 6 months dynamically
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        label: `${d.getMonth() + 1}`,
        monthKey: `${d.getFullYear()}-${d.getMonth()}`,
        bets: 0,
        payouts: 0
      })
    }

    preds.forEach(p => {
      if (!p.createdAt) return
      const pDate = new Date(p.createdAt)
      const monthKey = `${pDate.getFullYear()}-${pDate.getMonth()}`
      const monthItem = months.find(m => m.monthKey === monthKey)
      if (monthItem) {
        monthItem.bets += p.betAmount || 0
        monthItem.payouts += p.prizeAmount || p.payout || 0
      }
    })

    return months.map(m => ({
      month: `T.${m.label}`,
      bets: m.bets,
      payouts: m.payouts
    }))
  }

  const monthlyData = getMonthlyDataFromRealApi(predictions)
  const maxMonthVal = Math.max(...monthlyData.map(m => m.bets), 1) // Safeguard to avoid division by zero

  // Race status breakdown (100% real API data)
  const raceStatus = {
    COMPLETED: races.filter(r => ['COMPLETED', 'RESULT_CONFIRMED', 'FINISHED'].includes(r.status || '')).length,
    SCHEDULED: races.filter(r => ['SCHEDULED', 'PENDING'].includes(r.status || '')).length,
    ONGOING: races.filter(r => ['ONGOING', 'RUNNING', 'LIVE'].includes(r.status || '')).length,
    CANCELLED: races.filter(r => ['CANCELLED'].includes(r.status || '')).length,
  }
  const totalRacesStatus = raceStatus.COMPLETED + raceStatus.SCHEDULED + raceStatus.ONGOING + raceStatus.CANCELLED

  // Pending horse registrations
  const pendingRegs = registrations.filter(reg => reg.status === 'PENDING_APPROVAL')

  return (
    <div className="space-y-8 relative pb-10">
      <style>{`
        .admin-toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
          pointer-events: none;
        }
        .admin-toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
          pointer-events: auto;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        html.light .admin-toast {
          background: rgba(255, 255, 255, 0.98);
          color: #0f172a;
          border-color: rgba(0, 0, 0, 0.08);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .metric-card-premium {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          background: rgba(30, 41, 59, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 24px;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        html.light .metric-card-premium {
          background: rgba(255, 255, 255, 0.7);
          border-color: rgba(0, 0, 0, 0.07);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
        }
        .metric-card-premium:hover {
          transform: translateY(-6px);
          border-color: rgba(var(--theme-color-rgb), 0.35);
          box-shadow: 0 20px 40px -15px rgba(var(--theme-color-rgb), 0.25);
        }
        html.light .metric-card-premium:hover {
          box-shadow: 0 20px 40px -15px rgba(var(--theme-color-rgb), 0.15);
        }
        .metric-card-glow-premium {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          opacity: 0;
          transition: opacity 0.5s ease;
          background: radial-gradient(circle 160px at var(--x, 0px) var(--y, 0px), rgba(var(--theme-color-rgb), 0.15), transparent 80%);
          pointer-events: none;
        }
        .metric-card-premium:hover .metric-card-glow-premium {
          opacity: 1;
        }
        .icon-container-premium {
          border-radius: 16px;
          padding: 12px;
          background: rgba(var(--theme-color-rgb), 0.08);
          border: 1px solid rgba(var(--theme-color-rgb), 0.15);
          color: rgb(var(--theme-color-rgb));
          box-shadow: 0 0 15px rgba(var(--theme-color-rgb), 0.05);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .metric-card-premium:hover .icon-container-premium {
          transform: scale(1.1) rotate(6deg);
          background: rgba(var(--theme-color-rgb), 0.15);
          border-color: rgba(var(--theme-color-rgb), 0.3);
          box-shadow: 0 0 20px rgba(var(--theme-color-rgb), 0.25);
        }
        .text-gradient-premium {
          background: linear-gradient(135deg, rgb(var(--theme-color-rgb)) 30%, rgb(var(--theme-color-alt-rgb)) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .glow-text-premium {
          filter: drop-shadow(0 2px 8px rgba(var(--theme-color-rgb), 0.15));
        }
        .metric-card-premium:hover .glow-text-premium {
          filter: drop-shadow(0 4px 15px rgba(var(--theme-color-rgb), 0.3));
        }
        .chart-hover-bar {
          transition: opacity 0.2s, transform 0.2s;
        }
        .chart-hover-bar:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }
      `}</style>

      {/* Floating toast notification panel */}
      <div className="admin-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="admin-toast">
            <span className="text-lg">
              {toast.type === 'success' && '✅'}
              {toast.type === 'error' && '❌'}
              {toast.type === 'warning' && '⚠️'}
              {toast.type === 'info' && 'ℹ️'}
            </span>
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <ScrollReveal direction="down" duration={0.8}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="px-2.5 py-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                HỆ THỐNG QUẢN TRỊ
              </Badge>
              {loading && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text)]">
              Xin chào, <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">{session?.user.name}</span>
            </h1>
            <p className="text-sm font-semibold text-[var(--muted)]">
              Tổng quan kinh tế, báo cáo vận hành và phê duyệt hoạt động toàn hệ thống.
            </p>
          </div>

          <Button 
            variant="outline" 
            size="lg" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-strong)] hover:border-emerald-500/40 rounded-xl transition-all font-bold text-sm shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`h-4.5 w-4.5 text-emerald-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            Làm mới số liệu
          </Button>
        </div>
      </ScrollReveal>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI Card 1 */}
        <ScrollReveal direction="up" duration={0.8} delay={0.05}>
          <div 
            className="metric-card-premium group"
            style={{ 
              '--theme-color-rgb': '16, 185, 129', 
              '--theme-color-alt-rgb': '45, 212, 191' 
            } as React.CSSProperties}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
              e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
            }}
          >
            <div className="metric-card-glow-premium" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-black text-[var(--muted)] tracking-wider uppercase">DOANH SỐ ĐẶT CƯỢC</span>
              <div className="icon-container-premium">
                <Coins className="h-5.5 w-5.5" />
              </div>
            </div>
            <div className="mt-5 relative z-10 space-y-1">
              <div className="glow-text-premium leading-none">
                <NumberCounter 
                  value={totalBets} 
                  separator="." 
                  suffix=" VND" 
                  className="font-black text-2xl sm:text-3xl lg:text-2xl xl:text-3xl tracking-tight text-gradient-premium select-all"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-semibold pt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Số liệu API thực tế</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* KPI Card 2 */}
        <ScrollReveal direction="up" duration={0.8} delay={0.1}>
          <div 
            className="metric-card-premium group"
            style={{ 
              '--theme-color-rgb': '245, 158, 11', 
              '--theme-color-alt-rgb': '244, 63, 94' 
            } as React.CSSProperties}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
              e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
            }}
          >
            <div className="metric-card-glow-premium" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-black text-[var(--muted)] tracking-wider uppercase">TIỀN THƯỞNG CHI TRẢ</span>
              <div className="icon-container-premium">
                <Award className="h-5.5 w-5.5" />
              </div>
            </div>
            <div className="mt-5 relative z-10 space-y-1">
              <div className="glow-text-premium leading-none">
                <NumberCounter 
                  value={totalPayouts} 
                  separator="." 
                  suffix=" VND" 
                  className="font-black text-2xl sm:text-3xl lg:text-2xl xl:text-3xl tracking-tight text-gradient-premium select-all"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-semibold pt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Khán giả thắng cược</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* KPI Card 3 */}
        <ScrollReveal direction="up" duration={0.8} delay={0.15}>
          <div 
            className="metric-card-premium group"
            style={{ 
              '--theme-color-rgb': '168, 85, 247', 
              '--theme-color-alt-rgb': '99, 102, 241' 
            } as React.CSSProperties}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
              e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
            }}
          >
            <div className="metric-card-glow-premium" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-black text-[var(--muted)] tracking-wider uppercase">TỔNG QUỸ GIẢI THƯỞNG</span>
              <div className="icon-container-premium">
                <Crown className="h-5.5 w-5.5" />
              </div>
            </div>
            <div className="mt-5 relative z-10 space-y-1">
              <div className="glow-text-premium leading-none">
                <NumberCounter 
                  value={totalPrizePool} 
                  separator="." 
                  suffix=" VND" 
                  className="font-black text-2xl sm:text-3xl lg:text-2xl xl:text-3xl tracking-tight text-gradient-premium select-all"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-semibold pt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span>Tất cả giải đấu</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* KPI Card 4 */}
        <ScrollReveal direction="up" duration={0.8} delay={0.2}>
          <div 
            className="metric-card-premium group"
            style={{ 
              '--theme-color-rgb': '20, 184, 166', 
              '--theme-color-alt-rgb': '6, 182, 212' 
            } as React.CSSProperties}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
              e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
            }}
          >
            <div className="metric-card-glow-premium" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-black text-[var(--muted)] tracking-wider uppercase">LỢI NHUẬN HỆ THỐNG</span>
              <div className="icon-container-premium">
                <TrendingUp className="h-5.5 w-5.5" />
              </div>
            </div>
            <div className="mt-5 relative z-10 space-y-1">
              <div className="glow-text-premium leading-none">
                <NumberCounter 
                  value={netCommission} 
                  separator="." 
                  prefix={netCommission >= 0 ? '+' : ''}
                  suffix=" VND" 
                  className="font-black text-2xl sm:text-3xl lg:text-2xl xl:text-3xl tracking-tight text-gradient-premium select-all"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-semibold pt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                <span>Tỷ lệ nhà cái thực tế</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Tabs Selection Bar */}
      <div className="flex border-b border-[var(--border)] gap-2 pb-px relative z-10">
        <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm transition-all duration-300 border-t border-x cursor-pointer ${
            activeTab === 'financial'
              ? 'bg-[var(--surface)] text-emerald-500 border-[var(--border)] border-b-transparent shadow-[0_2px_0_var(--surface)]'
              : 'bg-transparent text-[var(--muted)] hover:text-[var(--text)] border-transparent border-b-transparent'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span>Kinh tế & Cá cược</span>
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm transition-all duration-300 border-t border-x cursor-pointer ${
            activeTab === 'operations'
              ? 'bg-[var(--surface)] text-emerald-500 border-[var(--border)] border-b-transparent shadow-[0_2px_0_var(--surface)]'
              : 'bg-transparent text-[var(--muted)] hover:text-[var(--text)] border-transparent border-b-transparent'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Vận hành & Phê duyệt</span>
          {pendingRegs.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-2xs font-extrabold rounded-full bg-amber-500 text-white animate-pulse">
              {pendingRegs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm transition-all duration-300 border-t border-x cursor-pointer ${
            activeTab === 'members'
              ? 'bg-[var(--surface)] text-emerald-500 border-[var(--border)] border-b-transparent shadow-[0_2px_0_var(--surface)]'
              : 'bg-transparent text-[var(--muted)] hover:text-[var(--text)] border-transparent border-b-transparent'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Thành viên & Nhân sự</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* TAB 1: FINANCIALS */}
        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SVG Monthly Bets Bar Chart */}
            <Card className="lg:col-span-2 border-[var(--border)] bg-[var(--surface)]/50">
              <CardHeader>
                <CardTitle className="text-xl font-extrabold text-[var(--text)]">Doanh số Đặt Cược & Trả Thưởng Hàng Tháng</CardTitle>
                <CardDescription className="text-xs font-semibold text-[var(--muted)]">Biểu đồ so sánh khối lượng tiền cược ảo nhận được so với tiền thưởng chi trả từ API.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px] flex items-center justify-center">
                {predictions.length === 0 ? (
                  <div className="text-xs font-semibold text-[var(--muted)]">Chưa có giao dịch cá cược nào được ghi nhận.</div>
                ) : (
                  <svg className="w-full h-full max-w-[650px]" viewBox="0 0 500 240">
                    <defs>
                      <linearGradient id="barBetsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" stopOpacity="0.3" />
                      </linearGradient>
                      <linearGradient id="barPayoutsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal gridlines */}
                    {[0, 1, 2, 3].map((g) => (
                      <line 
                        key={g} 
                        x1="40" 
                        y1={30 + g * 50} 
                        x2="470" 
                        y2={30 + g * 50} 
                        stroke="rgba(255,255,255,0.06)" 
                        className="dark:stroke-white/5 stroke-black/5" 
                        strokeWidth="1" 
                      />
                    ))}

                    {/* Render Monthly Bars */}
                    {monthlyData.map((m, i) => {
                      const barW = 18
                      const spacing = 70
                      const startX = 65 + i * spacing
                      const betsHeight = (m.bets / maxMonthVal) * 160
                      const payoutsHeight = (m.payouts / maxMonthVal) * 160

                      return (
                        <g key={m.month}>
                          {/* Bets bar */}
                          <rect
                            x={startX}
                            y={180 - betsHeight}
                            width={barW}
                            height={betsHeight}
                            fill="url(#barBetsGrad)"
                            rx="4"
                            className="chart-hover-bar cursor-pointer transition-all duration-300"
                          />
                          {/* Payouts bar */}
                          <rect
                            x={startX + barW + 4}
                            y={180 - payoutsHeight}
                            width={barW}
                            height={payoutsHeight}
                            fill="url(#barPayoutsGrad)"
                            rx="4"
                            className="chart-hover-bar cursor-pointer transition-all duration-300"
                          />
                          {/* X-axis labels */}
                          <text 
                            x={startX + barW} 
                            y="205" 
                            textAnchor="middle" 
                            fill="var(--muted)" 
                            className="text-[10px] font-black"
                          >
                            {m.month}
                          </text>
                        </g>
                      )
                    })}

                    {/* Y-Axis Value Guides */}
                    <text x="35" y="34" textAnchor="end" fill="var(--muted)" className="text-[9px] font-bold">{formatMoneyCompact(maxMonthVal * 0.9)}</text>
                    <text x="35" y="84" textAnchor="end" fill="var(--muted)" className="text-[9px] font-bold">{formatMoneyCompact(maxMonthVal * 0.6)}</text>
                    <text x="35" y="134" textAnchor="end" fill="var(--muted)" className="text-[9px] font-bold">{formatMoneyCompact(maxMonthVal * 0.3)}</text>
                    <text x="35" y="184" textAnchor="end" fill="var(--muted)" className="text-[9px] font-bold">0</text>
                    <line x1="40" y1="180" x2="470" y2="180" stroke="var(--border)" strokeWidth="1" />

                    {/* Legend */}
                    <g transform="translate(320, 220)">
                      <rect x="0" y="0" width="10" height="10" fill="#10b981" rx="2" />
                      <text x="14" y="9" fill="var(--text)" className="text-[9px] font-bold">Tổng đặt cược</text>

                      <rect x="85" y="0" width="10" height="10" fill="#f59e0b" rx="2" />
                      <text x="99" y="9" fill="var(--text)" className="text-[9px] font-bold">Tiền chi trả</text>
                    </g>
                  </svg>
                )}
              </CardContent>
            </Card>

            {/* Donut Chart: Betting Structure */}
            <Card className="border-[var(--border)] bg-[var(--surface)]/50">
              <CardHeader>
                <CardTitle className="text-xl font-extrabold text-[var(--text)]">Cơ Cấu Phiên Dự Đoán</CardTitle>
                <CardDescription className="text-xs font-semibold text-[var(--muted)]">Tỷ lệ các phiên đặt cược của khán giả đã giải quyết.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[240px]">
                <div className="relative h-40 w-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    {totalDonut === 0 ? (
                      <circle
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        fill="transparent"
                        stroke="var(--border)"
                        strokeWidth="14"
                      />
                    ) : (
                      <>
                        {/* WON slice (Green) */}
                        {wonPct > 0 && (
                          <circle
                            cx="80"
                            cy="80"
                            r={donutRadius}
                            fill="transparent"
                            stroke="#10b981"
                            strokeWidth="14"
                            strokeDasharray={`${wonPct * donutC} ${donutC}`}
                            strokeDashoffset={0}
                            strokeLinecap="round"
                          />
                        )}
                        {/* LOST slice (Red) */}
                        {lostPct > 0 && (
                          <circle
                            cx="80"
                            cy="80"
                            r={donutRadius}
                            fill="transparent"
                            stroke="#ef4444"
                            strokeWidth="14"
                            strokeDasharray={`${lostPct * donutC} ${donutC}`}
                            strokeDashoffset={-wonPct * donutC}
                            strokeLinecap="round"
                          />
                        )}
                        {/* PENDING slice (Amber) */}
                        {pendingPct > 0 && (
                          <circle
                            cx="80"
                            cy="80"
                            r={donutRadius}
                            fill="transparent"
                            stroke="#f59e0b"
                            strokeWidth="14"
                            strokeDasharray={`${pendingPct * donutC} ${donutC}`}
                            strokeDashoffset={-(wonPct + lostPct) * donutC}
                            strokeLinecap="round"
                          />
                        )}
                      </>
                    )}
                  </svg>
                  {/* Center Text inside Donut */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-[var(--text)] tracking-tight">
                      <NumberCounter value={totalDonut} duration={1.5} />
                    </span>
                    <span className="text-3xs font-black text-[var(--muted)] tracking-widest uppercase">ĐƠN CƯỢC</span>
                  </div>
                </div>

                {/* Legends */}
                {totalDonut > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[var(--text)]">Thắng: {Math.round(wonPct * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="text-[var(--text)]">Thua: {Math.round(lostPct * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-[var(--text)]">Chờ: {Math.round(pendingPct * 100)}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: OPERATIONS & REGISTRATIONS */}
        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Race status progress bars */}
            <Card className="border-[var(--border)] bg-[var(--surface)]/50">
              <CardHeader>
                <CardTitle className="text-xl font-extrabold text-[var(--text)]">Tỷ Lệ Trạng Thái Cuộc Đua</CardTitle>
                <CardDescription className="text-xs font-semibold text-[var(--muted)]">Phân bố trạng thái của tất cả cuộc đua đang chạy và lên lịch.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-3">
                {[
                  { label: 'Đã hoàn tất (Completed)', count: raceStatus.COMPLETED, color: 'bg-emerald-500', barColor: 'rgba(16,185,129,0.15)' },
                  { label: 'Sắp diễn ra (Scheduled)', count: raceStatus.SCHEDULED, color: 'bg-blue-500', barColor: 'rgba(59,130,246,0.15)' },
                  { label: 'Đang diễn ra (Ongoing)', count: raceStatus.ONGOING, color: 'bg-amber-500', barColor: 'rgba(245,158,11,0.15)' },
                  { label: 'Đã hủy bỏ (Cancelled)', count: raceStatus.CANCELLED, color: 'bg-red-500', barColor: 'rgba(239,68,68,0.15)' }
                ].map((s) => {
                  const percent = totalRacesStatus > 0 ? (s.count / totalRacesStatus) * 100 : 0
                  return (
                    <div key={s.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[var(--text)]">{s.label}</span>
                        <span className="text-[var(--muted)]">{s.count} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[var(--bg2)] overflow-hidden" style={{ background: s.barColor }}>
                        <div className={`h-full rounded-full ${s.color} transition-all duration-500`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center text-xs font-bold text-[var(--muted)]">
                  <span>Tổng số cuộc đua</span>
                  <span className="text-[var(--text)] font-black text-sm">{totalRacesStatus}</span>
                </div>
              </CardContent>
            </Card>

            {/* Right: Quick approve horse race registrations */}
            <Card className="lg:col-span-2 border-[var(--border)] bg-[var(--surface)]/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-extrabold text-[var(--text)]">Yêu Cầu Đăng Ký Chờ Phê Duyệt</CardTitle>
                  <CardDescription className="text-xs font-semibold text-[var(--muted)]">Xét duyệt hồ sơ ngựa chiến tham dự các chặng đua hệ thống.</CardDescription>
                </div>
                {pendingRegs.length > 0 && (
                  <Badge variant="outline" className="border-amber-500 bg-amber-500/10 text-amber-500 font-extrabold animate-pulse">
                    {pendingRegs.length} ĐƠN MỚI
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="max-h-[360px] overflow-y-auto space-y-4">
                {pendingRegs.length === 0 ? (
                  <div className="py-14 text-center border-2 border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <FileCheck2 className="h-6 w-6" />
                    </div>
                    <div className="text-sm font-black text-[var(--text)]">Không có đơn đăng ký nào cần duyệt</div>
                    <p className="text-xs text-[var(--muted)] max-w-sm font-semibold">Tất cả hồ sơ đăng ký tham dự giải đấu của các chủ ngựa đã được giải quyết.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRegs.map((reg) => (
                      <div key={reg.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg2)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500/20 transition-all duration-300">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[var(--text)]">🐴 {reg.horseName || 'Ngựa thi đấu'}</span>
                            <Badge variant="outline" className="text-2xs border-[var(--border)] text-[var(--muted)] font-bold">
                              Giống: {reg.horseBreed || (typeof reg.horseId === 'object' ? reg.horseId?.breed : undefined) || 'Chưa rõ'}
                            </Badge>
                          </div>
                          <div className="text-xs font-semibold text-[var(--muted)]">
                            Chặng đua: <span className="text-[var(--text)] font-extrabold">{reg.raceName || 'Không rõ'}</span>
                          </div>
                          <div className="text-2xs font-semibold text-[var(--muted)]/75">
                            Chủ sở hữu: {(
                              registrationOwners[typeof reg.horseId === 'string' ? reg.horseId : (reg.horseId?.id || reg.horseId?._id)]?.fullName ||
                              reg.ownerName ||
                              (typeof reg.horseId === 'object' ? reg.horseId?.ownerId?.fullName || reg.horseId?.ownerId?.name || reg.horseId?.owner?.fullName || reg.horseId?.owner : undefined) ||
                              'Chủ ngựa'
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button
                            size="sm"
                            disabled={actionLoading !== null}
                            onClick={() => handleApprove(reg.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-lg px-3.5 py-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
                          >
                            {actionLoading === reg.id ? 'Đang duyệt...' : 'Duyệt'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading !== null}
                            onClick={() => handleReject(reg.id)}
                            className="border-red-500/30 text-red-500 hover:bg-red-500/5 hover:border-red-500 font-extrabold text-xs rounded-lg px-3.5 py-1.5 cursor-pointer"
                          >
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: MEMBERS & USER ANALYTICS */}
        {activeTab === 'members' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SVG Users by Role Bar Chart */}
            <Card className="lg:col-span-2 border-[var(--border)] bg-[var(--surface)]/50">
              <CardHeader>
                <CardTitle className="text-xl font-extrabold text-[var(--text)]">Cơ Cấu Người Dùng Trên Hệ Thống</CardTitle>
                <CardDescription className="text-xs font-semibold text-[var(--muted)]">Số lượng tài khoản đã đăng ký phân bổ theo các vai trò.</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] flex items-center justify-center">
                {users.length === 0 ? (
                  <div className="text-xs font-semibold text-[var(--muted)]">Chưa có người dùng nào đăng ký trên hệ thống.</div>
                ) : (
                  <svg className="w-full h-full max-w-[600px]" viewBox="0 0 500 200">
                    {/* Grid Lines */}
                    {[0, 1, 2].map((g) => (
                      <line 
                        key={g} 
                        x1="45" 
                        y1={25 + g * 50} 
                        x2="470" 
                        y2={25 + g * 50} 
                        stroke="rgba(255,255,255,0.06)" 
                        className="dark:stroke-white/5 stroke-black/5" 
                        strokeWidth="1" 
                      />
                    ))}

                    {/* Draw columns */}
                    {[
                      { label: 'Spectator', count: rolesCount.SPECTATOR, fill: '#10b981' },
                      { label: 'Jockey', count: rolesCount.JOCKEY, fill: '#3b82f6' },
                      { label: 'Owner', count: rolesCount.OWNER, fill: '#a855f7' },
                      { label: 'Referee', count: rolesCount.REFEREE, fill: '#ec4899' },
                      { label: 'Admin', count: rolesCount.ADMIN, fill: '#64748b' }
                    ].map((roleItem, idx) => {
                      const barW = 32
                      const spacing = 80
                      const startX = 65 + idx * spacing
                      const maxVal = Math.max(rolesCount.SPECTATOR, rolesCount.JOCKEY, rolesCount.OWNER, rolesCount.REFEREE, rolesCount.ADMIN, 1)
                      const barH = (roleItem.count / maxVal) * 120

                      return (
                        <g key={roleItem.label}>
                          <rect
                            x={startX}
                            y={150 - barH}
                            width={barW}
                            height={barH}
                            fill={roleItem.fill}
                            rx="5"
                            className="chart-hover-bar cursor-pointer transition-all duration-300"
                          />
                          <text
                            x={startX + barW / 2}
                            y={145 - barH}
                            textAnchor="middle"
                            fill="var(--text)"
                            className="text-[10px] font-black"
                          >
                            {roleItem.count}
                          </text>
                          <text
                            x={startX + barW / 2}
                            y="170"
                            textAnchor="middle"
                            fill="var(--muted)"
                            className="text-[10px] font-black"
                          >
                            {roleItem.label}
                          </text>
                        </g>
                      )
                    })}
                    <line x1="45" y1="150" x2="470" y2="150" stroke="var(--border)" strokeWidth="1" />
                  </svg>
                )}
              </CardContent>
            </Card>

            {/* Quick overview metrics */}
            <Card className="border-[var(--border)] bg-[var(--surface)]/50">
              <CardHeader>
                <CardTitle className="text-xl font-extrabold text-[var(--text)]">Tình Trạng Nhân Sự & Đua</CardTitle>
                <CardDescription className="text-xs font-semibold text-[var(--muted)]">Tổng kết nhanh số lượng tài nguyên đua hiện có trên hệ thống.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                {[
                  { label: 'Tổng số nài ngựa (Jockeys)', count: rolesCount.JOCKEY, icon: '🏇' },
                  { label: 'Tổng số ngựa đăng ký (Horses)', count: registrations.length || 0, icon: '🐴' },
                  { label: 'Tổng giải đấu (Tournaments)', count: tournaments.length || 0, icon: '🏆' },
                  { label: 'Tổng trọng tài hoạt động (Referees)', count: rolesCount.REFEREE, icon: '⚖️' }
                ].map((item) => (
                  <div key={item.label} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg2)]/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-xs font-black text-[var(--text)]">{item.label}</span>
                    </div>
                    <span className="text-base font-black text-[var(--text)]">
                      <NumberCounter value={item.count} duration={1.2} />
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Grid of Tables matching Stitch mockups */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Completed Race Results */}
        <Card className="border-[var(--border)] bg-[var(--surface)]/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-extrabold text-[var(--text)]">Kết Quả Đua Gần Nhất</CardTitle>
              <CardDescription className="text-xs font-semibold text-[var(--muted)]">Các chặng đua đã hoàn tất và được xác nhận kết quả.</CardDescription>
            </div>
            <Link to="/app/races" className="text-xs font-black text-emerald-500 hover:underline flex items-center gap-0.5">
              Tất cả cuộc đua <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="w-full overflow-hidden">
              <AnimatedTable
                data={(() => {
                  let res = races.filter(r => ['COMPLETED', 'RESULT_CONFIRMED'].includes(r.status || ''))
                  if (racesSortColumn && racesSortDirection) {
                    res.sort((a, b) => {
                      let aVal: any = a[racesSortColumn as keyof any]
                      let bVal: any = b[racesSortColumn as keyof any]
                      if (racesSortColumn === 'tournamentId') {
                        aVal = typeof a.tournamentId === 'object' ? a.tournamentId.name : ''
                        bVal = typeof b.tournamentId === 'object' ? b.tournamentId.name : ''
                      }
                      if (typeof aVal === 'string' && typeof bVal === 'string') {
                        return racesSortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
                      }
                      return racesSortDirection === 'asc' ? aVal - bVal : bVal - aVal
                    })
                  }
                  return res.slice(0, 4)
                })()}
                columns={[
                  {
                    id: 'name',
                    header: 'TÊN CUỘC ĐUA',
                    sortable: true,
                    cell: (row) => <span className="font-extrabold text-[var(--text)]">{row.name}</span>
                  },
                  {
                    id: 'distance',
                    header: 'CỰ LY',
                    sortable: true,
                    cell: (row) => <span className="text-[var(--muted)] font-bold">{row.distance}m</span>
                  },
                  {
                    id: 'tournamentId',
                    header: 'PHÂN LOẠI GIẢI ĐẤU',
                    sortable: true,
                    cell: (row) => <span className="text-[var(--muted)] font-semibold">{typeof row.tournamentId === 'object' ? row.tournamentId.name : 'Chặng độc lập'}</span>
                  },
                  {
                    id: 'status',
                    header: 'TRẠNG THÁI',
                    align: 'right',
                    cell: () => (
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                        Đã hoàn tất
                      </Badge>
                    )
                  }
                ]}
                sortColumn={racesSortColumn}
                sortDirection={racesSortDirection}
                onSort={handleRacesSort}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Bets/Predictions */}
        <Card className="border-[var(--border)] bg-[var(--surface)]/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-extrabold text-[var(--text)]">Hoạt Động Đặt Cược Mới Nhất</CardTitle>
              <CardDescription className="text-xs font-semibold text-[var(--muted)]">Các giao dịch đặt cược ảo gần đây từ khán giả xem giải đấu.</CardDescription>
            </div>
            <span className="text-[var(--muted)] text-2xs font-extrabold">LIVE UPDATE</span>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="w-full overflow-hidden">
              <AnimatedTable
                data={(() => {
                  let res = [...predictions]
                  if (predsSortColumn && predsSortDirection) {
                    res.sort((a, b) => {
                      let aVal: any = a[predsSortColumn as keyof any]
                      let bVal: any = b[predsSortColumn as keyof any]
                      if (predsSortColumn === 'id') {
                        aVal = a.id?.substring(18) || ''
                        bVal = b.id?.substring(18) || ''
                      }
                      if (typeof aVal === 'string' && typeof bVal === 'string') {
                        return predsSortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
                      }
                      return predsSortDirection === 'asc' ? aVal - bVal : bVal - aVal
                    })
                  }
                  return res.slice(0, 4)
                })()}
                columns={[
                  {
                    id: 'id',
                    header: 'MÃ GIAO DỊCH',
                    sortable: true,
                    cell: (row) => <span className="font-extrabold text-[var(--text)]">TX-{row.id?.substring(18).toUpperCase() || 'PRED'}</span>
                  },
                  {
                    id: 'betAmount',
                    header: 'TIỀN CƯỢC',
                    sortable: true,
                    cell: (row) => <span className="text-emerald-500 font-extrabold">{new Intl.NumberFormat('vi-VN').format(row.betAmount || 0)} ₫</span>
                  },
                  {
                    id: 'predictedPosition',
                    header: 'DỰ ĐOÁN HẠNG',
                    sortable: true,
                    cell: (row) => <span className="text-[var(--muted)] font-bold">Hạng {row.predictedPosition || 1}</span>
                  },
                  {
                    id: 'status',
                    header: 'KẾT QUẢ',
                    align: 'right',
                    sortable: true,
                    cell: (row) => (
                      <Badge 
                        variant="outline" 
                        className={`font-bold ${
                          row.status === 'WON' 
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : row.status === 'LOST' 
                            ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400' 
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {row.status === 'WON' ? 'THẮNG' : row.status === 'LOST' ? 'THUA' : 'CHỜ KẾT QUẢ'}
                      </Badge>
                    )
                  }
                ]}
                sortColumn={predsSortColumn}
                sortDirection={predsSortDirection}
                onSort={handlePredsSort}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
