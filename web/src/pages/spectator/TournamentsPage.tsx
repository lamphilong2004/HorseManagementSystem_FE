import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Tournament } from '../../types'
import { getPublicTournaments } from '../../api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getStatusClassName, getStatusLabel, TOURNAMENT_STATUS_OPTIONS } from '@/lib/status'
import { NumberCounter } from '@/components/ui/number-counter'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Magnetic } from '@/components/ui/magnetic'
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
  return n.toLocaleString('vi-VN') + ' VND'
}

export function TournamentsPage() {
  const [items, setItems] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getPublicTournaments()
      .then((data: any) => {
        setItems(data.tournaments || [])
      })
      .catch(() => setError('Không thể tải danh sách giải đấu'))
      .finally(() => setLoading(false))
  }, [reloadKey])

  const filteredItems = [...items]
    .filter((tournament) => {
      if (statusFilter !== 'all' && tournament.status !== statusFilter) return false

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchesName = tournament.name?.toLowerCase().includes(query)
        const matchesVenue = tournament.venue?.toLowerCase().includes(query)
        const matchesDesc = tournament.description?.toLowerCase().includes(query)
        if (!matchesName && !matchesVenue && !matchesDesc) return false
      }

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
      <ScrollReveal direction="up" distance={60} duration={0.8} delay={0.1}>
        <Card className="border-[var(--border)] bg-[var(--surface)] shadow-2xl">
          <CardHeader className="gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-purple-500/10 p-3 ring-1 ring-purple-500/20">
                  <Trophy className="h-7 w-7 text-purple-500" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-3xl text-[var(--text)]">Giải đấu</CardTitle>
                  <CardDescription className="max-w-2xl text-[var(--muted)]">
                    Theo dõi giải đấu theo trạng thái, thời gian diễn ra và sắp xếp danh sách theo nhu cầu.
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300">
                  Tổng <NumberCounter value={items.length} duration={1.2} easing="easeOut" />
                </Badge>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  Đang diễn ra <NumberCounter value={ongoingCount} duration={1.2} delay={0.1} easing="easeOut" />
                </Badge>
                <Badge variant="outline" className="border-[var(--border)] bg-[var(--bg2)] text-[var(--muted)]">
                  Đã hoàn tất <NumberCounter value={completedCount} duration={1.2} delay={0.2} easing="easeOut" />
                </Badge>
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300">
                  Bản nháp <NumberCounter value={draftCount} duration={1.2} delay={0.3} easing="easeOut" />
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <Input
                type="text"
                placeholder="Tìm kiếm giải đấu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-56 border-[var(--border)] bg-[var(--bg2)] text-[var(--text)] font-semibold placeholder:text-[var(--muted)]/50 focus:border-purple-500/50"
              />

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
                <SelectTrigger className="h-11 w-[180px] border-[var(--border)] bg-[var(--bg2)] text-[var(--text)]">
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
                onClick={() => setReloadKey((value) => value + 1)}
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
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-3xl">
              🏆
            </div>
            <div className="text-lg font-semibold text-[var(--text)]">Không có giải đấu phù hợp</div>
            <p className="mt-2 text-sm text-[var(--muted)]">Thử thay đổi trạng thái hoặc khung thời gian để tìm giải đấu khác.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredItems.map((tournament, index) => (
            <ScrollReveal key={tournament._id} direction="up" distance={60} duration={0.7} delay={index * 0.1}>
              <Link to={`/tournaments/${tournament._id}`} className="group block">
                <Magnetic intensity={0.3} range={120}>
                  <Card className="h-full border-[var(--border)] bg-[var(--surface)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-purple-500/40 group-hover:shadow-xl group-hover:shadow-purple-500/10 cursor-pointer">
                <CardHeader className="space-y-3 border-b border-[var(--border)] pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl text-[var(--text)] group-hover:text-purple-500">{tournament.name}</CardTitle>
                      <CardDescription className="text-[var(--muted)]">
                        {tournament.venue || 'Chưa xác định'}
                      </CardDescription>
                    </div>
                    {statusBadge(tournament.status || 'DRAFT')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--bg2)] px-3 py-2">
                      <CalendarRange className="h-4 w-4 text-purple-500" />
                      <span>{formatDate(tournament.startDate)} → {formatDate(tournament.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--bg2)] px-3 py-2">
                      <Filter className="h-4 w-4 text-blue-500" />
                      <span>{tournament.prizePool ? formatMoney(tournament.prizePool) : 'Chưa có giải thưởng'}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--bg2)] px-3 py-2">
                      <span className="text-amber-500">🏅</span>
                      <span>{tournament.maxHorses ? `Tối đa ${tournament.maxHorses} ngựa` : 'Chưa giới hạn số ngựa'}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--bg2)] px-3 py-2">
                      <span className="text-emerald-500">💰</span>
                      <span>{formatMoney(tournament.prizePool)}</span>
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
