import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Race } from '../../types'
import { getPublicRaces } from '../../api'
import { Badge } from '@/components/ui/badge'
import { AnimatedCalendar, type DateRange } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getStatusClassName, getStatusLabel, RACE_STATUS_OPTIONS } from '@/lib/status'
import { NumberCounter } from '@/components/ui/number-counter'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Magnetic } from '@/components/ui/magnetic'
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getPublicRaces()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.races || data?.data || [])
        setItems(list)
      })
      .catch(() => setError('Không thể tải danh sách cuộc đua'))
      .finally(() => setLoading(false))
  }, [reloadKey])

  const filteredItems = [...items]
    .filter((race) => {
      if (statusFilter !== 'all' && race.status !== statusFilter) return false

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchesName = race.name?.toLowerCase().includes(query)
        const matchesTournament = race.tournamentId?.name?.toLowerCase().includes(query)
        if (!matchesName && !matchesTournament) return false
      }

      const scheduledAt = new Date(race.scheduledAt).getTime()
      const now = Date.now()

      if (timeFilter === 'upcoming') {
        if (!(['SCHEDULED', 'PENDING'].includes(race.status) || scheduledAt >= now)) return false
      }

      if (timeFilter === 'live') {
        if (!['ONGOING', 'LIVE'].includes(race.status)) return false
      }

      if (timeFilter === 'completed') {
        if (!(['COMPLETED', 'CANCELLED', 'RESULT_CONFIRMED'].includes(race.status) || scheduledAt < now)) return false
      }

      if (dateRange?.from) {
        const raceDate = new Date(race.scheduledAt)
        const start = new Date(dateRange.from)
        start.setHours(0, 0, 0, 0)
        
        if (dateRange.to) {
          const end = new Date(dateRange.to)
          end.setHours(23, 59, 59, 999)
          if (raceDate < start || raceDate > end) return false
        } else {
          const end = new Date(dateRange.from)
          end.setHours(23, 59, 59, 999)
          if (raceDate < start || raceDate > end) return false
        }
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
      <ScrollReveal direction="up" distance={60} duration={0.8} delay={0.1}>
        <Card className="border-[var(--border)] bg-[var(--surface)] shadow-2xl">
          <CardHeader className="gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-amber-500/10 p-3 ring-1 ring-amber-500/20">
                  <Route className="h-7 w-7 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-3xl text-[var(--text)]">Cuộc đua</CardTitle>
                  <CardDescription className="max-w-2xl text-[var(--muted)]">
                    Lọc nhanh theo trạng thái, mốc thời gian và thứ tự hiển thị để theo dõi các cuộc đua dễ hơn.
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300">
                  Tổng <NumberCounter value={items.length} duration={1.2} easing="easeOut" />
                </Badge>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  Đang diễn ra <NumberCounter value={liveCount} duration={1.2} delay={0.1} easing="easeOut" />
                </Badge>
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300">
                  Sắp diễn ra <NumberCounter value={upcomingCount} duration={1.2} delay={0.2} easing="easeOut" />
                </Badge>
                <Badge variant="outline" className="border-[var(--border)] bg-[var(--bg2)] text-[var(--muted)]">
                  Đã hoàn tất <NumberCounter value={completedCount} duration={1.2} delay={0.3} easing="easeOut" />
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="text"
                placeholder="Tìm kiếm cuộc đua..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-56 border-[var(--border)] bg-[var(--bg2)] text-[var(--text)] font-semibold placeholder:text-[var(--muted)]/50 focus:border-amber-500/50"
              />

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
                <SelectTrigger className="h-11 w-[180px] border-[var(--border)] bg-[var(--bg2)] text-[var(--text)]">
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
                <SelectTrigger className="h-11 w-[180px] border-[var(--border)] bg-[var(--bg2)] text-[var(--text)]">
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

              <AnimatedCalendar
                mode="range"
                value={dateRange}
                onChange={setDateRange}
                placeholder="Chọn khoảng ngày"
                showPresets
                className="h-11 w-[200px] border-[var(--border)] bg-[var(--bg2)] text-[var(--text)] rounded-md"
              />

              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value ?? 'newest')}>
                <SelectTrigger className="h-11 w-[180px] border-[var(--border)] bg-[var(--bg2)] text-[var(--text)]">
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
                className="h-11 border-[var(--border)] bg-[var(--bg2)] text-[var(--text)] hover:bg-[var(--surface-strong)]"
                onClick={() => {
                  setReloadKey((value) => value + 1);
                  setDateRange(undefined);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </CardHeader>
        </Card>
      </ScrollReveal>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardContent className="py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">
              🏇
            </div>
            <div className="text-lg font-semibold text-[var(--text)]">Chưa có cuộc đua nào phù hợp</div>
            <p className="mt-2 text-sm text-[var(--muted)]">Hãy thử thay đổi bộ lọc trạng thái hoặc thời gian.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredItems.map((race, index) => (
            <ScrollReveal key={race._id} direction="up" distance={60} duration={0.7} delay={index * 0.1}>
              <Link to={`/races/${race._id}`} className="group block">
                <Magnetic intensity={0.3} range={120}>
                  <Card className="h-full border-[var(--border)] bg-[var(--surface)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-500/40 group-hover:shadow-xl group-hover:shadow-amber-500/10 cursor-pointer">
                <CardHeader className="space-y-3 border-b border-[var(--border)] pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl text-[var(--text)] group-hover:text-amber-500">{race.name}</CardTitle>
                      <CardDescription className="text-[var(--muted)]">
                        {race.tournamentId?.name || 'Giải đấu độc lập'}
                      </CardDescription>
                    </div>
                    {statusBadge(race.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--bg2)] px-3 py-2">
                      <Clock3 className="h-4 w-4 text-amber-500" />
                      <span>{formatDateTime(race.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--bg2)] px-3 py-2">
                      <Filter className="h-4 w-4 text-blue-500" />
                      <span>{race.distance ? `${race.distance}m` : 'Chưa có cự ly'}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--bg2)] px-3 py-2">
                      <span className="text-amber-500">🏆</span>
                      <span>{race.tournamentId?.name || 'Không thuộc giải đấu'}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--bg2)] px-3 py-2">
                      <span className="text-emerald-500">🐴</span>
                      <span>{race.maxHorses ? `Tối đa ${race.maxHorses} ngựa` : 'Chưa giới hạn'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
                </Magnetic>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  )
}
