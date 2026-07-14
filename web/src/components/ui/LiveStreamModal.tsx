import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X, Radio, Clock3, Ruler, Users, ExternalLink, Maximize2, RotateCcw, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getRaceHorses, publishRaceResult } from '@/api'
import {
  buildMockHorses,
  buildRaceSimulationPlans,
  getProgressAtElapsed,
  getRankedStreamHorses,
  getStreamHorseId,
  getStreamHorseName,
  getStreamJockeyName,
  getValueId,
} from '@/utils/liveStreamSimulation'

type GameState = 'countdown' | 'running' | 'finished'

interface LiveStreamModalProps {
  race: any
  onClose: () => void
}

const LANE_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#eab308',
  '#a855f7',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#38bdf8',
  '#f43f5e',
]

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function getTrackGeometry(totalHorses: number) {
  const startX = 260
  const endX = 540
  const centerY = 200
  const baseRadius = totalHorses > 12 ? 46 : 68
  const maxRadius = 170
  const laneGap = totalHorses > 1 ? Math.min(14, (maxRadius - baseRadius) / (totalHorses - 1)) : 0
  const laneStroke = Math.max(4, Math.min(12, laneGap * 0.9 || 10))

  return { startX, endX, centerY, baseRadius, maxRadius, laneGap, laneStroke }
}

function getHorseCoords(totalHorses: number, laneIndex: number, progress: number) {
  const { startX, endX, centerY, baseRadius, laneGap } = getTrackGeometry(totalHorses)
  const radius = baseRadius + laneIndex * laneGap
  const straightLength = endX - startX
  const curveLength = Math.PI * radius
  const totalLength = 2 * straightLength + 2 * curveLength
  const distance = (progress / 100) * totalLength

  if (distance <= straightLength) {
    return { x: startX + distance, y: centerY - radius }
  }

  if (distance <= straightLength + curveLength) {
    const curveDistance = distance - straightLength
    const theta = -Math.PI / 2 + curveDistance / radius
    return { x: endX + radius * Math.cos(theta), y: centerY + radius * Math.sin(theta) }
  }

  if (distance <= 2 * straightLength + curveLength) {
    const straightDistance = distance - (straightLength + curveLength)
    return { x: endX - straightDistance, y: centerY + radius }
  }

  const curveDistance = distance - (2 * straightLength + curveLength)
  const theta = Math.PI / 2 + curveDistance / radius
  return { x: startX + radius * Math.cos(theta), y: centerY + radius * Math.sin(theta) }
}

export function LiveStreamModal({ race, onClose }: LiveStreamModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadingHorses, setLoadingHorses] = useState(true)
  const [horses, setHorses] = useState<any[]>([])
  const [gameState, setGameState] = useState<GameState>('countdown')
  const [countdown, setCountdown] = useState<number | string>(3)
  const [elapsed, setElapsed] = useState(0)

  const simulationPlans = useMemo(() => buildRaceSimulationPlans(race, horses), [race, horses])
  const planById = useMemo(() => new Map(simulationPlans.map((plan) => [plan.streamId, plan])), [simulationPlans])
  const maxFinishTime = useMemo(
    () => simulationPlans.reduce((max, plan) => Math.max(max, plan.finishTime), 0),
    [simulationPlans],
  )
  const rankedLeaderboard = useMemo(
    () => getRankedStreamHorses(horses, simulationPlans, elapsed),
    [elapsed, horses, simulationPlans],
  )

  const resetSimulation = () => {
    setElapsed(0)
    setGameState('countdown')
    setCountdown(3)
  }

  useEffect(() => {
    let mounted = true

    async function fetchHorsesData() {
      setLoadingHorses(true)
      try {
        const raceId = getValueId(race)
        const list = raceId ? await getRaceHorses(raceId) : []
        if (!mounted) return
        setHorses(Array.isArray(list) && list.length > 0 ? list : buildMockHorses(6))
        resetSimulation()
      } catch (error) {
        console.error('Failed to load race horses, using mock list', error)
        if (!mounted) return
        setHorses(buildMockHorses(6))
        resetSimulation()
      } finally {
        if (mounted) setLoadingHorses(false)
      }
    }

    fetchHorsesData()
    return () => {
      mounted = false
    }
  }, [race])

  useEffect(() => {
    if (gameState !== 'countdown' || horses.length === 0 || loadingHorses) return

    let value = 3
    setCountdown(3)
    const timer = window.setInterval(() => {
      value -= 1
      if (value > 0) {
        setCountdown(value)
      } else if (value === 0) {
        setCountdown('XUẤT PHÁT!')
      } else {
        window.clearInterval(timer)
        startTimeRef.current = Date.now()
        setElapsed(0)
        setGameState('running')
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [gameState, horses.length, loadingHorses])

  useEffect(() => {
    if (gameState !== 'running') return

    const timer = window.setInterval(() => {
      const nextElapsed = Math.max(0, (Date.now() - startTimeRef.current) / 1000)
      if (maxFinishTime > 0 && nextElapsed >= maxFinishTime) {
        setElapsed(maxFinishTime)
        setGameState('finished')
        window.clearInterval(timer)
        return
      }
      setElapsed(nextElapsed)
    }, 90)

    return () => window.clearInterval(timer)
  }, [gameState, maxFinishTime])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])


  // Submit results automatically when race finishes
  useEffect(() => {
    if (gameState === 'finished' && rankedLeaderboard && rankedLeaderboard.length > 0) {
      const resultsPayload = rankedLeaderboard.map((horse, index) => ({
        horseId: horse.horse?._id || horse.horse?.id,
        registrationId: horse.id || horse.registrationId,
        rank: index + 1,
        finishTime: horse.finishTimeSeconds || 0
      }));
      
      const raceId = race?.id || race?._id;
      if (raceId) {
        publishRaceResult(raceId, resultsPayload).catch(err => {
          console.error('Failed to auto-submit race results:', err);
        });
      }
    }
  }, [gameState, rankedLeaderboard, race]);

  const restartRace = () => {
    resetSimulation()
  }

  const { startX, centerY, baseRadius, maxRadius, laneGap, laneStroke } = getTrackGeometry(horses.length)

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(event) => {
          if (event.target === overlayRef.current) onClose()
        }}
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          className={`relative flex flex-col overflow-hidden border border-white/10 bg-[#0b0f19] shadow-2xl ${
            isFullscreen ? 'h-full w-full rounded-none' : 'w-full max-w-5xl rounded-2xl'
          }`}
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#111827]/80 px-5 py-3.5 backdrop-blur-sm">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-white">{race?.name}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  {gameState === 'finished' ? 'Đã kết thúc' : `${Math.floor(elapsed)}s`} - {race?.distance || 0}m
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="outline" className="border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                <Radio className="mr-1 h-2.5 w-2.5 animate-pulse" />
                LIVE SIM
              </Badge>
              <button
                onClick={() => setIsFullscreen((value) => !value)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
                title="Toàn màn hình"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-red-500/30 hover:bg-red-500/20 hover:text-red-400"
                title="Đóng (ESC)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className={`relative flex flex-col overflow-hidden bg-[#161f30] ${isFullscreen ? 'flex-1' : 'aspect-[16/9]'}`}>
            {loadingHorses ? (
              <div className="flex flex-1 items-center justify-center font-semibold text-slate-400 animate-pulse">
                Đang chuẩn bị đường đua oval...
              </div>
            ) : (
              <div className="flex h-full flex-1 flex-col lg:flex-row">
                <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden bg-[#143e26] p-4">
                  <div className="pointer-events-none absolute inset-0 opacity-15 bg-[radial-gradient(#2f855a_1.5px,transparent_1.5px)] [background-size:24px_24px]" />

                  <svg viewBox="0 0 800 400" className="z-10 h-full max-h-[500px] w-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
                    {horses.map((_, index) => {
                      const radius = baseRadius + index * laneGap
                      const lanePath = `M 260,${centerY - radius} L 540,${centerY - radius} A ${radius},${radius} 0 0,1 540,${centerY + radius} L 260,${centerY + radius} A ${radius},${radius} 0 0,1 260,${centerY - radius}`

                      return (
                        <g key={`lane-${index}`}>
                          <path d={lanePath} fill="none" stroke="#263241" strokeWidth={laneStroke} opacity={0.92} />
                          <path d={lanePath} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={1.4} strokeDasharray="8,8" />
                        </g>
                      )
                    })}

                    <line x1={startX} y1={centerY - maxRadius - 8} x2={startX} y2={centerY - baseRadius + 8} stroke="white" strokeWidth={3} />
                    <line x1={startX} y1={centerY - maxRadius - 8} x2={startX} y2={centerY - baseRadius + 8} stroke="black" strokeWidth={3} strokeDasharray="4,4" />
                    <text x={startX} y={centerY - maxRadius - 18} fill="#facc15" fontSize="12" fontWeight="800" textAnchor="middle">
                      START / FINISH
                    </text>

                    {horses.map((horse, index) => {
                      const id = getStreamHorseId(horse, index)
                      const progress = getProgressAtElapsed(planById.get(id), elapsed)
                      const { x, y } = getHorseCoords(horses.length, index, progress)
                      const color = LANE_COLORS[index % LANE_COLORS.length]

                      return (
                        <g key={id} transform={`translate(${x}, ${y})`}>
                          <circle cx={0} cy={0} r={13} fill={color} opacity={0.95} stroke="white" strokeWidth={2} />
                          <text x={0} y={5} fill="white" fontSize="13" fontWeight="900" textAnchor="middle">
                            {index + 1}
                          </text>
                          <text x={0} y={-17} fill="white" fontSize="13" textAnchor="middle">
                            🐎
                          </text>
                        </g>
                      )
                    })}
                  </svg>

                  <div className="absolute bottom-3 left-3 z-20 max-h-[110px] space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/60 p-2 backdrop-blur-xs">
                    {horses.map((horse, index) => (
                      <div key={`legend-${getStreamHorseId(horse, index)}`} className="flex items-center gap-1.5 text-[9px] font-bold text-white">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: LANE_COLORS[index % LANE_COLORS.length] }} />
                        <span>Làn {index + 1}: {getStreamHorseName(horse, index)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex w-64 shrink-0 flex-col justify-between border-t border-white/5 bg-[#0d1424] p-4 lg:border-l lg:border-t-0">
                  <div>
                    <h3 className="mb-4 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-400">
                      <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                      Bảng xếp hạng
                    </h3>

                    <div className="space-y-2">
                      {rankedLeaderboard.map((entry, index) => {
                        const color = LANE_COLORS[entry.originalIndex % LANE_COLORS.length]

                        return (
                          <div key={entry.id} className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-2">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-black text-white">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                                <div className="truncate text-xs font-bold text-white">{getStreamHorseName(entry.horse, entry.originalIndex)}</div>
                              </div>
                              <div className="ml-3 truncate text-[9px] font-medium text-slate-400">
                                Nài: {getStreamJockeyName(entry.horse) || '—'}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              {entry.finishTime ? (
                                <div className="text-[10px] font-extrabold text-yellow-400">{entry.finishTime}s</div>
                              ) : (
                                <div className="font-mono text-[10px] text-slate-500">{Math.round(entry.progress)}%</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {gameState === 'finished' && (
                    <button
                      onClick={restartRace}
                      className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Mô phỏng lại
                    </button>
                  )}
                </div>
              </div>
            )}

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
                  <div className="text-6xl font-black tracking-widest text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
                    {countdown}
                  </div>
                  <div className="mt-2 text-xs font-extrabold uppercase tracking-widest text-yellow-400 drop-shadow-md">
                    Chuẩn bị xuất phát
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-white/[0.07] bg-[#111827]/60 px-5 py-3 sm:grid-cols-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
                <Clock3 className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase leading-none tracking-wider text-slate-500">Thời gian</div>
                <div className="mt-0.5 text-[11px] font-bold text-white">{formatDateTime(race?.scheduledAt)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
                <Ruler className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase leading-none tracking-wider text-slate-500">Cự ly</div>
                <div className="mt-0.5 text-[11px] font-bold text-white">{race?.distance ? `${race.distance}m` : '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase leading-none tracking-wider text-slate-500">Số ngựa</div>
                <div className="mt-0.5 text-[11px] font-bold text-white">{horses.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
                <ExternalLink className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-extrabold uppercase leading-none tracking-wider text-slate-500">Giải đấu</div>
                <div className="mt-0.5 truncate text-[11px] font-bold text-white">{race?.tournamentId?.name || 'Độc lập'}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
