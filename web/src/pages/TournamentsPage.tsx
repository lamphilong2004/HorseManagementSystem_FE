import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Tournament } from '../types'
import { getPublicTournaments } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getStatusClassName, getStatusLabel, TOURNAMENT_STATUS_OPTIONS } from '@/lib/status'
import { NumberCounter } from '@/components/ui/number-counter'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { CalendarRange, MapPin, RefreshCw, Search, Trophy, Users } from 'lucide-react'
import '@/styles/spectator.css'

const TIME_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'upcoming', label: 'Sắp diễn ra' },
  { value: 'ongoing', label: 'Đang diễn ra' },
  { value: 'completed', label: 'Đã kết thúc' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
]

function statusBadge(s?: string) {
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
  const [statusFilter, setStatusFilter] = useState('PUBLISHED')
  const [timeFilter, setTimeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getPublicTournaments()
      .then((data: any) => {
        console.log("SPECTATOR RECEIVED TOURNAMENTS:", data)
        setItems(Array.isArray(data) ? data : (data.tournaments || []))
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
      if (timeFilter === 'upcoming') return ['DRAFT', 'PUBLISHED'].includes(tournament.status || '') || startDate > now
      if (timeFilter === 'ongoing') return ['ONGOING', 'ACTIVE'].includes(tournament.status || '') || (startDate <= now && endDate >= now)
      if (timeFilter === 'completed') return ['COMPLETED', 'CANCELLED', 'RESULT_CONFIRMED'].includes(tournament.status || '') || endDate < now
      return true
    })
    .sort((a, b) => {
      const diff = new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      return sortOrder === 'oldest' ? diff : -diff
    })

  const ongoingCount = items.filter((t) => ['ONGOING', 'ACTIVE'].includes(t.status || '')).length
  const completedCount = items.filter((t) => ['COMPLETED', 'CANCELLED', 'RESULT_CONFIRMED'].includes(t.status || '')).length

  return (
    <div className="space-y-8">

      {/* ══ Hero Header ══ */}
      <ScrollReveal direction="up" distance={40} duration={0.7} delay={0.05}>
        <div className="spectator-hero">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/25 flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-[var(--text)] tracking-tight m-0">Giải đấu</h1>
                  <p className="text-sm text-[var(--muted)] font-medium mt-1">
                    Theo dõi các giải đấu đua ngựa, lịch thi đấu và xếp hạng.
                  </p>
                </div>
              </div>

              {/* Summary Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold">
                  Tổng <NumberCounter value={items.length} duration={1} easing="easeOut" />
                </Badge>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold">
                  Đang diễn ra <NumberCounter value={ongoingCount} duration={1} delay={0.1} easing="easeOut" />
                </Badge>
                <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-300 font-bold">
                  Đã hoàn tất <NumberCounter value={completedCount} duration={1} delay={0.2} easing="easeOut" />
                </Badge>
              </div>
            </div>

            {/* Search + Actions */}
            <div className="flex flex-col gap-3 relative z-10 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm giải đấu..."
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  className="h-10 w-56 pl-9 border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] font-medium placeholder:text-[var(--muted)]/40"
                />
              </div>
              <Button
                variant="outline"
                className="h-10 font-semibold border-[var(--border)] bg-[var(--bg2)]/60 text-[var(--text)] hover:bg-[var(--surface-3)] gap-2"
                onClick={() => setReloadKey(reloadKey + 1)}
              >
                <RefreshCw className="h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {/* Status filters */}
            {TOURNAMENT_STATUS_OPTIONS.map((option: any) => (
              <button
                key={option.value || 'all'}
                className={`spectator-filter-pill ${(option.value ?? 'all') === statusFilter ? 'spectator-filter-pill-active' : ''}`}
                onClick={() => setStatusFilter(option.value ?? 'all')}
              >
                {option.label}
              </button>
            ))}
            <div className="w-px h-6 bg-[var(--border)] mx-1 self-center" />
            {/* Time filters */}
            {TIME_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`spectator-filter-pill ${option.value === timeFilter ? 'spectator-filter-pill-active' : ''}`}
                onClick={() => setTimeFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
            <div className="w-px h-6 bg-[var(--border)] mx-1 self-center" />
            {/* Sort */}
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`spectator-filter-pill ${option.value === sortOrder ? 'spectator-filter-pill-active' : ''}`}
                onClick={() => setSortOrder(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ══ Content ══ */}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="spectator-shimmer h-48" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="spectator-empty">
          <div className="spectator-empty-icon">🏆</div>
          <div className="text-lg font-bold text-[var(--text)]">Không có giải đấu phù hợp</div>
          <p className="mt-2 text-sm text-[var(--muted)] font-medium">Thử thay đổi trạng thái hoặc khung thời gian để tìm giải đấu khác.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredItems.map((tournament, index) => (
            <ScrollReveal key={tournament._id || tournament.id} direction="up" distance={40} duration={0.6} delay={index * 0.06}>
              <Link to={`/tournaments/${tournament._id || tournament.id}`} className="block group">
                <div className="spectator-tournament-card">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[var(--text)] group-hover:text-emerald-400 transition-colors truncate">
                          {tournament.name}
                        </h3>
                        {['ONGOING', 'ACTIVE'].includes(tournament.status || '') && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black tracking-wider uppercase animate-pulse shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            TRỰC TIẾP
                          </span>
                        )}
                      </div>
                      {tournament.venue && (
                        <div className="flex items-center gap-1.5 text-sm text-[var(--muted)] font-medium">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{tournament.venue}</span>
                        </div>
                      )}
                    </div>
                    {statusBadge(tournament.status || 'DRAFT')}
                  </div>

                  {/* Card Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 rounded-xl bg-[var(--bg2)]/40 px-3 py-2.5">
                      <CalendarRange className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-xs font-semibold text-[var(--muted)] truncate">
                        {formatDate(tournament.startDate)} → {formatDate(tournament.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl bg-[var(--bg2)]/40 px-3 py-2.5">
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-amber-400 truncate">
                        {formatMoney(tournament.prizePool)}
                      </span>
                    </div>
                    {tournament.maxHorses && (
                      <div className="flex items-center gap-2.5 rounded-xl bg-[var(--bg2)]/40 px-3 py-2.5 col-span-2">
                        <Users className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-xs font-semibold text-[var(--muted)]">
                          Tối đa {tournament.maxHorses} ngựa
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  )
}
