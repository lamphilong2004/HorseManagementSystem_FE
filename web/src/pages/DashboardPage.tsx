import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'
import { 
  getPublicRaces, 
  getPublicTournaments, 
  getMyPredictions 
} from '../api'
import type { Race, Tournament, PredictionItem } from '../types'
import { 
  Calendar, 
  Trophy, 
  TrendingUp, 
  Zap, 
  Clock, 
  Coins, 
  Award, 
  Shield, 
  ChevronRight, 
  Play, 
  User as UserIcon,
  LineChart as ChartIcon
} from 'lucide-react'

// Mock odds trend data for Recharts
const oddsData = [
  { time: '10:00', Windrunner: 2.1, Thunderbolt: 3.5, GoldMedal: 1.8 },
  { time: '11:00', Windrunner: 2.3, Thunderbolt: 3.2, GoldMedal: 1.9 },
  { time: '12:00', Windrunner: 2.0, Thunderbolt: 3.0, GoldMedal: 2.1 },
  { time: '13:00', Windrunner: 1.9, Thunderbolt: 3.4, GoldMedal: 2.0 },
  { time: '14:00', Windrunner: 1.8, Thunderbolt: 3.6, GoldMedal: 2.2 },
  { time: '15:00', Windrunner: 1.7, Thunderbolt: 3.8, GoldMedal: 2.5 },
]

// Countdown Timer Component
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date()
      if (difference <= 0) {
        setTimeLeft(null)
        return
      }

      setTimeLeft({
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (!timeLeft) {
    return <span className="text-emerald-400 font-bold text-xs tracking-wider animate-pulse">SẮP DIỄN RA</span>
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/25">
      <Clock className="w-3.5 h-3.5" />
      <span>{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
    </div>
  )
}

// Live Race Track Component using pure React 19 state & standard CSS transitions (avoiding Framer Motion crashes)
function LiveRaceTracker() {
  const [horses, setHorses] = useState([
    { id: '1', name: 'Windrunner ⚡', jockey: 'Lê Minh', progress: 15, speed: 2.3, color: 'bg-gradient-to-r from-amber-500 to-amber-400' },
    { id: '2', name: 'Thunderbolt 🔋', jockey: 'Nguyễn Tùng', progress: 20, speed: 2.0, color: 'bg-gradient-to-r from-blue-500 to-blue-400' },
    { id: '3', name: 'Gold Medalist 🏆', jockey: 'Trần Nam', progress: 10, speed: 2.5, color: 'bg-gradient-to-r from-emerald-500 to-emerald-400' },
    { id: '4', name: 'Shadow Fax 🌪️', jockey: 'Phạm Hải', progress: 18, speed: 2.2, color: 'bg-gradient-to-r from-purple-500 to-purple-400' },
  ])

  const [raceFinished, setRaceFinished] = useState(false)

  useEffect(() => {
    if (raceFinished) return

    const interval = setInterval(() => {
      setHorses((prev) => {
        let finished = false
        const next = prev.map((h) => {
          const delta = Math.random() * h.speed * 2.8
          const newProgress = Math.min(h.progress + delta, 100)
          if (newProgress >= 100) finished = true
          return { ...h, progress: newProgress }
        })
        if (finished) {
          setRaceFinished(true)
          clearInterval(interval)
        }
        return next
      })
    }, 700)

    return () => clearInterval(interval)
  }, [raceFinished])

  const resetSimulation = () => {
    setHorses((prev) => prev.map((h) => ({ ...h, progress: 0 })))
    setRaceFinished(false)
  }

  const sortedHorses = [...horses].sort((a, b) => b.progress - a.progress)

  return (
    <div className="flex flex-col gap-5 text-left w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-400 tracking-wider">LIVE SIMULATION TRACK</span>
        </div>
        {raceFinished ? (
          <button 
            onClick={resetSimulation}
            className="text-[11px] font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/25 cursor-pointer"
          >
            Đua lại 🔄
          </button>
        ) : (
          <span className="text-xs font-semibold text-slate-400">ĐANG ĐUA (LIVE)</span>
        )}
      </div>

      {/* Track Lanes */}
      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col gap-6 relative overflow-hidden">
        {horses.map((horse, idx) => (
          <div key={horse.id} className="flex flex-col gap-2 relative z-10">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded border border-slate-800 font-mono">Lane {idx+1}</span>
                {horse.name}
              </span>
              <span className="font-mono text-slate-300 text-[11px] font-bold">{Math.round(horse.progress)}%</span>
            </div>
            
            {/* Lane progress bar using CSS transitions */}
            <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 relative">
              <div 
                className={`h-full ${horse.color} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${horse.progress}%` }}
              />
              {/* Jockey icon marker */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-2.5 transition-all duration-500 ease-out"
                style={{ left: `${Math.max(horse.progress - 1, 0)}%` }}
              >
                <div className="w-6.5 h-6.5 rounded-full bg-slate-950 border border-slate-700 shadow-md flex items-center justify-center text-[12px] hover:scale-110 transition-transform">
                  🏇
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Start / Finish lines */}
        <div className="absolute top-0 bottom-0 left-[8%] w-[1px] bg-slate-800/40 border-dashed border-l z-0 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-[5%] w-1 bg-emerald-500/20 border-r border-emerald-500/30 z-0 pointer-events-none" />
      </div>

      {/* Instant Standings */}
      <div className="bg-slate-900/30 p-4.5 rounded-xl border border-slate-800/60 flex flex-col gap-2.5">
        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Vị trí hiện tại</span>
        <div className="grid grid-cols-4 gap-2.5">
          {sortedHorses.map((h, index) => {
            const colors = [
              'border-amber-500/20 bg-amber-500/5 text-amber-400', 
              'border-slate-400/20 bg-slate-450/5 text-slate-300', 
              'border-orange-500/20 bg-orange-500/5 text-orange-400', 
              'border-slate-800 text-slate-500'
            ]
            const labels = ['🥇 1st', '🥈 2nd', '🥉 3rd', '4th']
            return (
              <div key={h.id} className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-lg border text-center ${colors[index] || colors[3]}`}>
                <span className="text-[10px] font-bold tracking-wider uppercase">{labels[index]}</span>
                <span className="text-[11px] font-bold truncate w-full mt-1">{h.name.split(' ')[0]}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Custom interactive SVG Area Chart (No Recharts/react-is dependency, React 19 safe)
function OddsTrendChart() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  
  const width = 450
  const height = 180
  const paddingLeft = 30
  const paddingRight = 10
  const paddingTop = 10
  const paddingBottom = 25
  
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom
  
  const getX = (index: number) => {
    return paddingLeft + (index / (oddsData.length - 1)) * chartWidth
  }
  
  const getY = (value: number) => {
    const minVal = 1.0
    const maxVal = 4.0
    const ratio = (value - minVal) / (maxVal - minVal)
    return paddingTop + chartHeight - ratio * chartHeight
  }
  
  const getLinePath = (key: 'Windrunner' | 'Thunderbolt' | 'GoldMedal') => {
    const points = oddsData.map((d, idx) => `${getX(idx)},${getY(d[key])}`)
    return `M ${points.join(' L ')}`
  }
  
  const getAreaPath = (key: 'Windrunner' | 'Thunderbolt' | 'GoldMedal') => {
    const points = oddsData.map((d, idx) => `${getX(idx)},${getY(d[key])}`)
    const startX = getX(0)
    const endX = getX(oddsData.length - 1)
    const baseY = paddingTop + chartHeight
    return `M ${startX},${baseY} L ${points.join(' L ')} L ${endX},${baseY} Z`
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svgRect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - svgRect.left
    
    let nearestIndex = 0
    let minDiff = Infinity
    for (let i = 0; i < oddsData.length; i++) {
      const diff = Math.abs(getX(i) - mouseX)
      if (diff < minDiff) {
        minDiff = diff
        nearestIndex = i
      }
    }
    setHoveredIdx(nearestIndex)
  }

  const handleMouseLeave = () => {
    setHoveredIdx(null)
  }

  const hoveredData = hoveredIdx !== null ? oddsData[hoveredIdx] : null

  return (
    <div className="relative w-full text-left">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full overflow-visible select-none cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="svgColorWind" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="svgColorGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>

        {/* Grid lines (horizontal) */}
        {[1.0, 2.0, 3.0, 4.0].map((val) => {
          const y = getY(val)
          return (
            <g key={val}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="#334155" 
                strokeWidth={0.5} 
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 4} 
                fill="#64748b" 
                fontSize={9} 
                fontWeight="bold" 
                textAnchor="end"
              >
                {val.toFixed(1)}x
              </text>
            </g>
          )
        })}

        {/* X Axis label lines */}
        {oddsData.map((d, idx) => {
          const x = getX(idx)
          return (
            <text 
              key={idx} 
              x={x} 
              y={height - 5} 
              fill="#64748b" 
              fontSize={9} 
              fontWeight="semibold" 
              textAnchor="middle"
            >
              {d.time}
            </text>
          )
        })}

        {/* Areas */}
        <path d={getAreaPath('Windrunner')} fill="url(#svgColorWind)" />
        <path d={getAreaPath('GoldMedal')} fill="url(#svgColorGold)" />

        {/* Lines */}
        <path d={getLinePath('Windrunner')} fill="none" stroke="#f59e0b" strokeWidth={2} />
        <path d={getLinePath('GoldMedal')} fill="none" stroke="#10b981" strokeWidth={1.5} />

        {/* Hover elements */}
        {hoveredIdx !== null && (
          <>
            {/* Guide line */}
            <line 
              x1={getX(hoveredIdx)} 
              y1={paddingTop} 
              x2={getX(hoveredIdx)} 
              y2={paddingTop + chartHeight} 
              stroke="#64748b" 
              strokeWidth={1} 
              strokeDasharray="2 2"
            />
            {/* Dots */}
            <circle cx={getX(hoveredIdx)} cy={getY(oddsData[hoveredIdx].Windrunner)} r={4} fill="#f59e0b" stroke="#0f172a" strokeWidth={1.5} />
            <circle cx={getX(hoveredIdx)} cy={getY(oddsData[hoveredIdx].GoldMedal)} r={4} fill="#10b981" stroke="#0f172a" strokeWidth={1.5} />
          </>
        )}
      </svg>

      {/* Floating Tooltip Box */}
      {hoveredIdx !== null && hoveredData && (
        <div 
          className="absolute z-20 bg-[#0f172a] border border-slate-800 p-3 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: `${Math.min((getX(hoveredIdx) / width) * 100, 75)}%`,
            top: '10px'
          }}
        >
          <p className="text-xs text-slate-400 font-bold mb-1">{hoveredData.time}</p>
          <p className="text-xs font-semibold text-amber-500">
            Windrunner: {hoveredData.Windrunner}x
          </p>
          <p className="text-xs font-semibold text-emerald-400">
            Gold Medalist: {hoveredData.GoldMedal}x
          </p>
          <p className="text-xs font-semibold text-blue-400">
            Thunderbolt: {hoveredData.Thunderbolt}x
          </p>
        </div>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { session } = useSession()
  const [races, setRaces] = useState<Race[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [predictions, setPredictions] = useState<PredictionItem[]>([])
  const [loading, setLoading] = useState(true)

  const name = session?.user.name ?? 'Guest'
  const role = session?.user.role ?? 'SPECTATOR'

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [racesRes, tourRes] = await Promise.all([
          getPublicRaces(),
          getPublicTournaments(),
        ])

        const racesData = Array.isArray(racesRes) ? racesRes : (racesRes?.races || [])
        const tourData = Array.isArray(tourRes) ? tourRes : (tourRes?.tournaments || [])

        setRaces(racesData)
        setTournaments(tourData)

        if (role === 'SPECTATOR') {
          const predRes = await getMyPredictions()
          const predData = Array.isArray(predRes) ? predRes : (predRes?.predictions || predRes?.data || [])
          setPredictions(predData)
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [role])

  // Process data variables
  const upcomingRaces = races.filter(r => r.status === 'PENDING' || r.status === 'SCHEDULED')
  const ongoingRaces = races.filter(r => r.status === 'ONGOING' || r.status === 'LIVE')
  const totalPrizePool = tournaments.reduce((acc, t) => acc + (t.prizePool || 0), 0)

  // Prediction calculations
  const totalBets = predictions.length
  const totalBetAmount = predictions.reduce((acc, p) => acc + p.betAmount, 0)
  const wonPredictions = predictions.filter(p => p.status === 'WON')
  const winRate = totalBets > 0 ? Math.round((wonPredictions.length / totalBets) * 100) : 0
  const totalPayout = predictions.reduce((acc, p) => acc + (p.payout || 0), 0)

  // Render role actions
  const renderQuickActions = () => {
    switch (role) {
      case 'OWNER':
        return (
          <div className="flex flex-col gap-4 text-left w-full">
            <Link to="/horses" className="group flex items-center justify-between p-5 rounded-xl bg-slate-900/60 border border-slate-850 hover:border-amber-500/30 hover:bg-slate-900 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-200">Quản lý Đàn Ngựa</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Đăng ký và duyệt hồ sơ ngựa đua</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-200" />
            </Link>
            <Link to="/races" className="group flex items-center justify-between p-5 rounded-xl bg-slate-900/60 border border-slate-855 hover:border-slate-700/80 hover:bg-slate-900 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-200">Đăng ký Cuộc Đua</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Chọn cuộc đua trống để tranh tài</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-200 group-hover:translate-x-1 transition-all duration-200" />
            </Link>
          </div>
        )
      case 'JOCKEY':
        return (
          <div className="flex flex-col gap-4 text-left w-full">
            <Link to="/invites" className="group flex items-center justify-between p-5 rounded-xl bg-slate-900/60 border border-slate-850 hover:border-amber-500/30 hover:bg-slate-900 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-200">Xem Lời Mời Điều Khiển</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Nhận lịch đua từ các chủ ngựa</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-200" />
            </Link>
          </div>
        )
      case 'REFEREE':
        return (
          <div className="flex flex-col gap-4 text-left w-full">
            <Link to="/referee/races" className="group flex items-center justify-between p-5 rounded-xl bg-slate-900/60 border border-slate-850 hover:border-amber-500/30 hover:bg-slate-900 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-200">Giám sát trọng tài</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Duyệt ngựa, vi phạm & kết quả</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-200" />
            </Link>
          </div>
        )
      case 'ADMIN':
        return (
          <div className="flex flex-col gap-4 text-left w-full">
            <Link to="/admin/users" className="group flex items-center justify-between p-5 rounded-xl bg-slate-900/60 border border-slate-850 hover:border-slate-700/80 hover:bg-slate-900 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-200">Quản lý người dùng</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Xem và sửa thông tin thành viên</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-200 group-hover:translate-x-1 transition-all duration-200" />
            </Link>
            <Link to="/admin/scheduling" className="group flex items-center justify-between p-5 rounded-xl bg-slate-900/60 border border-slate-850 hover:border-slate-700/80 hover:bg-slate-900 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-200">Lập lịch giải đấu</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Tạo giải đấu & cuộc đua mới</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-200 group-hover:translate-x-1 transition-all duration-200" />
            </Link>
          </div>
        )
      default: // SPECTATOR
        return (
          <div className="flex flex-col gap-4 text-left w-full">
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/85 flex flex-col gap-3.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tóm tắt cược của tôi</span>
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <span className="text-xs text-slate-450">Tổng đặt cược:</span>
                <span className="text-sm font-bold text-slate-200">{totalBets} lần</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <span className="text-xs text-slate-455">Số tiền cược:</span>
                <span className="text-sm font-bold text-amber-500">{totalBetAmount.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-460">Tiền thắng (Payout):</span>
                <span className="text-sm font-bold text-emerald-450 text-emerald-400">+{totalPayout.toLocaleString()}đ</span>
              </div>
            </div>
            
            <Link to="/predictions" className="group flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-amber-500/5 to-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 hover:from-amber-500/10 hover:to-amber-500/15 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Coins className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-200">Đặt dự đoán mới</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Chọn giải đua để cược</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-200" />
            </Link>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-900" />
          <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-400 text-xs font-semibold animate-pulse uppercase tracking-widest">Đang tải dữ liệu cá cược...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 text-left w-full">
      
      {/* 1. Hero Banner: Highly Styled, FanDuel Style Split Layout */}
      <section className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-[#0f172a] shadow-md w-full">
        {/* Subtle grid visual helper */}
        <div className="absolute inset-0 opacity-15" style={{ 
          backgroundImage: `radial-gradient(circle at 1px 1px, #f59e0b 1px, transparent 0)`, 
          backgroundSize: '24px 24px' 
        }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#11192e] to-transparent z-0" />

        <div className="relative p-8 md:p-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 z-10">
          <div className="flex flex-col gap-2 max-w-xl">
            <span className="self-start text-[10px] font-bold tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded">
              DASHBOARD CHUYÊN NGHIỆP
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-50 mt-2 tracking-tight">
              Xin chào, <span className="text-amber-500">{name}</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mt-1">
              Hệ thống theo dõi giải đấu chính quy, cập nhật tỉ lệ cược biến động trực tuyến và lập biên bản thi đấu chính xác dành cho nhà phân tích.
            </p>
          </div>

          {/* Featured quick widget card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 bg-slate-950/70 p-5 rounded-xl border border-slate-800 backdrop-blur-sm min-w-[320px] shadow-lg">
            <div className="flex-1 flex flex-col min-w-[140px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trận Đua Kế Tiếp</span>
              <span className="text-xs font-bold text-slate-200 truncate mt-1">
                {upcomingRaces[0]?.name || 'Không có cuộc đua'}
              </span>
              <span className="text-[10px] text-amber-550 font-bold mt-1 text-amber-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {upcomingRaces[0] ? new Date(upcomingRaces[0].scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
              </span>
            </div>
            {upcomingRaces[0] && (
              <div className="flex items-center justify-center sm:border-l sm:border-slate-800 sm:pl-5">
                <CountdownTimer targetDate={upcomingRaces[0].scheduledAt} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        
        {/* Stat 1 */}
        <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm hover:shadow transition-shadow relative overflow-hidden text-left">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Cuộc đua hôm nay</span>
              <span className="text-3xl font-extrabold text-slate-100 mt-1">{races.length}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-450 mt-4 flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-200">{ongoingRaces.length} LIVE</span> cuộc đua hoạt động
          </p>
        </div>

        {/* Stat 2 */}
        <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm hover:shadow transition-shadow relative overflow-hidden text-left">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Người tham gia</span>
              <span className="text-3xl font-extrabold text-slate-100 mt-1">28</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-450 mt-4">
            Số ngựa chiến đạt chuẩn ngoại hình
          </p>
        </div>

        {/* Stat 3 */}
        <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm hover:shadow transition-shadow relative overflow-hidden text-left">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Tỷ lệ chính xác</span>
              <span className="text-3xl font-extrabold text-slate-100 mt-1">{role === 'SPECTATOR' ? `${winRate}%` : '85%'}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-450 mt-4">
            {role === 'SPECTATOR' ? `Thống kê từ ${totalBets} lần cược` : 'Độ chính xác xác thực'}
          </p>
        </div>

        {/* Stat 4 */}
        <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm hover:shadow transition-shadow relative overflow-hidden text-left">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Tổng giải thưởng</span>
              <span className="text-3xl font-extrabold text-amber-500 mt-1">
                {totalPrizePool > 0 ? `${(totalPrizePool/1e6).toFixed(1)}M` : '50M'} đ
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-450 mt-4">
            Tổng pool từ {tournaments.length} giải đang hoạt động
          </p>
        </div>
      </section>

      {/* 3. Main Content: 3 Columns Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        
        {/* Left Column: Upcoming Races (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-amber-500" />
              Lịch đua sắp tới
            </h2>
            <Link to="/races" className="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center gap-0.5 transition-colors">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {upcomingRaces.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-slate-500 text-xs">
                Không có cuộc đua sắp tới nào
              </div>
            ) : (
              upcomingRaces.slice(0, 3).map((race) => (
                <div 
                  key={race._id}
                  className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm hover:border-slate-700/60 transition-colors flex flex-col gap-4 text-left"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-200 truncate max-w-[150px]">{race.name}</span>
                      <span className="text-xs text-slate-400 mt-1">Cự ly: {race.distance || 1200}m</span>
                    </div>
                    <CountdownTimer targetDate={race.scheduledAt} />
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-4">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] text-slate-550 uppercase font-bold">Giải thưởng</span>
                      <span className="text-xs font-bold text-amber-500">{race.prizeFirst ? `${race.prizeFirst.toLocaleString()} đ` : '15,000,000 đ'}</span>
                    </div>
                    {role === 'SPECTATOR' ? (
                      <Link 
                        to={`/races/${race._id}`}
                        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                        Đặt cược
                      </Link>
                    ) : (
                      <Link 
                        to={role === 'REFEREE' ? `/referee/races/${race._id}` : `/races/${race._id}`}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center Column: Live Races & Recharts Chart (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          
          {/* Live Tracker Widget */}
          <div className="flex flex-col gap-5 w-full">
            <h2 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4.5 h-4.5 text-emerald-500" />
              Bảng đua Live
            </h2>

            <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm flex flex-col gap-6 w-full">
              {ongoingRaces.length > 0 ? (
                <div className="flex flex-col gap-5 w-full">
                  <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-200">{ongoingRaces[0].name}</span>
                      <span className="text-xs text-slate-400 mt-1">Trận đấu đang ghi nhận bởi giám sát viên</span>
                    </div>
                    <Link 
                      to={`/races/${ongoingRaces[0]._id}`} 
                      className="text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 rounded-lg border border-amber-500/20 transition-colors cursor-pointer"
                    >
                      Mở bảng ⚡
                    </Link>
                  </div>
                  <div className="border-t border-slate-800/80 pt-5 w-full">
                    <LiveRaceTracker />
                  </div>
                </div>
              ) : (
                // Sandbox simulation (React 19 safe)
                <div className="flex flex-col gap-5 w-full">
                  <div className="flex items-center justify-between bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-300">Không có cuộc đua Live thực lúc này</span>
                      <span className="text-[10px] text-slate-450 mt-1">Bảng mô phỏng đua (Luxury Sandbox)</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded font-bold border border-emerald-500/25">
                      SANDBOX MODE
                    </span>
                  </div>
                  <LiveRaceTracker />
                </div>
              )}
            </div>
          </div>

          {/* Outstanding Odds fluctuation Recharts widget */}
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
              <ChartIcon className="w-4.5 h-4.5 text-blue-500" />
              Biến động Odds (Odds Trend)
            </h2>
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm w-full">
              <p className="text-xs text-slate-400 mb-4 text-left">Tỉ lệ cược biến động theo thời gian trước trận đấu (x thưởng).</p>
              
              <div className="h-56 w-full">
                <OddsTrendChart />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: User Quick bet or Role Specific widgets (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <h2 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-blue-500" />
            Lối tắt hành động
          </h2>

          <div className="flex flex-col gap-5 w-full">
            {renderQuickActions()}

            {/* Prediction History Widget for Spectator */}
            {role === 'SPECTATOR' && predictions.length > 0 && (
              <div className="flex flex-col gap-4 w-full">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">Dự đoán gần đây</span>
                <div className="flex flex-col gap-3">
                  {predictions.slice(0, 3).map((p) => {
                    const isWon = p.status === 'WON'
                    const isLost = p.status === 'LOST'
                    
                    return (
                      <div key={p._id} className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col gap-3 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-300 truncate max-w-[130px]">
                            {p.raceId?.name || 'Giải đua'}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            isWon ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                            isLost ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                            'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse'
                          }`}>
                            {isWon ? 'Thắng' : isLost ? 'Thua' : 'Đang chờ'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Ngựa cược: <strong className="text-slate-200">{p.horseId?.name || 'Ngựa đua'}</strong></span>
                          <span className="font-mono text-slate-300 font-bold">{p.betAmount.toLocaleString()}đ</span>
                        </div>
                        {isWon && (
                          <div className="text-[11px] text-emerald-400 font-bold text-right -mt-1">
                            Nhận: +{p.payout?.toLocaleString()}đ
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </section>
      
    </div>
  )
}
