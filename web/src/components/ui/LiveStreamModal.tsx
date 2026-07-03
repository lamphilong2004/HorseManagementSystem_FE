import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Radio, Clock3, Ruler, Users, ExternalLink, Maximize2, RotateCcw, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getHorsesByRace } from '@/api'

function formatDateTime(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN')
}

// Seeded Pseudo-Random Generator (Fnv-1a + LCG)
function createSeededRandom(seedString: string) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 16777619)
  }
  let seed = h >>> 0
  return function() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

// Deterministic progress based on elapsed time and stable index
function getProgressAtTime(elapsedTimeSec: number, index: number, raceId: string) {
  const random = createSeededRandom(`${raceId}-${index}`)
  const baseSpeed = 3.8 + random() * 1.8 // 3.8% to 5.6% progress per second
  const freq = 0.4 + random() * 0.8
  const amp = 0.5 + random() * 1.5

  let progress = baseSpeed * elapsedTimeSec + Math.sin(elapsedTimeSec * freq) * amp
  return Math.max(0, progress)
}

interface LiveStreamModalProps {
  race: any
  onClose: () => void
}

const LANE_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Green
  '#eab308', // Yellow
  '#a855f7', // Purple
  '#f97316', // Orange
  '#ec4899', // Pink
  '#14b8a6', // Teal
]

export function LiveStreamModal({ race, onClose }: LiveStreamModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number>(0) // Persistent start time reference
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadingHorses, setLoadingHorses] = useState(true)
  const [horses, setHorses] = useState<any[]>([])

  // Simulation states: 'countdown' | 'running' | 'finished'
  const [gameState, setGameState] = useState<'countdown' | 'running' | 'finished'>('countdown')
  const [countdown, setCountdown] = useState<number | string>(3)
  const [progress, setProgress] = useState<{ [key: string]: number }>({})
  const [finishedHorses, setFinishedHorses] = useState<any[]>([])

  // Fetch horses in the race
  useEffect(() => {
    async function fetchHorsesData() {
      try {
        setLoadingHorses(true)
        const raceId = race.id || race._id
        const list = await getHorsesByRace(raceId)
        
        if (!list || list.length === 0) {
          const mockList = Array.from({ length: 6 }).map((_, i) => ({
            registrationId: `mock-reg-${i}`,
            horse: {
              _id: `mock-horse-${i}`,
              name: `Hỏa Phong ${i + 1}`,
              breed: 'Thần Mã',
            },
            jockeyName: `Nài ngựa ${i + 1}`,
          }))
          setHorses(mockList)
        } else {
          setHorses(list)
        }
      } catch (err) {
        console.error('Failed to load race horses, using mock list', err)
        const mockList = Array.from({ length: 6 }).map((_, i) => ({
          registrationId: `mock-reg-${i}`,
          horse: {
            _id: `mock-horse-${i}`,
            name: `Hỏa Phong ${i + 1}`,
            breed: 'Thần Mã',
          },
          jockeyName: `Nài ngựa ${i + 1}`,
        }))
        setHorses(mockList)
      } finally {
        setLoadingHorses(false)
      }
    }
    fetchHorsesData()
  }, [race])

  // Initialize progress
  useEffect(() => {
    if (horses.length > 0) {
      const initProgress: { [key: string]: number } = {}
      horses.forEach((h) => {
        initProgress[h.registrationId] = 0
      })
      setProgress(initProgress)
      setFinishedHorses([])
      setGameState('countdown')
      setCountdown(3)
    }
  }, [horses])

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'countdown' || horses.length === 0) return

    let timer = 3
    setCountdown(3)

    const interval = setInterval(() => {
      timer -= 1
      if (timer > 0) {
        setCountdown(timer)
      } else if (timer === 0) {
        setCountdown('XUẤT PHÁT!')
      } else {
        clearInterval(interval)
        startTimeRef.current = Date.now() // Record race start timestamp
        setGameState('running')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState, horses])

  // Main simulation loop with slower speed - Deterministic and frame-rate independent
  useEffect(() => {
    if (gameState !== 'running') return

    let active = true
    const raceId = race.id || race._id || 'default-race-id'

    // Get stable index by sorting horse IDs alphabetically
    const sortedHorseIds = [...horses]
      .map(h => {
        const horse = h.horse || h.horseId || h
        return String(horse?._id || horse?.id || '')
      })
      .sort()

    const updateSimulation = () => {
      if (!active) return

      const elapsed = (Date.now() - startTimeRef.current) / 1000

      setProgress((prev) => {
        const next = { ...prev }
        let allFinished = true

        horses.forEach((h) => {
          const horse = h.horse || h.horseId || h
          const horseId = String(horse?._id || horse?.id || '')
          const stableIndex = sortedHorseIds.indexOf(horseId)

          const currentProgress = next[h.registrationId] || 0
          if (currentProgress < 100) {
            allFinished = false
            const nextProgress = Math.min(100, getProgressAtTime(elapsed, stableIndex, raceId))
            next[h.registrationId] = nextProgress

            if (nextProgress >= 100) {
              setFinishedHorses((prevFinished) => {
                if (prevFinished.some((f) => f.registrationId === h.registrationId)) {
                  return prevFinished
                }
                // Deterministic finish time based on when it crossed 100%
                let crossTime = elapsed
                for (let t = elapsed - 0.5; t <= elapsed; t += 0.01) {
                  if (t > 0 && getProgressAtTime(t, stableIndex, raceId) >= 100) {
                    crossTime = t
                    break
                  }
                }
                return [...prevFinished, { ...h, time: crossTime.toFixed(3) }]
              })
            }
          }
        })

        if (allFinished) {
          setGameState('finished')
          active = false
        }

        return next
      })

      if (active) {
        requestAnimationFrame(updateSimulation)
      }
    }

    requestAnimationFrame(updateSimulation)

    return () => {
      active = false
    }
  }, [gameState, horses, race])

  const restartRace = () => {
    const initProgress: { [key: string]: number } = {}
    horses.forEach((h) => {
      initProgress[h.registrationId] = 0
    })
    setProgress(initProgress)
    setFinishedHorses([])
    setGameState('countdown')
    setCountdown(3)
  }

  // Trigonometry calculation for placing horses on the oval track (800x400 SVG canvas)
  const getHorseCoords = (laneIndex: number, p: number) => {
    // Parameterized oval track
    const startX = 250
    const endX = 550
    const centerY = 200
    
    // Each lane has a different radius
    const baseRadius = 75
    const laneWidth = 14
    const r = baseRadius + laneIndex * laneWidth

    // Total distance of one oval lap
    const straightLength = endX - startX // 300
    const curveLength = Math.PI * r
    const totalLength = 2 * straightLength + 2 * curveLength
    
    const d = (p / 100) * totalLength

    let x = 0
    let y = 0
    let angle = 0 // heading angle in radians

    if (d <= straightLength) {
      // 1. Top Straight (Left to Right)
      x = startX + d
      y = centerY - r
      angle = 0 // pointing right
    } else if (d <= straightLength + curveLength) {
      // 2. Right Curve (Semi-circle)
      const dCurve = d - straightLength
      const theta = -Math.PI / 2 + dCurve / r
      x = endX + r * Math.cos(theta)
      y = centerY + r * Math.sin(theta)
      angle = theta + Math.PI / 2
    } else if (d <= 2 * straightLength + curveLength) {
      // 3. Bottom Straight (Right to Left)
      const dStraight = d - (straightLength + curveLength)
      x = endX - dStraight
      y = centerY + r
      angle = Math.PI // pointing left
    } else {
      // 4. Left Curve (Semi-circle)
      const dCurve = d - (2 * straightLength + curveLength)
      const theta = Math.PI / 2 + dCurve / r
      x = startX + r * Math.cos(theta)
      y = centerY + r * Math.sin(theta)
      angle = theta + Math.PI / 2
    }

    // Convert angle to degrees for rotation
    let angleDeg = (angle * 180) / Math.PI
    
    // Standard emoji 🐎 points left.
    // If heading right (between -90 and 90 deg), we mirror it.
    const isHeadingRight = Math.cos(angle) > 0
    const scaleX = isHeadingRight ? -1 : 1
    
    // Adjust angle when mirrored
    if (isHeadingRight) {
      angleDeg = angleDeg - 180
    }

    return { x, y, angleDeg, scaleX }
  }

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

  // Sort horses: finished horses first (by finish order), then running horses (by progress descending)
  const sortedLeaderboard = [...horses]
    .map((h) => ({
      ...h,
      prog: progress[h.registrationId] || 0,
    }))
    .sort((a, b) => {
      const aFinishIndex = finishedHorses.findIndex(f => f.registrationId === a.registrationId)
      const bFinishIndex = finishedHorses.findIndex(f => f.registrationId === b.registrationId)

      // If both finished, sort by their finish order
      if (aFinishIndex !== -1 && bFinishIndex !== -1) {
        return aFinishIndex - bFinishIndex
      }
      // If only 'a' finished, 'a' comes first
      if (aFinishIndex !== -1) return -1
      // If only 'b' finished, 'b' comes first
      if (bFinishIndex !== -1) return 1

      // Otherwise, sort by progress descending
      return b.prog - a.prog
    })

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          className={`relative flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b0f19] ${
            isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl'
          }`}
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/[0.07] bg-[#111827]/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <div className="min-w-0">
                <div className="font-extrabold text-white text-sm truncate">{race?.name}</div>
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">● ĐANG GIẢ LẬP ĐUA NGỰA (OVAL)</div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400 font-bold text-[10px] px-2 py-0.5">
                <Radio className="h-2.5 w-2.5 mr-1 animate-pulse" />
                LIVE SIMULATION
              </Badge>
              <button
                onClick={() => setIsFullscreen(f => !f)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-slate-400 hover:text-white"
                title="Toàn màn hình"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all text-slate-400"
                title="Đóng (ESC)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Simulation Area */}
          <div className={`relative bg-[#161f30] ${isFullscreen ? 'flex-1' : 'aspect-[16/9]'} flex flex-col overflow-hidden`}>
            {loadingHorses ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 font-semibold animate-pulse">
                Đang chuẩn bị đường đua hình oval và nài ngựa...
              </div>
            ) : (
              <div className="flex-1 flex flex-col lg:flex-row h-full">
                
                {/* SVG Oval Racetrack */}
                <div className="flex-1 bg-[#143e26] p-4 flex items-center justify-center relative min-h-[300px]">
                  
                  {/* Decorative Field Grass Detail */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#2f855a_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />
                  
                  {/* SVG Racetrack */}
                  <svg viewBox="0 0 800 400" className="w-full h-full max-h-[500px] z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
                    {/* Render Oval Tracks from Outer to Inner */}
                    {horses.map((_, i) => {
                      const baseRadius = 75
                      const laneWidth = 14
                      const r = baseRadius + i * laneWidth
                      
                      // SVG Path for the lane
                      return (
                        <g key={i}>
                          {/* Lane Roadway */}
                          <path
                            d={`M 250,${200 - r} L 550,${200 - r} A ${r},${r} 0 0,1 550,${200 + r} L 250,${200 + r} A ${r},${r} 0 0,1 250,${200 - r}`}
                            fill="none"
                            stroke="#2d3748"
                            strokeWidth="13"
                            opacity="0.8"
                          />
                          {/* Lane dashed separator line */}
                          <path
                            d={`M 250,${200 - r} L 550,${200 - r} A ${r},${r} 0 0,1 550,${200 + r} L 250,${200 + r} A ${r},${r} 0 0,1 250,${200 - r}`}
                            fill="none"
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth="1.5"
                            strokeDasharray="6,6"
                          />
                        </g>
                      )
                    })}

                    {/* Checkered Start/Finish Line at Top Left (x=250) */}
                    {(() => {
                      const minR = 75 - 6
                      const maxR = 75 + (horses.length - 1) * 14 + 6
                      return (
                        <g>
                          <line
                            x1="250"
                            y1={200 - maxR}
                            x2="250"
                            y2={200 - minR}
                            stroke="white"
                            strokeWidth="3"
                          />
                          <line
                            x1="250"
                            y1={200 - maxR}
                            x2="250"
                            y2={200 - minR}
                            stroke="black"
                            strokeWidth="3"
                            strokeDasharray="3,3"
                          />
                          {/* Start/Finish Text */}
                          <text
                            x="250"
                            y={200 - maxR - 10}
                            fill="#f6e05e"
                            fontSize="10"
                            fontWeight="black"
                            textAnchor="middle"
                            letterSpacing="1"
                          >
                            START / FINISH
                          </text>
                        </g>
                      )
                    })()}

                    {/* Horses Rendered as SVG HTML Elements overlay */}
                    {horses.map((h, i) => {
                      const currentProgress = progress[h.registrationId] || 0
                      const color = LANE_COLORS[i % LANE_COLORS.length]
                      const { x, y, angleDeg, scaleX } = getHorseCoords(i, currentProgress)

                      return (
                        <g key={h.registrationId} className="transition-transform duration-100 ease-out">
                          {/* Horse marker background circle */}
                          <circle
                            cx={x}
                            cy={y}
                            r="9"
                            fill={color}
                            stroke="white"
                            strokeWidth="1"
                            opacity="0.3"
                          />
                          {/* Lane Number label on map */}
                          <text
                            x={x}
                            y={y - 12}
                            fill="white"
                            fontSize="7"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {i+1}
                          </text>
                          {/* Horse Emoji with rotation and flips */}
                          <g transform={`translate(${x}, ${y})`}>
                            <text
                              x="0"
                              y="8"
                              fontSize="18"
                              textAnchor="middle"
                              style={{
                                transform: `rotate(${angleDeg}deg) scaleX(${scaleX})`,
                                transformOrigin: 'center',
                                display: 'block',
                                userSelect: 'none',
                              }}
                              className="animate-bounce"
                            >
                              🐎
                            </text>
                          </g>
                        </g>
                      )
                    })}
                  </svg>

                  {/* Lane Legends on Screen Bottom Left */}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs border border-white/10 rounded-lg p-2 max-h-[110px] overflow-y-auto z-20 space-y-1">
                    {horses.map((h, i) => (
                      <div key={h.registrationId} className="flex items-center gap-1.5 text-[9px] font-bold text-white">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: LANE_COLORS[i % LANE_COLORS.length] }} />
                        <span>Làn {i+1}: {h.horse?.name || `Ngựa số ${i+1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Leaderboard / Order Sidebar */}
                <div className="w-64 bg-[#0d1424] p-4 flex flex-col justify-between shrink-0 border-t lg:border-t-0 lg:border-l border-white/5">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                      <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                      Bảng xếp hạng
                    </h3>
                    
                    <div className="space-y-2">
                      {sortedLeaderboard.map((h, i) => {
                        const originalIndex = horses.findIndex((x) => x.registrationId === h.registrationId)
                        const color = LANE_COLORS[originalIndex % LANE_COLORS.length]
                        const isFinished = h.prog >= 100
                        const placeInFinished = finishedHorses.findIndex(f => f.registrationId === h.registrationId)

                        return (
                          <div key={h.registrationId} className="flex items-center gap-2.5 p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                            {/* Rank is strictly the index in the sorted list + 1 */}
                            <div className="w-5 h-5 rounded-lg flex items-center justify-center text-xs font-black bg-slate-800 text-white shrink-0">
                              {i + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                <div className="text-xs font-bold text-white truncate">{h.horse?.name}</div>
                              </div>
                              <div className="text-[9px] text-slate-400 font-medium truncate ml-3">Nài: {h.jockeyName || '—'}</div>
                            </div>
                            <div className="text-right shrink-0">
                              {isFinished && placeInFinished !== -1 ? (
                                <div className="text-[10px] font-extrabold text-yellow-400">
                                  {finishedHorses[placeInFinished].time}s
                                </div>
                              ) : (
                                <div className="text-[10px] font-mono text-slate-500">
                                  {Math.round(h.prog)}%
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions / Restart */}
                  {gameState === 'finished' && (
                    <button
                      onClick={restartRace}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20 mt-4"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Mô phỏng lại
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* Countdown Overlay */}
            {gameState === 'countdown' && !loadingHorses && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                <motion.div 
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <div className="text-6xl font-black text-white tracking-widest drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
                    {countdown}
                  </div>
                  <div className="text-xs font-extrabold text-yellow-400 uppercase tracking-widest mt-2 drop-shadow-md">
                    Chuẩn bị xuất phát
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Race Info Footer */}
          <div className="px-5 py-3 border-t border-white/[0.07] bg-[#111827]/60 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Clock3 className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div>
                <div className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider leading-none">Thời gian</div>
                <div className="text-[11px] font-bold text-white mt-0.5">{formatDateTime(race?.scheduledAt)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Ruler className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div>
                <div className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider leading-none">Cự ly</div>
                <div className="text-[11px] font-bold text-white mt-0.5">{race?.distance ? `${race.distance}m` : '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider leading-none">Giới hạn</div>
                <div className="text-[11px] font-bold text-white mt-0.5">{race?.maxHorses ? `${race.maxHorses} ngựa` : '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <ExternalLink className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <div>
                <div className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider leading-none">Giải đấu</div>
                <div className="text-[11px] font-bold text-white mt-0.5 truncate">{race?.tournamentId?.name || 'Độc lập'}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
