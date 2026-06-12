import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Radio, Clock3, Ruler, Users, ExternalLink, Maximize2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Horse racing YouTube demo streams (public, no auth needed)
const DEMO_STREAMS = [
  'https://www.youtube.com/embed/sOtDE8ItJCk?autoplay=1&mute=1&controls=1',
  'https://www.youtube.com/embed/6iS8URBA65I?autoplay=1&mute=1&controls=1',
  'https://www.youtube.com/embed/dkUMpKEJCCU?autoplay=1&mute=1&controls=1',
]

function formatDateTime(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN')
}

interface LiveStreamModalProps {
  race: any
  onClose: () => void
}

export function LiveStreamModal({ race, onClose }: LiveStreamModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Pick a consistent demo stream based on race id hash
  const demoIndex = race?.name
    ? race.name.charCodeAt(0) % DEMO_STREAMS.length
    : 0

  const streamUrl = race?.streamUrl
    ? `${race.streamUrl}${race.streamUrl.includes('youtube') ? '&autoplay=1&mute=1' : ''}`
    : DEMO_STREAMS[demoIndex]

  // ESC key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      >
        <motion.div
          className={`relative flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[var(--surface)] ${
            isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-4xl'
          }`}
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/[0.07] bg-[var(--surface-2)]/60 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* Live dot */}
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <div className="min-w-0">
                <div className="font-extrabold text-[var(--text)] text-sm truncate">{race?.name}</div>
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">● TRỰC TIẾP</div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400 font-bold text-[10px] px-2 py-0.5">
                <Radio className="h-2.5 w-2.5 mr-1" />
                LIVE
              </Badge>
              <button
                onClick={() => setIsFullscreen(f => !f)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-[var(--muted)] hover:text-[var(--text)]"
                title="Toàn màn hình"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all text-[var(--muted)]"
                title="Đóng (ESC)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Stream Iframe */}
          <div className={`relative bg-black ${isFullscreen ? 'flex-1' : 'aspect-video'}`}>
            <iframe
              src={streamUrl}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={`Livestream: ${race?.name}`}
              style={{ border: 'none', display: 'block' }}
            />

            {/* Stream overlay label */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 pointer-events-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-[10px] font-black text-white tracking-widest uppercase">Live</span>
            </div>

            {/* Demo badge */}
            {!race?.streamUrl && (
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 pointer-events-none">
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Demo Stream</span>
              </div>
            )}
          </div>

          {/* Race Info Footer */}
          <div className="px-5 py-3 border-t border-white/[0.07] bg-[var(--surface-2)]/40 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Clock3 className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div>
                <div className="text-[9px] uppercase font-extrabold text-[var(--muted)]/50 tracking-wider leading-none">Thời gian</div>
                <div className="text-[11px] font-bold text-[var(--text)] mt-0.5">{formatDateTime(race?.scheduledAt)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Ruler className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div>
                <div className="text-[9px] uppercase font-extrabold text-[var(--muted)]/50 tracking-wider leading-none">Cự ly</div>
                <div className="text-[11px] font-bold text-[var(--text)] mt-0.5">{race?.distance ? `${race.distance}m` : '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[9px] uppercase font-extrabold text-[var(--muted)]/50 tracking-wider leading-none">Giới hạn</div>
                <div className="text-[11px] font-bold text-[var(--text)] mt-0.5">{race?.maxHorses ? `${race.maxHorses} ngựa` : '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <ExternalLink className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <div>
                <div className="text-[9px] uppercase font-extrabold text-[var(--muted)]/50 tracking-wider leading-none">Giải đấu</div>
                <div className="text-[11px] font-bold text-[var(--text)] mt-0.5 truncate">{race?.tournamentId?.name || 'Độc lập'}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
