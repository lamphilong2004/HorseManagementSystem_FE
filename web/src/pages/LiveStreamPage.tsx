import { useEffect, useState, useCallback } from 'react'
import { getPublicRaces } from '@/api'
import { LiveStreamModal } from '@/components/ui/LiveStreamModal'
import { Badge } from '@/components/ui/badge'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { NumberCounter } from '@/components/ui/number-counter'
import { motion, AnimatePresence } from 'motion/react'
import { Radio, Clock3, Ruler, Users, RefreshCw, Tv2 } from 'lucide-react'

function formatDateTime(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN')
}

export function LiveStreamPage() {
  const [races, setRaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRace, setSelectedRace] = useState<any | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchRaces = useCallback(() => {
    setLoading(true)
    setError(null)
    getPublicRaces()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.races || data?.data || [])
        setRaces(list)
        setLastRefresh(new Date())
      })
      .catch(() => setError('Không thể tải danh sách cuộc đua'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRaces()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRaces, 30000)
    return () => clearInterval(interval)
  }, [fetchRaces])

  const now = Date.now()
  const liveRaces = races.filter(r => ['ONGOING', 'LIVE'].includes(r.status || ''))
  const upcomingRaces = races
    .filter(r =>
      ['SCHEDULED', 'PENDING'].includes(r.status || '') &&
      new Date(r.scheduledAt).getTime() > now
    )
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 6)

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollReveal direction="up" distance={50} duration={0.7}>
        <SpotlightCard>
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-red-500/10 p-3 ring-1 ring-red-500/20 shrink-0">
                <Tv2 className="h-7 w-7 text-red-500" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-3xl font-black text-[var(--text)] tracking-tight">Livestream</h1>
                  {liveRaces.length > 0 && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-[var(--muted)] mt-0.5">
                  Xem trực tiếp các cuộc đua đang diễn ra
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 font-bold px-3 py-1">
                  <Radio className="h-3 w-3 mr-1.5" />
                  <NumberCounter value={liveRaces.length} duration={1} /> Đang LIVE
                </Badge>
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 font-bold px-3 py-1">
                  Sắp tới <NumberCounter value={upcomingRaces.length} duration={1} delay={0.1} />
                </Badge>
              </div>
              <button
                onClick={fetchRaces}
                disabled={loading}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg2)] hover:bg-[var(--surface-strong)] text-[var(--muted)] hover:text-[var(--text)] transition-all text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>
          {lastRefresh && (
            <div className="px-6 pb-4 text-[10px] text-[var(--muted)]/50 font-bold">
              Cập nhật lúc {lastRefresh.toLocaleTimeString('vi-VN')} · Tự động làm mới mỗi 30 giây
            </div>
          )}
        </SpotlightCard>
      </ScrollReveal>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* LIVE Races Section */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <h2 className="text-lg font-black text-[var(--text)]">Đang phát trực tiếp</h2>
          <span className="text-xs text-[var(--muted)] font-semibold">({liveRaces.length} cuộc đua)</span>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3 animate-pulse">
                <div className="h-5 bg-[var(--surface-3)]/60 rounded-lg w-3/4" />
                <div className="aspect-video bg-[var(--surface-3)]/40 rounded-xl" />
              </div>
            ))}
          </div>
        ) : liveRaces.length === 0 ? (
          <SpotlightCard>
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl">
                📺
              </div>
              <div className="text-lg font-black text-[var(--text)]">Chưa có cuộc đua nào đang live</div>
              <p className="text-sm font-semibold text-[var(--muted)] max-w-sm mx-auto">
                Các cuộc đua đang diễn ra sẽ xuất hiện ở đây. Trang sẽ tự động cập nhật sau 30 giây.
              </p>
            </div>
          </SpotlightCard>
        ) : (
          <AnimatePresence>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveRaces.map((race, index) => (
                <ScrollReveal key={race._id || race.id} direction="up" distance={40} duration={0.6} delay={index * 0.08}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedRace(race)}
                    className="relative group cursor-pointer rounded-2xl border border-red-500/20 bg-[var(--surface)] overflow-hidden transition-all duration-300 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10"
                  >
                    {/* Thumbnail / Preview */}
                    <div className="relative aspect-video bg-gradient-to-br from-red-950/30 to-black flex items-center justify-center overflow-hidden">
                      {/* Fake video preview */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                      <img
                        src={`https://img.youtube.com/vi/sOtDE8ItJCk/hqdefault.jpg`}
                        alt="Stream preview"
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      {/* Play button overlay */}
                      <motion.div
                        className="relative z-10 flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                      >
                        <div className="h-14 w-14 rounded-full bg-red-500/90 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:bg-red-500 transition-colors">
                          <svg className="h-6 w-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </motion.div>
                      {/* Live badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 shadow-md">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                        </span>
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Live</span>
                      </div>
                      {/* Duration indicator */}
                      <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white">
                        TRỰC TIẾP
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-extrabold text-[var(--text)] text-sm leading-snug group-hover:text-red-400 transition-colors">{race.name}</h3>
                        <p className="text-[11px] text-[var(--muted)] font-semibold mt-0.5">
                          🏆 {race.tournamentId?.name || 'Giải đấu độc lập'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[var(--muted)] font-bold">
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {formatDateTime(race.scheduledAt)}
                        </span>
                        {race.distance && (
                          <span className="flex items-center gap-1">
                            <Ruler className="h-3 w-3" />
                            {race.distance}m
                          </span>
                        )}
                        {race.maxHorses && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {race.maxHorses} ngựa
                          </span>
                        )}
                      </div>
                      <div className="pt-1">
                        <div className="w-full h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 group-hover:bg-red-500/20 transition-colors">
                          <Radio className="h-3.5 w-3.5 text-red-400" />
                          <span className="text-[11px] font-extrabold text-red-400">Xem ngay</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </AnimatePresence>
        )}
      </section>

      {/* Upcoming Section */}
      {upcomingRaces.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
            <h2 className="text-lg font-black text-[var(--text)]">Sắp phát trực tiếp</h2>
            <span className="text-xs text-[var(--muted)] font-semibold">(theo lịch)</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {upcomingRaces.map((race, index) => (
              <ScrollReveal key={race._id || race.id} direction="up" distance={30} duration={0.5} delay={index * 0.06}>
                <div className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-blue-500/30 transition-all duration-200 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Clock3 className="h-4.5 w-4.5 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-[var(--text)] text-sm truncate group-hover:text-blue-400 transition-colors">{race.name}</div>
                    <div className="text-[10px] text-[var(--muted)] font-bold mt-0.5 truncate">{formatDateTime(race.scheduledAt)}</div>
                  </div>
                  <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 font-bold text-[10px] shrink-0">
                    Sắp tới
                  </Badge>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      {selectedRace && (
        <LiveStreamModal race={selectedRace} onClose={() => setSelectedRace(null)} />
      )}
    </div>
  )
}
