import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Race } from '../types'
import { getPublicRaces } from '../api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { getStatusClassName, getStatusLabel, RACE_STATUS_OPTIONS } from '@/lib/status'
import { Clock3, Filter, RefreshCw, Route } from 'lucide-react'

const TIME_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'upcoming', label: 'Sắp diễn ra' },
  { value: 'live', label: 'Đang diễn ra' },
  { value: 'completed', label: 'Đã hoàn tất' },
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
    <Badge variant="outline" className={getStatusClassName(s, 'race')}>
      {s === 'ONGOING' && <span className="h-2 w-2 rounded-full bg-current animate-pulse" />}
      {getStatusLabel(s, 'race')}
    </Badge>
  )
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('vi-VN')
}

export function RacesPage() {
  const [items, setItems] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getPublicRaces()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.races || data?.data || [])
        setItems(list)
      })
      .catch(() => setError('Không thể tải danh sách cuộc đua'))
      .finally(() => setLoading(false))
  }, [reloadKey])

  const filteredItems = [...items]
    .filter((race) => {
      if (statusFilter !== 'all' && race.status !== statusFilter) return false

      const scheduledAt = new Date(race.scheduledAt).getTime()
      const now = Date.now()

      if (timeFilter === 'upcoming') {
        return ['SCHEDULED', 'PENDING'].includes(race.status) || scheduledAt >= now
      }

      if (timeFilter === 'live') {
        return ['ONGOING', 'LIVE'].includes(race.status)
      }

      if (timeFilter === 'completed') {
        return ['COMPLETED', 'CANCELLED', 'RESULT_CONFIRMED'].includes(race.status) || scheduledAt < now
      }

      return true
    })
    .sort((a, b) => {
      const diff = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      return sortOrder === 'oldest' ? diff : -diff
    })

  const liveCount = items.filter((race) => ['ONGOING', 'LIVE'].includes(race.status)).length
  const upcomingCount = items.filter((race) => ['SCHEDULED', 'PENDING'].includes(race.status)).length
  const completedCount = items.filter((race) => ['COMPLETED', 'CANCELLED', 'RESULT_CONFIRMED'].includes(race.status)).length

  return (
    <div className="space-y-6">
      <Card className="border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl">
        <CardHeader className="gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-amber-500/10 p-3 ring-1 ring-amber-500/20">
                <Route className="h-7 w-7 text-amber-300" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl text-slate-50">Cuộc đua</CardTitle>
                <CardDescription className="max-w-2xl text-slate-300">
                  Lọc nhanh theo trạng thái, mốc thời gian và thứ tự hiển thị để theo dõi các cuộc đua dễ hơn.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">
                Tổng {items.length}
              </Badge>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                Đang diễn ra {liveCount}
              </Badge>
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-200">
                Sắp diễn ra {upcomingCount}
              </Badge>
              <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-200">
                Đã hoàn tất {completedCount}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
              <SelectTrigger className="h-11 w-[180px] border-slate-700 bg-slate-950/70 text-slate-100">
                {getOptionLabel(RACE_STATUS_OPTIONS, statusFilter)}
              </SelectTrigger>
              <SelectContent>
                {RACE_STATUS_OPTIONS.map((option) => (
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
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">
              🏇
            </div>
            <div className="text-lg font-semibold text-slate-100">Chưa có cuộc đua nào phù hợp</div>
            <p className="mt-2 text-sm text-slate-400">Hãy thử thay đổi bộ lọc trạng thái hoặc thời gian.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredItems.map((race) => (
            <Link key={race._id} to={`/races/${race._id}`} className="group block">
              <Card className="h-full border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-500/40 group-hover:shadow-xl group-hover:shadow-amber-500/10">
                <CardHeader className="space-y-3 border-b border-slate-800/60 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl text-slate-50 group-hover:text-amber-100">{race.name}</CardTitle>
                      <CardDescription className="text-slate-300">
                        {race.tournamentId?.name || 'Giải đấu độc lập'}
                      </CardDescription>
                    </div>
                    {statusBadge(race.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-2">
                      <Clock3 className="h-4 w-4 text-amber-300" />
                      <span>{formatDateTime(race.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-2">
                      <Filter className="h-4 w-4 text-blue-300" />
                      <span>{race.distance ? `${race.distance}m` : 'Chưa có cự ly'}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-2">
                      <span className="text-amber-300">🏆</span>
                      <span>{race.tournamentId?.name || 'Không thuộc giải đấu'}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-2">
                      <span className="text-emerald-300">🐴</span>
                      <span>{race.maxHorses ? `Tối đa ${race.maxHorses} ngựa` : 'Chưa giới hạn'}</span>
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
