import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Tournament } from '../types'
import { getPublicTournaments } from '../api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { getStatusClassName, getStatusLabel, TOURNAMENT_STATUS_OPTIONS } from '@/lib/status'
import { CalendarRange, Filter, RefreshCw, Trophy } from 'lucide-react'

const TIME_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'upcoming', label: 'Sắp khai mạc' },
  { value: 'ongoing', label: 'Đang diễn ra' },
  { value: 'completed', label: 'Đã kết thúc' },
  { value: 'draft', label: 'Bản nháp' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
]

function getOptionLabel(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((option) => (option.value || 'all') === value)?.label || value
}

function statusBadge(s: string) {
  return (
    <Badge variant="outline" className={getStatusClassName(s, 'tournament')}>
      {getStatusLabel(s, 'tournament')}
    </Badge>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatMoney(n?: number) {
  if (!n) return '—'
  return n.toLocaleString('vi-VN') + ' ₫'
}

export function TournamentsPage() {
  const [items, setItems] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getPublicTournaments()
      .then((data) => {
        setItems(data.tournaments || [])
      })
      .catch(() => setError('Không thể tải danh sách giải đấu'))
      .finally(() => setLoading(false))
  }, [reloadKey])

  const filteredItems = [...items]
    .filter((tournament) => {
      if (statusFilter !== 'all' && tournament.status !== statusFilter) return false

      const now = Date.now()
      const startDate = new Date(tournament.startDate).getTime()
      const endDate = new Date(tournament.endDate).getTime()

      if (timeFilter === 'upcoming') {
        return ['DRAFT', 'PUBLISHED'].includes(tournament.status) || startDate > now
      }

      if (timeFilter === 'ongoing') {
        return ['ONGOING', 'ACTIVE'].includes(tournament.status) || (startDate <= now && endDate >= now)
      }

      if (timeFilter === 'completed') {
        return ['COMPLETED', 'CANCELLED', 'RESULT_CONFIRMED'].includes(tournament.status) || endDate < now
      }

      if (timeFilter === 'draft') {
        return tournament.status === 'DRAFT'
      }

      return true
    })
    .sort((a, b) => {
      const diff = new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      return sortOrder === 'oldest' ? diff : -diff
    })

  const ongoingCount = items.filter((tournament) => ['ONGOING', 'ACTIVE'].includes(tournament.status)).length
  const draftCount = items.filter((tournament) => tournament.status === 'DRAFT').length
  const completedCount = items.filter((tournament) => ['COMPLETED', 'CANCELLED', 'RESULT_CONFIRMED'].includes(tournament.status)).length

  return (
    <div className="space-y-6">
      <Card className="border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl">
        <CardHeader className="gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-purple-500/10 p-3 ring-1 ring-purple-500/20">
                <Trophy className="h-7 w-7 text-purple-300" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl text-slate-50">Giải đấu</CardTitle>
                <CardDescription className="max-w-2xl text-slate-300">
                  Theo dõi giải đấu theo trạng thái, thời gian diễn ra và sắp xếp danh sách theo nhu cầu.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-200">
                Tổng {items.length}
              </Badge>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                Đang diễn ra {ongoingCount}
              </Badge>
              <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-200">
                Đã hoàn tất {completedCount}
              </Badge>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">
                Bản nháp {draftCount}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
              <SelectTrigger className="h-11 w-[180px] border-slate-700 bg-slate-950/70 text-slate-100">
                {getOptionLabel(TOURNAMENT_STATUS_OPTIONS, statusFilter)}
              </SelectTrigger>
              <SelectContent>
                {TOURNAMENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value || 'all'} value={option.value || 'all'}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value ?? 'all')}>
              <SelectTrigger className="h-11 w-[180px] border-slate-700 bg-slate-950/70 text-slate-100">
                {getOptionLabel(TIME_OPTIONS, timeFilter)}
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value ?? 'newest')}>
              <SelectTrigger className="h-11 w-[180px] border-slate-700 bg-slate-950/70 text-slate-100">
                {getOptionLabel(SORT_OPTIONS, sortOrder)}
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="h-11 border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-900"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="border-slate-800/80 bg-slate-950/70">
          <CardContent className="py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-3xl">
              🏆
            </div>
            <div className="text-lg font-semibold text-slate-100">Không có giải đấu phù hợp</div>
            <p className="mt-2 text-sm text-slate-400">Thử thay đổi trạng thái hoặc khung thời gian để tìm giải đấu khác.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredItems.map((tournament) => (
            <Link key={tournament._id} to={`/tournaments/${tournament._id}`} className="group block">
              <Card className="h-full border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-purple-500/40 group-hover:shadow-xl group-hover:shadow-purple-500/10">
                <CardHeader className="space-y-3 border-b border-slate-800/60 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl text-slate-50 group-hover:text-purple-100">{tournament.name}</CardTitle>
                      <CardDescription className="text-slate-300">
                        {tournament.venue || 'Chưa xác định'}
                      </CardDescription>
                    </div>
                    {statusBadge(tournament.status || 'DRAFT')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-2">
                      <CalendarRange className="h-4 w-4 text-purple-300" />
                      <span>{formatDate(tournament.startDate)} → {formatDate(tournament.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-2">
                      <Filter className="h-4 w-4 text-blue-300" />
                      <span>{tournament.prizePool ? formatMoney(tournament.prizePool) : 'Chưa có giải thưởng'}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-2">
                      <span className="text-amber-300">🏅</span>
                      <span>{tournament.maxHorses ? `Tối đa ${tournament.maxHorses} ngựa` : 'Chưa giới hạn số ngựa'}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-2">
                      <span className="text-emerald-300">💰</span>
                      <span>{formatMoney(tournament.prizePool)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
