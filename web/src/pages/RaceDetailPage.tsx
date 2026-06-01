import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'
import type { Race, RaceResult } from '../types'
import { getPublicRace, getRaceHorses, getRaceResults, checkPredictionOpen, placePrediction } from '@/api'
import { AnimatedTable, type ColumnDef } from '../components/ui/animated-table'

function statusBadge(s?: string) {
  if (!s) return null
  return <span className={`badge badge-${s.toLowerCase()}`}>
    {s === 'ONGOING' && <span className="live-dot" />}
    {s}
  </span>
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('vi-VN')
}

function formatMoney(n?: number) {
  if (!n) return '—'
  return n.toLocaleString('vi-VN') + ' VND'
}

function parseMoney(value: string) {
  const digits = value.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

// ── Countdown Hook ─────────────────────────────────────────────────────────────
function useCountdown(targetDate?: string) {
  const [diff, setDiff] = useState(0)
  useEffect(() => {
    if (!targetDate) return
    const update = () => setDiff(new Date(targetDate).getTime() - Date.now())
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [targetDate])
  if (!targetDate || diff <= 0) return null
  const total = Math.floor(diff / 1000)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60
  return { days, hours, mins, secs }
}

// ── Share Function ──────────────────────────────────────────────────────────────
async function shareRaceResult(raceName: string) {
  const url = window.location.href
  const text = `🏁 Kết quả cuộc đua: ${raceName} | HorseRacing System`
  if (navigator.share) {
    try {
      await navigator.share({ title: text, text, url })
    } catch { /* user cancelled */ }
  } else {
    await navigator.clipboard.writeText(url)
    alert('Đã sao chép link kết quả vào clipboard! 📋')
  }
}

export function RaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { session, balance, updateBalance } = useSession()
  const isSpectator = session?.user.role === 'SPECTATOR'

  const [race, setRace] = useState<Race | null>(null)
  const [horses, setHorses] = useState<any[]>([])
  const [results, setResults] = useState<RaceResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Countdown
  const countdown = useCountdown(race?.scheduledAt)

  // Prediction state
  const [predOpen, setPredOpen] = useState(false)
  const [showPredModal, setShowPredModal] = useState(false)
  const [selectedHorse, setSelectedHorse] = useState('')
  const [betAmount, setBetAmount] = useState('')
  const [predLoading, setPredLoading] = useState(false)
  const [predMsg, setPredMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const selectedHorseData = horses.find((h: any) => {
    const horse = h?.horse || h?.horseId || h
    return (horse?._id || h?._id) === selectedHorse
  })
  const betValue = parseMoney(betAmount)
  const estimatedPayout = betValue > 0 ? Math.round(betValue * 1.9) : 0

  function openPredictionModal(horseId?: string) {
    setSelectedHorse(horseId || '')
    setBetAmount('')
    setPredMsg(null)
    setShowPredModal(true)
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getPublicRace(id).catch(() => null),
      getRaceHorses(id).catch(() => []),
      getRaceResults(id).catch(() => []),
    ])
      .then(([r, h, res]) => {
        if (!r) { setError('Không tìm thấy cuộc đua'); return }
        setRace(r)
        const horseList = Array.isArray(h) ? h : (h?.horses || h?.data || [])
        setHorses(horseList)
        setResults(Array.isArray(res) ? res : [])
      })
      .finally(() => setLoading(false))

    // Check prediction open for spectator
    if (isSpectator) {
      checkPredictionOpen(id).then((d: any) => setPredOpen(d?.isOpen === true)).catch(() => {})
    }
  }, [id, isSpectator])

  // Auto-refresh for ONGOING races
  useEffect(() => {
    if (!race || race.status !== 'ONGOING' || !id) return
    const timer = setInterval(() => {
      getRaceResults(id).then((res: any) => setResults(Array.isArray(res) ? res : [])).catch(() => {})
    }, 15000)
    return () => clearInterval(timer)
  }, [race, id])

  async function handlePrediction() {
    if (!id || !selectedHorse || !betAmount) return
    const amount = Number(betAmount)
    if (isNaN(amount) || amount < 100000 || amount > 10000000) {
      setPredMsg({ type: 'error', text: 'Số tiền đặt cược phải từ 100,000 đến 10,000,000 VND' })
      return
    }
    if (balance < amount) {
      setPredMsg({ type: 'error', text: 'Số dư tài khoản không đủ để đặt cược!' })
      return
    }
    setPredLoading(true)
    setPredMsg(null)
    try {
      await placePrediction(id, selectedHorse, amount)
      updateBalance(balance - amount)
      setPredMsg({ type: 'success', text: 'Dự đoán thành công! 🎉' })
      setShowPredModal(false)
      setPredOpen(false)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || 'Không thể đặt dự đoán'
      setPredMsg({ type: 'error', text: msg })
    } finally {
      setPredLoading(false)
    }
  }

  const horsesColumns: ColumnDef<any>[] = [
    {
      id: 'name',
      header: 'Tên ngựa',
      cell: (h: any) => {
        const horse = h?.horse || h?.horseId || h
        return <span className="fw-600 font-bold">{horse?.name || '—'}</span>
      },
    },
    {
      id: 'breed',
      header: 'Giống',
      cell: (h: any) => {
        const horse = h?.horse || h?.horseId || h
        return <span className="font-semibold">{horse?.breed || '—'}</span>
      },
    },
    {
      id: 'age',
      header: 'Tuổi',
      cell: (h: any) => {
        const horse = h?.horse || h?.horseId || h
        return <span className="font-semibold">{horse?.age ?? '—'}</span>
      },
    },
    {
      id: 'weight',
      header: 'Cân nặng',
      cell: (h: any) => {
        const horse = h?.horse || h?.horseId || h
        return <span className="font-semibold">{horse?.weight ? `${horse.weight} kg` : '—'}</span>
      },
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (h: any) => {
        const regStatus = h?.registrationStatus || h?.status || ''
        return regStatus ? <span className={`badge badge-${regStatus.toLowerCase()} font-bold`}>{regStatus}</span> : '—'
      },
    },
    ...(isSpectator ? [{
      id: 'predict',
      header: 'Dự đoán ngay',
      cell: (h: any) => {
        const horse = h?.horse || h?.horseId || h
        const horseId = horse?._id || h?._id
        return (
          <button
            className={`btn btnPrimary font-bold text-xs py-1 px-3 rounded-lg transition-colors cursor-pointer ${predOpen ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300 cursor-not-allowed opacity-70'}`}
            disabled={!predOpen}
            onClick={() => openPredictionModal(horseId)}
          >
            {predOpen ? '🎯 Dự đoán ngay' : 'Đã đóng'}
          </button>
        )
      },
    }] : []),
  ]

  const resultsColumns: ColumnDef<RaceResult & { id: string | number }>[] = [
    {
      id: 'position',
      header: 'Hạng',
      cell: (r: RaceResult, idx: number) => (
        <span className={`position-cell ${idx < 3 ? `rank-${idx + 1}` : ''}`}>
          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${r.position}`}
        </span>
      ),
    },
    {
      id: 'horse',
      header: 'Ngựa',
      cell: (r: RaceResult) => <span className="fw-600">{r.horseId?.name || r.horseId || '—'}</span>,
    },
    {
      id: 'jockey',
      header: 'Nài ngựa',
      cell: (r: RaceResult) => <span>{r.jockeyId?.fullName || r.jockeyId?.name || r.jockeyId || '—'}</span>,
    },
    {
      id: 'time',
      header: 'Thời gian',
      cell: (r: RaceResult) => <span className="fw-600">{r.finishTime || '—'}</span>,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (r: RaceResult) => <span className={`badge badge-${(r.status || '').toLowerCase()}`}>{r.status}</span>,
    },
    {
      id: 'prize',
      header: 'Giải thưởng',
      align: 'right' as const,
      cell: (r: RaceResult) => <span className="money">{formatMoney(r.prizeAmount)}</span>,
    },
  ]

  const horsesWithId = horses.map((h: any, idx: number) => {
    const horse = h?.horse || h?.horseId || h
    return {
      ...h,
      id: horse?._id || String(idx),
    }
  })

  const resultsWithId = [...results]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((r, idx) => ({ ...r, id: r._id || String(idx) }))

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (error) return (
    <div className="card">
      <Link to="/races" className="back-link">← Quay lại</Link>
      <div className="alert alert-error">⚠️ {error}</div>
    </div>
  )
  if (!race) return null

  return (
    <div>
      <Link to="/races" className="back-link">← Quay lại danh sách</Link>

      {/* Race Info Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex justify-between items-center flex-wrap gap-8">
          <div>
            <h1 style={{ margin: 0 }}>🏇 {race.name}</h1>
            {race.tournamentId?.name && <p className="muted mt-8">🏆 {race.tournamentId.name}</p>}
          </div>
          <div className="flex items-center gap-8">
            {statusBadge(race.status)}
            {isSpectator && predOpen && (
              <button className="btn btnPrimary" onClick={() => openPredictionModal()}>
                🎯 Dự đoán kết quả
              </button>
            )}
          </div>
        </div>

        <div className="stat-grid mt-16">
          <div className="stat-card">
            <div className="stat-icon">🕐</div>
            <div className="stat-label">Thời gian</div>
            <div className="stat-value" style={{ fontSize: 16 }}>{formatDateTime(race.scheduledAt)}</div>
          </div>
          {race.distance && (
            <div className="stat-card">
              <div className="stat-icon">📏</div>
              <div className="stat-label">Khoảng cách</div>
              <div className="stat-value">{race.distance}m</div>
            </div>
          )}
          <div className="stat-card">
            <div className="stat-icon">🐴</div>
            <div className="stat-label">Số ngựa</div>
            <div className="stat-value">{horses.length}{race.maxHorses ? ` / ${race.maxHorses}` : ''}</div>
          </div>
          {race.prizeFirst && (
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-label">Giải nhất</div>
              <div className="stat-value" style={{ fontSize: 18 }}>{formatMoney(race.prizeFirst)}</div>
            </div>
          )}
        </div>

        {predMsg && (
          <div className={`alert ${predMsg.type === 'success' ? 'alert-success' : 'alert-error'} mt-16`}>
            {predMsg.text}
          </div>
        )}
      </div>

      {/* Countdown — only when race is SCHEDULED */}
      {race.status === 'SCHEDULED' && countdown && (
        <div style={{ marginBottom: 16, padding: '14px 20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(245,158,11,0.08))', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-ring)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>⏳ Bắt đầu sau:</span>
          {[{ v: countdown.days, u: 'ngày' }, { v: countdown.hours, u: 'giờ' }, { v: countdown.mins, u: 'phút' }, { v: countdown.secs, u: 'giây' }].map(({ v, u }) => (
            <div key={u} style={{ textAlign: 'center', minWidth: 52, padding: '6px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1 }}>{String(v).padStart(2, '0')}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{u}</div>
            </div>
          ))}
        </div>
      )}

      {/* ONGOING race banner */}
      {race.status === 'ONGOING' && (
        <div className="alert alert-warning mb-16">
          <span className="live-dot" /> Cuộc đua đang diễn ra! Kết quả tự động cập nhật mỗi 15 giây.
        </div>
      )}

      {/* Horses */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 16 }}>🐴 Ngựa tham gia</h2>
        <AnimatedTable
          data={horsesWithId}
          columns={horsesColumns}
          emptyMessage={
            <div className="empty-state py-8">
              <div className="empty-state-text">Chưa có ngựa đăng ký</div>
            </div>
          }
        />
      </div>

      {/* Results */}
      {(race.status === 'COMPLETED' || race.status === 'RESULT_CONFIRMED' || results.length > 0) && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ margin: 0 }}>🏅 Kết quả cuộc đua</h2>
            {(race.status === 'COMPLETED' || race.status === 'RESULT_CONFIRMED') && (
              <button
                className="btn btn-sm"
                onClick={() => shareRaceResult(race.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                📤 Chia sẻ kết quả
              </button>
            )}
          </div>
          <AnimatedTable
            data={resultsWithId}
            columns={resultsColumns}
            emptyMessage={
              <div className="empty-state py-8">
                <div className="empty-state-text">Chưa có kết quả</div>
              </div>
            }
          />
        </div>
      )}

      {/* Prediction Modal */}
      {showPredModal && (
        <div className="modal-overlay" onClick={() => setShowPredModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎯 Dự đoán nhanh</h2>
              <button className="modal-close" onClick={() => setShowPredModal(false)}>✕</button>
            </div>

            {selectedHorseData ? (
              <div className="form-group">
                <label>Ngựa đã chọn</label>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                  <div className="font-bold text-foreground">{selectedHorseData?.horse?.name || selectedHorseData?.horseId?.name || selectedHorseData?.name || '—'}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Dự đoán cho đúng con ngựa bạn vừa chọn từ bảng.</div>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label>Chọn ngựa dự đoán thắng</label>
                <select value={selectedHorse} onChange={(e) => setSelectedHorse(e.target.value)}>
                  <option value="">— Chọn ngựa —</option>
                  {horses.map((h: any) => {
                    const horse = h?.horse || h?.horseId || h
                    return <option key={horse?._id || h?._id} value={horse?._id || h?._id}>{horse?.name || h?.name || '—'}</option>
                  })}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="font-bold text-sm text-foreground">Số tiền đặt cược (100,000 - 10,000,000 VND)</label>
              <input
                type="number"
                min="100000"
                max="10000000"
                step="50000"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Ví dụ: 500000"
                className="w-full rounded border border-border bg-background px-3 py-2 font-semibold text-foreground"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {[500000, 1000000, 2000000, 5000000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className="h-8 px-3 rounded-lg border border-amber-500/30 text-amber-500 bg-amber-500/5 hover:bg-amber-500/20 font-bold text-xs transition-colors cursor-pointer"
                    onClick={() => setBetAmount(String(amount))}
                  >
                    {amount.toLocaleString('vi-VN')} VND
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-emerald-400 font-bold">Số tiền trúng thưởng</div>
                <div className="mt-1 text-lg font-black text-emerald-300">
                  {estimatedPayout ? formatMoney(estimatedPayout) : '—'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Tính theo tỉ lệ 1.9x, nhập 500.000 VND sẽ nhận khoảng 950.000 VND.
                </div>
              </div>
            </div>

            {predMsg && predMsg.type === 'error' && (
              <div className="alert alert-error">{predMsg.text}</div>
            )}

            <div className="flex gap-8 mt-16">
              <button className="btn flex-1" onClick={() => setShowPredModal(false)}>Hủy</button>
              <button
                className="btn btnPrimary flex-1"
                disabled={!selectedHorse || !betAmount || predLoading}
                onClick={handlePrediction}
              >
                {predLoading ? 'Đang xử lý...' : '✅ Xác nhận dự đoán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}