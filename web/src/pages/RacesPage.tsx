import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicRaces } from '@/api'
import { Badge } from '@/components/ui/badge'
import type { DateRange } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown'
import { Input } from '@/components/ui/input'
import { getStatusClassName, getStatusLabel, RACE_STATUS_OPTIONS } from '@/lib/status'
import { NumberCounter } from '@/components/ui/number-counter'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Magnetic } from '@/components/ui/magnetic'
import { Clock3, RefreshCw, Search, ChevronDown, Ruler, Users, Award, Trophy, Radio } from 'lucide-react'
import { LiveStreamModal } from '@/components/ui/LiveStreamModal'
import { AnimatePresence, motion } from 'motion/react'
const TIME_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'upcoming', label: 'Sắp diễn ra' },
  { value: 'live', label: 'Đang diễn ra' },
  { value: 'completed', label: 'Đã hoàn tất' },
]
const SORT_OPTIONS = [
  { value: 'nearest', label: 'Gần nhất trước' },
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

function formatMoney(n?: number) {
  if (n === undefined || n === null) return '—'
  return n.toLocaleString('vi-VN') + ' VND'
}

export function RacesPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('nearest')
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedRace, setSelectedRace] = useState<any | null>(null)
  const [notStartedRace, setNotStartedRace] = useState<any | null>(null)

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

      // If a date range is provided, filter by that range
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
      const now = Date.now()
      // "nearest" = upcoming first (sorted by how close to now), then live, then completed
      if (sortOrder === 'nearest') {
        const statusOrder = (r: any) => {
          if (['ONGOING', 'LIVE'].includes(r.status)) return 0
          if (['SCHEDULED', 'PENDING'].includes(r.status)) return 1
          return 2
        }
        const sDiff = statusOrder(a) - statusOrder(b)
        if (sDiff !== 0) return sDiff
        // Within same group, sort by scheduled time ascending (nearest first)
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      }
      const diff = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      return sortOrder === 'oldest' ? diff : -diff
    })

  const handleRaceClick = (race: any) => {
    if (['ONGOING', 'LIVE'].includes(race.status)) {
      setSelectedRace(race)
    } else if (['SCHEDULED', 'PENDING'].includes(race.status)) {
      setNotStartedRace(race)
    } else {
      // Completed/cancelled — navigate to detail
      navigate(`/races/${race._id || race.id}`)
    }
  }

  const liveCount = items.filter((race) => ['ONGOING', 'LIVE'].includes(race.status)).length
  const upcomingCount = items.filter((race) => ['SCHEDULED', 'PENDING'].includes(race.status)).length
  const completedCount = items.filter((race) => ['COMPLETED', 'CANCELLED', 'RESULT_CONFIRMED'].includes(race.status)).length

  return (
    <div className="space-y-6">
      <ScrollReveal direction="up" distance={60} duration={0.8} delay={0.1}>
        <SpotlightCard>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-amber-500/10 p-3 ring-1 ring-amber-500/20 shrink-0">
                  <img src="/race.gif" className="h-7 w-7 object-contain" alt="Cuộc đua" />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-[var(--text)] tracking-tight">Cuộc đua</div>
                  <div className="max-w-2xl text-sm font-semibold text-[var(--muted)]">Theo dõi các cuộc đua theo trạng thái và thời gian diễn ra.</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 font-semibold px-2.5 py-1 text-xs">
                  Tổng <NumberCounter value={items.length} duration={1.2} easing="easeOut" />
                </Badge>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-semibold px-2.5 py-1 text-xs">
                  Đang diễn ra <NumberCounter value={liveCount} duration={1.2} delay={0.1} easing="easeOut" />
                </Badge>
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300 font-semibold px-2.5 py-1 text-xs">
                  Sắp diễn ra <NumberCounter value={upcomingCount} duration={1.2} delay={0.2} easing="easeOut" />
                </Badge>
                <Badge variant="outline" className="border-[var(--border)] bg-[var(--bg2)] text-[var(--muted)] font-semibold px-2.5 py-1 text-xs">
                  Đã hoàn tất <NumberCounter value={completedCount} duration={1.2} delay={0.3} easing="easeOut" />
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]/50 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm cuộc đua..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-60 pl-10 border border-[var(--border)] bg-[var(--bg2)] text-[var(--text)] text-sm font-semibold placeholder:text-[var(--muted)]/40 focus:border-amber-500/50 rounded-xl"
                />
              </div>

              <DropdownMenu
                trigger={
                  <button className="h-11 w-[180px] flex items-center justify-between px-4 border border-[var(--border)] bg-[var(--bg2)] hover:bg-[var(--surface-strong)] text-[var(--text)] text-sm font-semibold rounded-xl transition-all cursor-pointer">
                    <span className="truncate">{getOptionLabel(RACE_STATUS_OPTIONS, statusFilter)}</span>
                    <ChevronDown className="h-4 w-4 text-[var(--muted)]/60 shrink-0 ml-2" />
                  </button>
                }
              >
                {RACE_STATUS_OPTIONS.map((option) => (
                  <DropdownMenuItem key={option.value || 'all'} onClick={() => setStatusFilter(option.value || 'all')} active={statusFilter === (option.value || 'all')}>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenu>

              <DropdownMenu
                trigger={
                  <button className="h-11 w-[180px] flex items-center justify-between px-4 border border-[var(--border)] bg-[var(--bg2)] hover:bg-[var(--surface-strong)] text-[var(--text)] text-sm font-semibold rounded-xl transition-all cursor-pointer">
                    <span className="truncate">{getOptionLabel(TIME_OPTIONS, timeFilter)}</span>
                    <ChevronDown className="h-4 w-4 text-[var(--muted)]/60 shrink-0 ml-2" />
                  </button>
                }
              >
                {TIME_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.value} onClick={() => setTimeFilter(option.value)} active={timeFilter === option.value}>
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenu>

              <DropdownMenu
                trigger={
                  <button className="h-11 w-[180px] flex items-center justify-between px-4 border border-[var(--border)] bg-[var(--bg2)] hover:bg-[var(--surface-strong)] text-[var(--text)] text-sm font-semibold rounded-xl transition-all cursor-pointer">
                    <span className="truncate">{getOptionLabel(SORT_OPTIONS, sortOrder)}</span>
                    <ChevronDown className="h-4 w-4 text-[var(--muted)]/60 shrink-0 ml-2" />
                  </button>
                }
              >
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem key={option.value} onClick={() => setSortOrder(option.value)} active={sortOrder === option.value}>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenu>

              <Button
                variant="outline"
                className="h-11 border border-[var(--border)] bg-[var(--bg2)] text-[var(--text)] hover:bg-[var(--surface-strong)] rounded-xl font-semibold px-4 cursor-pointer"
                onClick={() => {
                  setReloadKey((value) => value + 1);
                  setDateRange(undefined);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </div>
        </SpotlightCard>
      </ScrollReveal>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="border-[var(--border)] bg-[var(--surface)] rounded-2xl">
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
              <div
                onClick={() => handleRaceClick(race)}
                className="group block cursor-pointer"
              >
                <Magnetic intensity={0.3} range={120}>
                  <SpotlightCard className="group-hover:-translate-y-1.5 transition-all duration-300">
                    <div className="p-6 space-y-5">
                      <div className="border-b border-white/[0.06] pb-4 flex items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-lg font-black text-[var(--text)] group-hover:text-amber-400 transition-colors duration-200 truncate leading-snug">
                              {race.name}
                            </div>
                            {['ONGOING', 'LIVE'].includes(race.status) && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
                                <Radio className="h-3 w-3 text-red-500 animate-pulse" />
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">Live</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--muted)]/70 font-bold flex items-center gap-1.5">
                            <Trophy className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />
                            <span className="truncate">{race.tournamentId?.name || 'Giải đấu độc lập'}</span>
                          </div>
                        </div>
                        <div className="shrink-0 pt-0.5">
                          {statusBadge(race.status)}
                        </div>
                      </div>

                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                        {/* Widget 1: Thời gian */}
                        <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 transition-all hover:bg-white/[0.04] hover:border-white/[0.08]">
                          <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <Clock3 className="h-4.5 w-4.5 text-amber-400" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Thời gian</span>
                            <span className="text-xs font-bold text-[var(--text)] truncate leading-normal">{formatDateTime(race.scheduledAt)}</span>
                          </div>
                        </div>

                        {/* Widget 2: Cự ly */}
                        <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 transition-all hover:bg-white/[0.04] hover:border-white/[0.08]">
                          <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <Ruler className="h-4.5 w-4.5 text-blue-400" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Cự ly</span>
                            <span className="text-xs font-bold text-[var(--text)] truncate leading-normal">{race.distance ? `${race.distance}m` : 'Chưa xác định'}</span>
                          </div>
                        </div>

                        {/* Widget 3: Giới hạn ngựa */}
                        <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 transition-all hover:bg-white/[0.04] hover:border-white/[0.08]">
                          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Users className="h-4.5 w-4.5 text-emerald-400" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Giới hạn ngựa</span>
                            <span className="text-xs font-bold text-[var(--text)] truncate leading-normal">{race.maxHorses ? `Tối đa ${race.maxHorses} ngựa` : 'Không giới hạn'}</span>
                          </div>
                        </div>

                        {/* Widget 4: Giải thưởng nhất */}
                        <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 transition-all hover:bg-white/[0.04] hover:border-white/[0.08]">
                          <div className="h-9 w-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                            <Award className="h-4.5 w-4.5 text-purple-400" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Giải nhất</span>
                            <span className="text-xs font-bold text-amber-400 truncate leading-normal">{race.prizeFirst ? formatMoney(race.prizeFirst) : 'Chưa cập nhật'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>
                </Magnetic>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* Livestream Modal */}
      {selectedRace && (
        <LiveStreamModal race={selectedRace} onClose={() => setSelectedRace(null)} />
      )}

      {/* Not Started Modal */}
      <AnimatePresence>
        {notStartedRace && (
          <motion.div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNotStartedRace(null)}
          >
            <motion.div
              className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-5"
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl">
                ⏳
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text)]">Cuộc đua chưa diễn ra</h3>
                <p className="text-[var(--muted)] font-semibold text-sm mt-2">
                  <span className="font-extrabold text-[var(--text)]">{notStartedRace.name}</span> chưa bắt đầu.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Clock3 className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-bold text-blue-400">
                    Lịch: {notStartedRace.scheduledAt ? new Date(notStartedRace.scheduledAt).toLocaleString('vi-VN') : '—'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setNotStartedRace(null)}
                  className="flex-1 h-10 rounded-xl border border-[var(--border)] bg-[var(--bg2)] text-[var(--text)] font-bold text-sm hover:bg-[var(--surface-strong)] transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => { setNotStartedRace(null); navigate(`/races/${notStartedRace._id || notStartedRace.id}`) }}
                  className="flex-1 h-10 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all cursor-pointer"
                >
                  Xem chi tiết
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
