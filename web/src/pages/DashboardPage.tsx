import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'
import { 
  getPublicRaces, 
  getPublicTournaments, 
  getMyPredictions 
} from '../api'
import type { Race, Tournament, PredictionItem } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { getStatusLabel } from '@/lib/status'
import { 
  Calendar, 
  Trophy, 
  TrendingUp, 
  Zap,
  BarChart3,
  Users,
  Eye,
  Loader2
} from 'lucide-react'

function formatMoney(n?: number) {
  if (n === undefined || n === null) return '—'
  return `${new Intl.NumberFormat('vi-VN').format(n)} VND`
}

function formatMoneyCompact(n?: number) {
  if (n === undefined || n === null) return '—'
  if (n === 0) return '0 VND'
  if (n < 1000000) return formatMoney(n)

  const millions = n / 1000000
  const formatted = Number.isInteger(millions)
    ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(millions)
    : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(millions)

  return `${formatted} triệu VND`
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

  // Process data
  const upcomingRaces = races.filter(r => r.status === 'PENDING' || r.status === 'SCHEDULED')
  const ongoingRaces = races.filter(r => r.status === 'ONGOING' || r.status === 'LIVE')
  const totalPrizePool = tournaments.reduce((acc, t) => acc + (t.prizePool || 0), 0)

  // Prediction stats
  const totalBets = predictions.length
  const totalBetAmount = predictions.reduce((acc, p) => acc + p.betAmount, 0)
  const wonPredictions = predictions.filter(p => p.status === 'WON')
  const winRate = totalBets > 0 ? Math.round((wonPredictions.length / totalBets) * 100) : 0
  const totalPayout = predictions.reduce((acc, p) => acc + (p.payout || 0), 0)

  const renderRoleSpecificActions = () => {
    switch (role) {
      case 'OWNER':
        return (
          <div className="flex flex-col gap-3">
            <Link to="/horses" className="group">
              <Button className="w-full justify-start bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-0 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-amber-500/30">
                <Trophy className="mr-2 h-4 w-4" />
                Quản lý Đàn Ngựa
              </Button>
            </Link>
            <Link to="/races" className="group">
              <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/30">
                <Calendar className="mr-2 h-4 w-4" />
                Đăng ký Cuộc Đua
              </Button>
            </Link>
          </div>
        )
      case 'JOCKEY':
        return (
          <Link to="/invites" className="group">
            <Button className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/30">
              <Zap className="mr-2 h-4 w-4" />
              Xem Lời Mời Điều Khiển
            </Button>
          </Link>
        )
      case 'REFEREE':
        return (
          <Link to="/referee/races" className="group">
            <Button className="w-full justify-start bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/30">
              <Eye className="mr-2 h-4 w-4" />
              Giám sát Trọng tài
            </Button>
          </Link>
        )
      case 'ADMIN':
        return (
          <div className="flex flex-col gap-3">
            <Link to="/admin/users" className="group">
              <Button className="w-full justify-start bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border-0 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-500/30">
                <Users className="mr-2 h-4 w-4" />
                Quản lý Người Dùng
              </Button>
            </Link>
            <Link to="/admin/scheduling" className="group">
              <Button className="w-full justify-start bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-500/30">
                <Calendar className="mr-2 h-4 w-4" />
                Lập lịch Giải Đấu
              </Button>
            </Link>
          </div>
        )
      default: // SPECTATOR
        return (
          <Link to="/predictions" className="group">
            <Button className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:via-orange-500 hover:to-red-500 text-white border-0 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-amber-500/40 font-bold text-base py-6">
              <Trophy className="mr-2 h-5 w-5" />
              🎯 Đặt Dự Đoán Mới
            </Button>
          </Link>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 py-6 px-2">
      {/* Header - Premium */}
      <div className="bg-gradient-to-r from-amber-600/10 via-transparent to-orange-600/10 rounded-2xl p-8 border border-amber-500/20 backdrop-blur-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-amber-400 tracking-wider uppercase">🏇 Professional Dashboard</p>
          <h1 className="text-4xl font-black bg-gradient-to-r from-amber-200 via-orange-100 to-amber-100 bg-clip-text text-transparent">
            Xin chào, {name}
          </h1>
          <p className="text-base text-slate-300">Quản lý giải đấu ngựa chuyên nghiệp • Theo dõi tỉ lệ cược • Phân tích dữ liệu</p>
        </div>
      </div>

      {/* Stats Grid - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 hover:border-amber-500/60 transition-all duration-300 shadow-lg hover:shadow-amber-500/20 hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-amber-100">Cuộc Đua Hôm Nay</CardTitle>
            <Zap className="h-5 w-5 text-amber-300 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-amber-200">{races.length}</div>
            <p className="text-xs text-amber-200/80 mt-2 font-medium">
              ⚡ {ongoingRaces.length} đang diễn ra
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-blue-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 hover:border-blue-500/60 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-blue-100">Người Tham Gia</CardTitle>
            <Users className="h-5 w-5 text-blue-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-blue-200">28</div>
            <p className="text-xs text-blue-200/80 mt-2 font-medium">
              Ngựa chiến đạt chuẩn 🐴
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 hover:border-emerald-500/60 transition-all duration-300 shadow-lg hover:shadow-emerald-500/20 hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-emerald-100">Tỷ Lệ Thắng</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-emerald-200">
              {role === 'SPECTATOR' ? `${winRate}%` : '85%'}
            </div>
            <p className="text-xs text-emerald-200/80 mt-2 font-medium">
              {role === 'SPECTATOR' ? `📊 Từ ${totalBets} cược` : 'Độ chính xác'}
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 hover:border-purple-500/60 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-purple-100">Tổng Giải Thưởng</CardTitle>
            <Trophy className="h-5 w-5 text-purple-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-purple-200">
              {formatMoneyCompact(totalPrizePool)}
            </div>
            <p className="text-xs text-purple-200/80 mt-2 font-medium">
              🎯 Từ {tournaments.length} giải
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upcoming Races - Premium */}
        <div className="lg:col-span-2">
          <Card className="border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 shadow-xl">
            <CardHeader className="border-b border-slate-800/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-lg text-slate-100">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-amber-400" />
                </div>
                Lịch Đua Sắp Tới
              </CardTitle>
              <CardDescription className="text-slate-300">Các cuộc đua tiếp theo trong giải đấu</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all">
                    📋 Tất cả ({upcomingRaces.length})
                  </TabsTrigger>
                  <TabsTrigger value="live" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-rose-600 data-[state=active]:text-white transition-all">
                    🔴 Đang diễn ra ({ongoingRaces.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-3 mt-4">
                  {upcomingRaces.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Không có cuộc đua sắp tới</p>
                  ) : (
                    upcomingRaces.slice(0, 5).map((race) => (
                      <div key={race._id} className="group relative overflow-hidden border border-slate-700/50 rounded-lg p-4 bg-gradient-to-r from-slate-900/50 to-slate-950/50 hover:from-amber-950/30 hover:to-orange-950/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-500/30">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-sm text-amber-100 group-hover:text-amber-200 transition-colors">{race.name}</h3>
                            <p className="text-xs text-slate-300 mt-1">🏁 Cự ly: <span className="text-slate-200 font-semibold">{race.distance || 1200}m</span></p>
                            <div className="mt-2 flex gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs bg-amber-950/50 text-amber-200 border-amber-700/50">
                                💰 {formatMoneyCompact(race.prizeFirst)}
                              </Badge>
                            </div>
                          </div>
                          <Link to={`/races/${race._id}`}>
                            <Button size="sm" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-0 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-amber-500/30">
                              Xem →
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
                <TabsContent value="live" className="space-y-3 mt-4">
                  {ongoingRaces.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Không có cuộc đua đang diễn ra</p>
                  ) : (
                    ongoingRaces.map((race) => (
                      <div key={race._id} className="group relative overflow-hidden border border-red-500/50 rounded-lg p-4 bg-gradient-to-r from-red-950/30 to-rose-950/30 hover:from-red-900/50 hover:to-rose-900/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 animate-pulse">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-sm text-red-100">{race.name}</h3>
                              <Badge className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs h-5">⚡ TRỰC TIẾP</Badge>
                            </div>
                            <p className="text-xs text-slate-200">Đang diễn ra tại thời điểm này</p>
                          </div>
                          <Link to={`/races/${race._id}`}>
                            <Button size="sm" className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border-0 transition-all">
                              Xem trực tiếp →
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right: Quick Actions & Stats */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions - Premium */}
          <Card className="border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 shadow-xl">
            <CardHeader className="border-b border-slate-800/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                <span className="text-xl">⚡</span>
                Hành Động Nhanh
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {renderRoleSpecificActions()}
              </div>
            </CardContent>
          </Card>

          {/* Spectator Predictions - Premium */}
          {role === 'SPECTATOR' && (
            <Card className="border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 shadow-xl">
              <CardHeader className="border-b border-slate-800/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-emerald-400" />
                  </div>
                  Thống Kê Cược
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <span className="text-sm font-medium text-slate-200">📊 Tổng cược</span>
                    <span className="text-lg font-black text-emerald-200">{totalBets}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <span className="text-sm font-medium text-slate-200">💰 Số tiền cược</span>
                    <span className="text-lg font-black text-amber-200">{formatMoney(totalBetAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <span className="text-sm font-medium text-slate-200">🎯 Tiền thắng</span>
                    <span className="text-lg font-black text-emerald-300">+{formatMoney(totalPayout)}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-200 font-medium">📈 Tỷ lệ thắng</span>
                      <span className="text-emerald-300 font-bold">{winRate}%</span>
                    </div>
                    <Progress value={winRate} className="h-2.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Predictions */}
          {role === 'SPECTATOR' && predictions.length > 0 && (
            <Card className="border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 shadow-xl">
              <CardHeader className="border-b border-slate-800/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-100">
                  <span className="text-xl">📋</span>
                  Dự Đoán Gần Đây
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {predictions.slice(0, 3).map((p) => {
                  const isWon = p.status === 'WON'
                  const isLost = p.status === 'LOST'
                  
                  return (
                    <div key={p._id} className="border border-slate-700/50 rounded-lg p-3 bg-slate-900/30 hover:bg-slate-900/60 hover:border-slate-600/50 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm text-slate-100 truncate flex-1 group-hover:text-amber-300 transition-colors">
                          {p.raceId?.name || 'Giải đua'}
                        </span>
                        <Badge 
                          variant={isWon ? 'default' : isLost ? 'destructive' : 'secondary'}
                          className={`text-xs ml-2 ${
                            isWon ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 
                            isLost ? 'bg-gradient-to-r from-red-600 to-rose-600' :
                            'bg-gradient-to-r from-amber-600 to-orange-600'
                          }`}
                        >
                          {isWon ? '🎯 Thắng' : isLost ? '❌ Thua' : '⏳ Chờ'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 mb-2">
                        🐴 {p.horseId?.name || 'N/A'}
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-700/30">
                        <span className="text-xs font-mono text-slate-200">{p.betAmount.toLocaleString()}đ</span>
                        {isWon && <span className="text-xs font-bold text-emerald-300">+{p.payout?.toLocaleString()}đ</span>}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tournaments Overview - Premium */}
      {tournaments.length > 0 && (
        <Card className="border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-slate-800/50 pb-4">
            <CardTitle className="flex items-center gap-3 text-lg text-slate-100">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Trophy className="h-5 w-5 text-purple-400" />
              </div>
              Giải Đấu Đang Diễn Ra
              <Badge variant="outline" className="ml-auto bg-purple-950/50 text-purple-200 border-purple-700/50">
                {tournaments.length} giải
              </Badge>
            </CardTitle>
            <CardDescription className="text-slate-300">Danh sách các giải đấu chính đang hoạt động</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.slice(0, 6).map((tour, idx) => (
                <div 
                  key={tour._id} 
                  className="group relative overflow-hidden border border-slate-700/50 rounded-lg p-5 bg-gradient-to-br from-slate-900/50 to-slate-950/50 hover:from-purple-950/40 hover:to-slate-950 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30"
                >
                  <div className="absolute top-0 right-0 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">
                    🏆
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-sm text-purple-100 group-hover:text-purple-200 transition-colors flex-1">{tour.name}</h3>
                      <span className="text-lg font-black text-purple-300">#{idx + 1}</span>
                    </div>
                    <p className="text-xs text-slate-300 mb-3 line-clamp-2">
                      {tour.description || 'Giải đấu chuyên nghiệp'}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                      <Badge variant="outline" className="text-xs bg-slate-800/50 text-slate-200 border-slate-700/50">
                        {getStatusLabel(tour.status || 'ACTIVE', 'tournament')} ✓
                      </Badge>
                      <p className="text-xs font-bold text-amber-300">
                        💰 {formatMoneyCompact(tour.prizePool)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
