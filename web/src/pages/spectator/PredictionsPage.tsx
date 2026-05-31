import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Prediction, Race } from '../../types'
import { checkPredictionOpen, getMyPredictions, getPublicRaces, getRaceHorses, placePrediction } from '@/api'
import { AnimatedTable, type ColumnDef } from '@/components/ui/animated-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { getStatusClassName, getStatusLabel, PREDICTION_STATUS_OPTIONS } from '@/lib/status'
import { useSession } from '../../auth/SessionContext'
import { NumberCounter } from '@/components/ui/number-counter'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Magnetic } from '@/components/ui/magnetic'
import { BadgeDollarSign, RefreshCw, Sparkles, Trophy } from 'lucide-react'

function statusBadge(s: string) {
  return (
    <Badge variant="outline" className={`${getStatusClassName(s, 'prediction')} font-bold`}>
      {getStatusLabel(s, 'prediction')}
    </Badge>
  )
}

function formatMoney(n?: number) {
  if (n === undefined || n === null) return '—'
  if (n === 0) return '0 VND'
  return `${new Intl.NumberFormat('vi-VN').format(n)} VND`
}

function formatMoneyInput(value: string) {
  const digits = value.replace(/[^\d]/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('en-US')
}

function parseMoneyInput(value: string) {
  const digits = value.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('vi-VN')
}

const HISTORY_TIME_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: '7d', label: '7 ngày gần đây' },
  { value: '30d', label: '30 ngày gần đây' },
  { value: '90d', label: '90 ngày gần đây' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
]

function getOptionLabel(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((option) => (option.value || 'all') === value)?.label || value
}

function isWithinWindow(dateValue: string, window: string) {
  if (window === 'all') return true
  const now = Date.now()
  const createdAt = new Date(dateValue).getTime()
  const windows: Record<string, number> = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  }
  return now - createdAt <= windows[window]
}

export function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all')
  const [historyTimeFilter, setHistoryTimeFilter] = useState('all')
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const [historySortOrder, setHistorySortOrder] = useState('newest')
  const [historyReloadKey, setHistoryReloadKey] = useState(0)
  const { balance, updateBalance } = useSession()

  const [races, setRaces] = useState<Race[]>([])
  const [racesLoading, setRacesLoading] = useState(false)
  const [selectedRace, setSelectedRace] = useState('')
  const [horses, setHorses] = useState<any[]>([])
  const [horsesLoading, setHorsesLoading] = useState(false)
  const [selectedHorse, setSelectedHorse] = useState('')
  const [betAmount, setBetAmount] = useState('')
  const [predLoading, setPredLoading] = useState(false)
  const [predMsg, setPredMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPredOpen, setIsPredOpen] = useState(false)

  useEffect(() => {
    setHistoryLoading(true)
    getMyPredictions()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.predictions || data?.data || [])
        const mapped: Prediction[] = list.map((p: any, idx: number) => ({
          id: String(p._id || p.id || idx),
          _id: p._id || p.id,
          raceId: p.raceId,
          spectatorId: p.spectatorId,
          horseId: p.horseId || p.horse || null,
          pickedHorseName: p.pickedHorseName || p.horseName || (p.horse && p.horse.name) || undefined,
          betAmount: p.betAmount ?? p.bet_amount ?? 0,
          predictedPosition: p.predictedPosition ?? p.predicted_position,
          status: p.status ?? 'PENDING',
          prizeAmount: p.prizeAmount ?? p.prize_amount ?? p.payout ?? p.prize,
          actualPosition: p.actualPosition ?? p.actual_position,
          createdAt: p.createdAt || p.created_at || new Date().toISOString(),
        }))
        setPredictions(mapped)
      })
      .catch(() => setPredictions([]))
      .finally(() => setHistoryLoading(false))
  }, [historyReloadKey])

  useEffect(() => {
    setRacesLoading(true)
    getPublicRaces({ status: 'SCHEDULED' })
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.races || data?.data || [])
        setRaces(list)
      })
      .catch(() => setRaces([]))
      .finally(() => setRacesLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedRace) {
      setHorses([])
      setIsPredOpen(false)
      return
    }

    setHorsesLoading(true)
    Promise.all([
      getRaceHorses(selectedRace).catch(() => []),
      checkPredictionOpen(selectedRace).catch(() => ({ isOpen: false })),
    ])
      .then(([h, openStatus]) => {
        const horseList = Array.isArray(h) ? h : (h?.horses || h?.data || [])
        setHorses(horseList)
        setIsPredOpen(openStatus?.isOpen === true)
      })
      .finally(() => setHorsesLoading(false))
  }, [selectedRace])

  async function handleSubmit() {
    const betValue = parseMoneyInput(betAmount)
    if (!selectedRace || !selectedHorse || !betValue) return
    if (betValue < 100000 || betValue > 10000000) {
      setPredMsg({ type: 'error', text: 'Số tiền đặt cược phải từ 100,000 đến 10,000,000 VND' })
      return
    }
    if (balance < betValue) {
      setPredMsg({ type: 'error', text: 'Số dư tài khoản không đủ để đặt cược!' })
      return
    }
    setPredLoading(true)
    setPredMsg(null)

    try {
      await placePrediction(selectedRace, selectedHorse, betValue)
      updateBalance(balance - betValue)
      setPredMsg({ type: 'success', text: 'Dự đoán thành công! 🎉' })
      setSelectedRace('')
      setSelectedHorse('')
      setBetAmount('')
      setHistoryReloadKey((value) => value + 1)
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || 'Không thể đặt dự đoán'
      setPredMsg({ type: 'error', text: msg })
    } finally {
      setPredLoading(false)
    }
  }

  const totalBet = predictions.reduce((sum, prediction) => sum + (prediction.betAmount || 0), 0)
  const wonCount = predictions.filter((prediction) => prediction.status === 'WON').length
  const totalPayout = predictions
    .filter((prediction) => prediction.status === 'WON')
    .reduce((sum, prediction) => sum + (prediction.payout || 0), 0)

  const filteredHistory = [...predictions]
    .filter((prediction) => {
      if (historyStatusFilter !== 'all' && prediction.status !== historyStatusFilter) return false

      if (historySearchQuery.trim() !== '') {
        const query = historySearchQuery.toLowerCase()
        const matchesRace = String(prediction.raceId?.name || prediction.raceId || '').toLowerCase().includes(query)
        const matchesHorse = String(prediction.horseId?.name || prediction.horseId || '').toLowerCase().includes(query)
        if (!matchesRace && !matchesHorse) return false
      }

      return isWithinWindow(prediction.createdAt ?? '', historyTimeFilter)
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt ?? '').getTime() - new Date(b.createdAt ?? '').getTime()
      return historySortOrder === 'oldest' ? diff : -diff
    })

  const predictionsColumns: ColumnDef<Prediction & { id: string }>[] = [
    {
      id: 'race',
      header: 'Cuộc đua',
      cell: (prediction: any) => {
        return (
          <span className="font-bold text-(--text)">
            {prediction.raceId?.name || (typeof prediction.raceId === 'string' ? (
              <Link to={`/races/${prediction.raceId}`} className="text-amber-600 dark:text-amber-300 hover:underline">Xem cuộc đua</Link>
            ) : '—')}
          </span>
        )
      },
    },
    {
      id: 'horse',
      header: 'Ngựa',
      cell: (prediction: any) => (
        <span className="font-bold text-(--text)">
          {prediction.horseId?.name || '—'}
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Số tiền',
      cell: (prediction: any) => (
        <span className="font-bold text-(--text)">
          {formatMoney(prediction.betAmount)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (prediction: any) => statusBadge(prediction.status),
    },
    {
      id: 'payout',
      header: 'Tiền thưởng',
      cell: (prediction: any) => (
        <span className={prediction.status === 'WON' ? 'text-emerald-600 dark:text-emerald-300 font-black' : 'text-muted font-bold'}>
          {prediction.status === 'WON' ? formatMoney(prediction.payout) : '—'}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Ngày đặt',
      cell: (prediction: any) => (
        <span className="font-bold text-muted">
          {formatDate(prediction.createdAt)}
        </span>
      ),
    },
  ]

  const filteredHistoryWithId = filteredHistory.map((prediction, idx) => ({
    ...prediction,
    id: String(prediction._id || prediction.id || idx),
  }))

  return (
    <div className="space-y-6">
      <ScrollReveal direction="up" distance={60} duration={0.8} delay={0.1}>
        <Card className="border-border bg-(--surface) shadow-2xl card-hover">
          <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-amber-500/10 p-3 ring-1 ring-amber-500/20">
                  <Trophy className="h-7 w-7 text-amber-300" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-3xl text-(--text) font-black">Dự đoán kết quả</CardTitle>
                  <CardDescription className="max-w-2xl text-muted font-bold">
                    Theo dõi lịch sử dự đoán, lọc theo trạng thái hoặc thời gian và đặt dự đoán mới trong cùng một luồng.
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="font-black border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200">Tổng <NumberCounter value={predictions.length} duration={1.2} easing="easeOut" /></Badge>
                <Badge variant="outline" className="font-black border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">Đã thắng <NumberCounter value={wonCount} duration={1.2} delay={0.1} easing="easeOut" /></Badge>
                <Badge variant="outline" className="font-black border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-200">Tổng cược {formatMoney(totalBet)}</Badge>
                <Badge variant="outline" className="font-black border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-200">Tiền thưởng {formatMoney(totalPayout)}</Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                className="h-11 font-bold border-border bg-(--bg2) text-(--text) hover:bg-(--surface-strong)/50" 
                onClick={() => document.getElementById('history-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                📋 Lịch sử dự đoán
              </Button>
              <Button
                variant="outline"
                className="h-11 font-bold border-border bg-(--bg2) text-(--text) hover:bg-(--surface-strong)/50"
                onClick={() => setHistoryReloadKey((value) => value + 1)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </CardHeader>
        </Card>
      </ScrollReveal>

      <Magnetic intensity={0.3} range={150}>
        <Card className="border-border bg-(--surface) shadow-lg card-hover">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-xl text-(--text) font-black">
              <Sparkles className="h-5 w-5 text-amber-300" />
              Tạo dự đoán mới
            </CardTitle>
            <CardDescription className="text-muted font-bold">Chỉ các cuộc đua sắp diễn ra có thể đặt dự đoán.</CardDescription>
          </CardHeader>
        <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {predMsg && (
              <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${predMsg.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100' : 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-100'}`}>
                {predMsg.text}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-(--text)">Chọn cuộc đua</label>
              {racesLoading ? (
                <p className="text-sm text-muted font-bold">Đang tải...</p>
              ) : (
                <Select value={selectedRace} onValueChange={(value) => { setSelectedRace(value ?? ''); setSelectedHorse('') }}>
                  <SelectTrigger className="h-11 w-full border-border bg-(--bg2) text-(--text) font-bold">
                    {selectedRace ? `${races.find((race) => race._id === selectedRace)?.name || '— Chọn cuộc đua —'} (${getStatusLabel(races.find((race) => race._id === selectedRace)?.status, 'race')})` : '— Chọn cuộc đua —'}
                  </SelectTrigger>
                  <SelectContent>
                    {races.map((race) => (
                      <SelectItem key={race._id} value={race._id} className="font-bold">{race.name} ({getStatusLabel(race.status, 'race')})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedRace && !isPredOpen && !horsesLoading && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-100 font-bold">⚠️ Cuộc đua này chưa mở hoặc đã đóng dự đoán</div>
            )}

            {selectedRace && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-(--text)">Chọn ngựa dự đoán thắng</label>
                {horsesLoading ? (
                  <p className="text-sm text-muted font-bold">Đang tải danh sách ngựa...</p>
                ) : (
                  <Select value={selectedHorse} onValueChange={(value) => setSelectedHorse(value ?? '')}>
                    <SelectTrigger className="h-11 w-full border-border bg-(--bg2) text-(--text) font-bold">
                      {selectedHorse ? (horses.find((horse: any) => (horse.horse || horse.horseId || horse)._id === selectedHorse)?.name || '— Chọn ngựa —') : '— Chọn ngựa —'}
                    </SelectTrigger>
                    <SelectContent>
                      {horses.map((horse: any) => {
                        const item = horse.horse || horse.horseId || horse
                        return <SelectItem key={item._id} value={item._id} className="font-bold">{item.name}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {selectedRace && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-(--text)">Số tiền đặt cược</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  min="100000"
                  max="10000000"
                  step="50000"
                  value={betAmount}
                  onChange={(event) => setBetAmount(formatMoneyInput(event.target.value))}
                  placeholder="Ví dụ: 500,000"
                  className="h-11 border-border bg-(--bg2) text-(--text) placeholder:text-(--muted)/50 font-bold"
                />
                <div className="flex flex-wrap gap-2 mt-1">
                  {[500000, 1000000, 2000000, 5000000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className="h-8 px-3 rounded-lg border border-amber-500/30 text-amber-500 bg-amber-500/5 hover:bg-amber-500/20 font-bold text-xs transition-colors cursor-pointer"
                      onClick={() => setBetAmount(formatMoneyInput(String(amount)))}
                    >
                      {amount.toLocaleString('vi-VN')} VND
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted font-bold">Giới hạn từ 100,000 đến 10,000,000 VND.</p>
              </div>
            )}

            {selectedRace && (
              <Button className="h-11 w-full bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold" disabled={!selectedHorse || !betAmount || predLoading || !isPredOpen} onClick={handleSubmit}>
                {predLoading ? 'Đang xử lý...' : '✅ Xác nhận dự đoán'}
              </Button>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-(--bg2)/50 p-5">
            <div className="flex items-center gap-2 text-sm font-black text-(--text)">
              <BadgeDollarSign className="h-4 w-4 text-emerald-300" />
              Trạng thái phiên đặt cược
            </div>
            <div className="space-y-3 text-sm text-muted">
              <div className="flex items-center justify-between rounded-xl bg-(--surface-strong)/30 px-3 py-2 font-bold">
                <span className="font-bold">Cuộc đua mở dự đoán</span>
                <span className={isPredOpen ? 'text-emerald-600 dark:text-emerald-500 font-black' : 'text-amber-600 dark:text-amber-300 font-black'}>{isPredOpen ? 'Đang mở' : 'Chưa mở'}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-(--surface-strong)/30 px-3 py-2 font-bold">
                <span className="font-bold">Số ngựa khả dụng</span>
                <span className="text-(--text) font-black">{horses.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-(--surface-strong)/30 px-3 py-2 font-bold">
                <span className="font-bold">Tiền thưởng hiện tại</span>
                <span className="text-(--text) font-black">{formatMoney(totalPayout)}</span>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs leading-6 text-amber-800 dark:text-amber-100 font-bold">
                <div className="mb-1 font-black">Gợi ý</div>
                Hãy chọn một cuộc đua có trạng thái <span className="font-black underline">Đã lên lịch</span>, sau đó chọn ngựa và nhập số tiền trước khi xác nhận.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </Magnetic>

      <div id="history-section" className="pt-6">
        <ScrollReveal direction="up" distance={60} duration={0.8} delay={0.1}>
          <Card className="border-border bg-(--surface) shadow-2xl card-hover">
            <CardHeader className="border-b border-border gap-4 md:flex-row md:items-center md:justify-between pb-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl text-(--text) font-black">📋 Lịch sử dự đoán</CardTitle>
                <CardDescription className="text-muted font-bold">Xem và lọc lịch sử dự đoán đặt cược của bạn.</CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="text"
                  placeholder="Tìm kiếm dự đoán..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="h-11 w-56 border-border bg-(--bg2) text-(--text) font-semibold placeholder:text-(--muted)/50 focus:border-amber-500/50"
                />
                <Select value={historyStatusFilter} onValueChange={(value) => setHistoryStatusFilter(value ?? 'all')}>
                  <SelectTrigger className="h-11 w-45 border-border bg-(--bg2) text-(--text) font-bold">{getOptionLabel(PREDICTION_STATUS_OPTIONS, historyStatusFilter)}</SelectTrigger>
                  <SelectContent>
                    {PREDICTION_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value || 'all'} value={option.value || 'all'} className="font-bold">{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={historyTimeFilter} onValueChange={(value) => setHistoryTimeFilter(value ?? 'all')}>
                  <SelectTrigger className="h-11 w-45 border-border bg-(--bg2) text-(--text) font-bold">{getOptionLabel(HISTORY_TIME_OPTIONS, historyTimeFilter)}</SelectTrigger>
                  <SelectContent>
                    {HISTORY_TIME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="font-bold">{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={historySortOrder} onValueChange={(value) => setHistorySortOrder(value ?? 'newest')}>
                  <SelectTrigger className="h-11 w-45 border-border bg-(--bg2) text-(--text) font-bold">{getOptionLabel(SORT_OPTIONS, historySortOrder)}</SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="font-bold">{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {historyLoading ? (
                <div className="loading py-20"><div className="spinner" /></div>
              ) : filteredHistory.length === 0 ? (
                <div className="rounded-2xl border border-border bg-(--bg2)/60 px-6 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">🎯</div>
                  <div className="text-lg font-black text-(--text)">Chưa có dự đoán phù hợp</div>
                  <p className="mt-2 text-sm text-muted font-bold">Thay đổi bộ lọc để xem các dự đoán khác.</p>
                </div>
              ) : (
                <AnimatedTable
                  data={filteredHistoryWithId}
                  columns={predictionsColumns}
                  emptyMessage="Không có dự đoán phù hợp"
                />
              )}
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </div>
  )
}
