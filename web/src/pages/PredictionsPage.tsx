import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PredictionItem, Race } from '../types'
import { checkPredictionOpen, getMyPredictions, getPublicRaces, getRaceHorses, placePrediction } from '../api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { getStatusClassName, getStatusLabel, PREDICTION_STATUS_OPTIONS } from '@/lib/status'
import { BadgeDollarSign, RefreshCw, Sparkles, Trophy } from 'lucide-react'

function statusBadge(s: string) {
  return (
    <Badge variant="outline" className={getStatusClassName(s, 'prediction')}>
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
  const [predictions, setPredictions] = useState<PredictionItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all')
  const [historyTimeFilter, setHistoryTimeFilter] = useState('all')
  const [historySortOrder, setHistorySortOrder] = useState('newest')
  const [historyReloadKey, setHistoryReloadKey] = useState(0)
  const [historyOpen, setHistoryOpen] = useState(false)

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
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || [])
        setPredictions(list)
      })
      .catch(() => setPredictions([]))
      .finally(() => setHistoryLoading(false))
  }, [historyReloadKey])

  useEffect(() => {
    setRacesLoading(true)
    getPublicRaces({ status: 'SCHEDULED' })
      .then((data) => {
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
    setPredLoading(true)
    setPredMsg(null)

    try {
      await placePrediction(selectedRace, selectedHorse, betValue)
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
      return isWithinWindow(prediction.createdAt, historyTimeFilter)
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return historySortOrder === 'oldest' ? diff : -diff
    })

  return (
    <div className="space-y-6">
      <Card className="border-slate-800/80 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl">
        <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-amber-500/10 p-3 ring-1 ring-amber-500/20">
                <Trophy className="h-7 w-7 text-amber-300" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl text-slate-50">Dự đoán kết quả</CardTitle>
                <CardDescription className="max-w-2xl text-slate-300">
                  Theo dõi lịch sử dự đoán, lọc theo trạng thái hoặc thời gian và đặt dự đoán mới trong cùng một luồng.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">Tổng {predictions.length}</Badge>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">Đã thắng {wonCount}</Badge>
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-200">Tổng cược {formatMoney(totalBet)}</Badge>
              <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-200">Tiền thưởng {formatMoney(totalPayout)}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="h-11 border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-900" onClick={() => setHistoryOpen(true)}>
              📋 Lịch sử dự đoán
            </Button>
            <Button
              variant="outline"
              className="h-11 border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-900"
              onClick={() => setHistoryReloadKey((value) => value + 1)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-slate-800/80 bg-slate-950/70">
        <CardHeader className="border-b border-slate-800/60">
          <CardTitle className="flex items-center gap-2 text-xl text-slate-50">
            <Sparkles className="h-5 w-5 text-amber-300" />
            Tạo dự đoán mới
          </CardTitle>
          <CardDescription className="text-slate-400">Chỉ các cuộc đua sắp diễn ra có thể đặt dự đoán.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {predMsg && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${predMsg.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-red-500/30 bg-red-500/10 text-red-100'}`}>
                {predMsg.text}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Chọn cuộc đua</label>
              {racesLoading ? (
                <p className="text-sm text-slate-400">Đang tải...</p>
              ) : (
                <Select value={selectedRace} onValueChange={(value) => { setSelectedRace(value ?? ''); setSelectedHorse('') }}>
                  <SelectTrigger className="h-11 w-full border-slate-700 bg-slate-950/70 text-slate-100">
                    {selectedRace ? `${races.find((race) => race._id === selectedRace)?.name || '— Chọn cuộc đua —'} (${getStatusLabel(races.find((race) => race._id === selectedRace)?.status, 'race')})` : '— Chọn cuộc đua —'}
                  </SelectTrigger>
                  <SelectContent>
                    {races.map((race) => (
                      <SelectItem key={race._id} value={race._id}>{race.name} ({getStatusLabel(race.status, 'race')})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedRace && !isPredOpen && !horsesLoading && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">⚠️ Cuộc đua này chưa mở hoặc đã đóng dự đoán</div>
            )}

            {selectedRace && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Chọn ngựa dự đoán thắng</label>
                {horsesLoading ? (
                  <p className="text-sm text-slate-400">Đang tải danh sách ngựa...</p>
                ) : (
                  <Select value={selectedHorse} onValueChange={(value) => setSelectedHorse(value ?? '')}>
                    <SelectTrigger className="h-11 w-full border-slate-700 bg-slate-950/70 text-slate-100">
                      {selectedHorse ? (horses.find((horse: any) => (horse.horse || horse.horseId || horse)._id === selectedHorse)?.name || '— Chọn ngựa —') : '— Chọn ngựa —'}
                    </SelectTrigger>
                    <SelectContent>
                      {horses.map((horse: any) => {
                        const item = horse.horse || horse.horseId || horse
                        return <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {selectedRace && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Số tiền đặt cược</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  min="100000"
                  max="10000000"
                  step="50000"
                  value={betAmount}
                  onChange={(event) => setBetAmount(formatMoneyInput(event.target.value))}
                  placeholder="Ví dụ: 500,000"
                  className="h-11 border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-400">Giới hạn từ 100,000 đến 10,000,000 VND.</p>
              </div>
            )}

            {selectedRace && (
              <Button className="h-11 w-full bg-amber-500 text-slate-950 hover:bg-amber-400" disabled={!selectedHorse || !betAmount || predLoading || !isPredOpen} onClick={handleSubmit}>
                {predLoading ? 'Đang xử lý...' : '✅ Xác nhận dự đoán'}
              </Button>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <BadgeDollarSign className="h-4 w-4 text-emerald-300" />
              Trạng thái phiên đặt cược
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-3 py-2">
                <span>Cuộc đua mở dự đoán</span>
                <span className={isPredOpen ? 'text-emerald-300' : 'text-amber-300'}>{isPredOpen ? 'Đang mở' : 'Chưa mở'}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-3 py-2">
                <span>Số ngựa khả dụng</span>
                <span className="text-slate-100">{horses.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-3 py-2">
                <span>Tiền thưởng hiện tại</span>
                <span className="text-slate-100">{formatMoney(totalPayout)}</span>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs leading-6 text-amber-100">
                <div className="mb-1 font-semibold">Gợi ý</div>
                Hãy chọn một cuộc đua có trạng thái <span className="font-semibold">Đã lên lịch</span>, sau đó chọn ngựa và nhập số tiền trước khi xác nhận.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-6xl border border-slate-800/80 bg-slate-950 text-slate-100 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-800/60 pb-4">
            <DialogTitle className="text-2xl text-slate-50">📋 Lịch sử dự đoán</DialogTitle>
            <DialogDescription className="text-slate-400">Xem và lọc lịch sử dự đoán trong cửa sổ riêng.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="flex flex-wrap gap-3">
              <Select value={historyStatusFilter} onValueChange={(value) => setHistoryStatusFilter(value ?? 'all')}>
                <SelectTrigger className="h-11 w-45 border-slate-700 bg-slate-950/70 text-slate-100">{getOptionLabel(PREDICTION_STATUS_OPTIONS, historyStatusFilter)}</SelectTrigger>
                <SelectContent>
                  {PREDICTION_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value || 'all'} value={option.value || 'all'}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={historyTimeFilter} onValueChange={(value) => setHistoryTimeFilter(value ?? 'all')}>
                <SelectTrigger className="h-11 w-45 border-slate-700 bg-slate-950/70 text-slate-100">{getOptionLabel(HISTORY_TIME_OPTIONS, historyTimeFilter)}</SelectTrigger>
                <SelectContent>
                  {HISTORY_TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={historySortOrder} onValueChange={(value) => setHistorySortOrder(value ?? 'newest')}>
                <SelectTrigger className="h-11 w-45 border-slate-700 bg-slate-950/70 text-slate-100">{getOptionLabel(SORT_OPTIONS, historySortOrder)}</SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {historyLoading ? (
              <div className="loading py-20"><div className="spinner" /></div>
            ) : filteredHistory.length === 0 ? (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-6 py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">🎯</div>
                <div className="text-lg font-semibold text-slate-100">Chưa có dự đoán phù hợp</div>
                <p className="mt-2 text-sm text-slate-400">Thay đổi bộ lọc để xem các dự đoán khác.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-800/80">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-900/90 text-slate-300">
                    <tr>
                      <th className="px-4 py-3 font-medium">Cuộc đua</th>
                      <th className="px-4 py-3 font-medium">Ngựa</th>
                      <th className="px-4 py-3 font-medium">Số tiền</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                      <th className="px-4 py-3 font-medium">Tiền thưởng</th>
                      <th className="px-4 py-3 font-medium">Ngày đặt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/70">
                    {filteredHistory.map((prediction) => (
                      <tr key={prediction._id} className="transition-colors hover:bg-slate-900/70">
                        <td className="px-4 py-3 font-medium text-slate-100">
                          {prediction.raceId?.name || (typeof prediction.raceId === 'string' ? (
                            <Link to={`/races/${prediction.raceId}`} className="text-amber-300 hover:text-amber-200">Xem cuộc đua</Link>
                          ) : '—')}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{prediction.horseId?.name || '—'}</td>
                        <td className="px-4 py-3 font-medium text-slate-200">{formatMoney(prediction.betAmount)}</td>
                        <td className="px-4 py-3">{statusBadge(prediction.status)}</td>
                        <td className={`px-4 py-3 font-medium ${prediction.status === 'WON' ? 'text-emerald-300' : 'text-slate-300'}`}>
                          {prediction.status === 'WON' ? formatMoney(prediction.payout) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{formatDate(prediction.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
