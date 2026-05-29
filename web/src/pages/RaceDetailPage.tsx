import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'
import type { Race, RaceResult } from '../types'
import { getPublicRace, getRaceHorses, getRaceResults, checkPredictionOpen, placePrediction } from '../api'

function statusBadge(s: string) {
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
  return n.toLocaleString('vi-VN') + ' ₫'
}

export function RaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useSession()
  const isSpectator = session?.user.role === 'SPECTATOR'

  const [race, setRace] = useState<Race | null>(null)
  const [horses, setHorses] = useState<any[]>([])
  const [results, setResults] = useState<RaceResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Prediction state
  const [predOpen, setPredOpen] = useState(false)
  const [showPredModal, setShowPredModal] = useState(false)
  const [selectedHorse, setSelectedHorse] = useState('')
  const [betAmount, setBetAmount] = useState('')
  const [predLoading, setPredLoading] = useState(false)
  const [predMsg, setPredMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
      checkPredictionOpen(id).then((d) => setPredOpen(d?.isOpen === true)).catch(() => {})
    }
  }, [id, isSpectator])

  // Auto-refresh for ONGOING races
  useEffect(() => {
    if (!race || race.status !== 'ONGOING' || !id) return
    const timer = setInterval(() => {
      getRaceResults(id).then((res) => setResults(Array.isArray(res) ? res : [])).catch(() => {})
    }, 15000)
    return () => clearInterval(timer)
  }, [race, id])

  async function handlePrediction() {
    if (!id || !selectedHorse || !betAmount) return
    setPredLoading(true)
    setPredMsg(null)
    try {
      await placePrediction(id, selectedHorse, Number(betAmount))
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
              <button className="btn btnPrimary" onClick={() => setShowPredModal(true)}>
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

      {/* ONGOING race banner */}
      {race.status === 'ONGOING' && (
        <div className="alert alert-warning mb-16">
          <span className="live-dot" /> Cuộc đua đang diễn ra! Kết quả tự động cập nhật mỗi 15 giây.
        </div>
      )}

      {/* Horses */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 12 }}>🐴 Ngựa tham gia</h2>
        {horses.length === 0 ? (
          <div className="empty-state"><div className="empty-state-text">Chưa có ngựa đăng ký</div></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên ngựa</th>
                  <th>Giống</th>
                  <th>Tuổi</th>
                  <th>Cân nặng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {horses.map((h: any, idx: number) => {
                  const horse = h.horse || h.horseId || h
                  const regStatus = h.registrationStatus || h.status || ''
                  return (
                    <tr key={horse._id || idx}>
                      <td className="fw-600">{horse.name || '—'}</td>
                      <td>{horse.breed || '—'}</td>
                      <td>{horse.age ?? '—'}</td>
                      <td>{horse.weight ? `${horse.weight} kg` : '—'}</td>
                      <td>{regStatus && <span className={`badge badge-${regStatus.toLowerCase()}`}>{regStatus}</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results */}
      {(race.status === 'COMPLETED' || race.status === 'RESULT_CONFIRMED' || results.length > 0) && (
        <div className="card">
          <h2 style={{ marginBottom: 12 }}>🏅 Kết quả cuộc đua</h2>
          {results.length === 0 ? (
            <div className="empty-state"><div className="empty-state-text">Chưa có kết quả</div></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Ngựa</th>
                    <th>Nài ngựa</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Giải thưởng</th>
                  </tr>
                </thead>
                <tbody>
                  {results.sort((a, b) => a.position - b.position).map((r, idx) => (
                    <tr key={r._id || idx}>
                      <td>
                        <span className={`position-cell ${idx < 3 ? `rank-${idx + 1}` : ''}`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${r.position}`}
                        </span>
                      </td>
                      <td className="fw-600">{r.horseId?.name || r.horseId || '—'}</td>
                      <td>{r.jockeyId?.fullName || r.jockeyId?.name || r.jockeyId || '—'}</td>
                      <td className="fw-600">{r.finishTime || '—'}</td>
                      <td><span className={`badge badge-${(r.status || '').toLowerCase()}`}>{r.status}</span></td>
                      <td className="money">{formatMoney(r.prizeAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Prediction Modal */}
      {showPredModal && (
        <div className="modal-overlay" onClick={() => setShowPredModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎯 Dự đoán kết quả</h2>
              <button className="modal-close" onClick={() => setShowPredModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label>Chọn ngựa dự đoán thắng</label>
              <select value={selectedHorse} onChange={(e) => setSelectedHorse(e.target.value)}>
                <option value="">— Chọn ngựa —</option>
                {horses.map((h: any) => {
                  const horse = h.horse || h.horseId || h
                  return <option key={horse._id} value={horse._id}>{horse.name}</option>
                })}
              </select>
            </div>

            <div className="form-group">
              <label>Số tiền đặt cược (100,000 - 10,000,000 VND)</label>
              <input
                type="number"
                min="100000"
                max="10000000"
                step="50000"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Ví dụ: 500000"
              />
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
