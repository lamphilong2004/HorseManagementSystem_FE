import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PredictionItem, Race } from '../types'
import { getMyPredictions, getPublicRaces, getRaceHorses, placePrediction, checkPredictionOpen } from '../api'

function statusBadge(s: string) {
  return <span className={`badge badge-${s.toLowerCase()}`}>{s}</span>
}

function formatMoney(n?: number) {
  if (!n && n !== 0) return '—'
  return n.toLocaleString('vi-VN') + ' ₫'
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('vi-VN')
}

export function PredictionsPage() {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('history')

  // History
  const [predictions, setPredictions] = useState<PredictionItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyFilter, setHistoryFilter] = useState('')

  // New prediction
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

  // Load prediction history
  useEffect(() => {
    setHistoryLoading(true)
    const params: any = {}
    if (historyFilter) params.status = historyFilter
    getMyPredictions(params)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || [])
        setPredictions(list)
      })
      .catch(() => setPredictions([]))
      .finally(() => setHistoryLoading(false))
  }, [historyFilter])

  // Load races for new prediction
  useEffect(() => {
    if (activeTab !== 'new') return
    setRacesLoading(true)
    getPublicRaces({ status: 'SCHEDULED' })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.races || data?.data || [])
        setRaces(list)
      })
      .catch(() => setRaces([]))
      .finally(() => setRacesLoading(false))
  }, [activeTab])

  // Load horses when race selected
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
    ]).then(([h, openStatus]) => {
      const horseList = Array.isArray(h) ? h : (h?.horses || h?.data || [])
      setHorses(horseList)
      setIsPredOpen(openStatus?.isOpen === true)
    }).finally(() => setHorsesLoading(false))
  }, [selectedRace])

  async function handleSubmit() {
    if (!selectedRace || !selectedHorse || !betAmount) return
    setPredLoading(true)
    setPredMsg(null)
    try {
      await placePrediction(selectedRace, selectedHorse, Number(betAmount))
      setPredMsg({ type: 'success', text: 'Dự đoán thành công! 🎉' })
      setSelectedRace('')
      setSelectedHorse('')
      setBetAmount('')
      // Refresh history
      setActiveTab('history')
      setHistoryLoading(true)
      getMyPredictions()
        .then((data) => setPredictions(Array.isArray(data) ? data : (data?.data || [])))
        .finally(() => setHistoryLoading(false))
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || 'Không thể đặt dự đoán'
      setPredMsg({ type: 'error', text: msg })
    } finally {
      setPredLoading(false)
    }
  }

  // Summary stats
  const totalBet = predictions.reduce((s, p) => s + (p.betAmount || 0), 0)
  const wonCount = predictions.filter(p => p.status === 'WON').length
  const totalPayout = predictions.filter(p => p.status === 'WON').reduce((s, p) => s + (p.payout || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h1>🎯 Dự đoán kết quả</h1>
      </div>

      {/* Summary Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Tổng dự đoán</div>
          <div className="stat-value">{predictions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Tổng đặt cược</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{formatMoney(totalBet)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-label">Số lần thắng</div>
          <div className="stat-value">{wonCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎉</div>
          <div className="stat-label">Tổng thưởng</div>
          <div className="stat-value money-won" style={{ fontSize: 18 }}>{formatMoney(totalPayout)}</div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            📋 Lịch sử dự đoán ({predictions.length})
          </button>
          <button className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>
            ✨ Dự đoán mới
          </button>
        </div>

        {/* === History tab === */}
        {activeTab === 'history' && (
          <>
            <div className="filter-bar">
              <select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
                <option value="">Tất cả</option>
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
                <option value="WON">WON</option>
                <option value="LOST">LOST</option>
              </select>
            </div>

            {historyLoading ? (
              <div className="loading"><div className="spinner" /></div>
            ) : predictions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <div className="empty-state-text">Chưa có dự đoán nào</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Cuộc đua</th>
                      <th>Ngựa</th>
                      <th>Số tiền</th>
                      <th>Trạng thái</th>
                      <th>Tiền thưởng</th>
                      <th>Ngày đặt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p) => (
                      <tr key={p._id}>
                        <td className="fw-600">
                          {p.raceId?.name || (typeof p.raceId === 'string' ? (
                            <Link to={`/races/${p.raceId}`} style={{ color: 'var(--primary)' }}>Xem cuộc đua</Link>
                          ) : '—')}
                        </td>
                        <td>{p.horseId?.name || '—'}</td>
                        <td className="money">{formatMoney(p.betAmount)}</td>
                        <td>{statusBadge(p.status)}</td>
                        <td className={`money ${p.status === 'WON' ? 'money-won' : ''}`}>
                          {p.status === 'WON' ? formatMoney(p.payout) : '—'}
                        </td>
                        <td className="fs-13 muted">{formatDate(p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* === New Prediction tab === */}
        {activeTab === 'new' && (
          <div style={{ maxWidth: 600 }}>
            {predMsg && (
              <div className={`alert ${predMsg.type === 'success' ? 'alert-success' : 'alert-error'} mb-16`}>
                {predMsg.text}
              </div>
            )}

            <div className="form-group">
              <label>Chọn cuộc đua</label>
              {racesLoading ? (
                <p className="muted">Đang tải...</p>
              ) : (
                <select value={selectedRace} onChange={(e) => { setSelectedRace(e.target.value); setSelectedHorse('') }}>
                  <option value="">— Chọn cuộc đua —</option>
                  {races.map((r) => (
                    <option key={r._id} value={r._id}>{r.name} ({r.status})</option>
                  ))}
                </select>
              )}
            </div>

            {selectedRace && !isPredOpen && !horsesLoading && (
              <div className="alert alert-warning">
                ⚠️ Cuộc đua này chưa mở hoặc đã đóng dự đoán
              </div>
            )}

            {selectedRace && (
              <div className="form-group">
                <label>Chọn ngựa dự đoán thắng</label>
                {horsesLoading ? (
                  <p className="muted">Đang tải danh sách ngựa...</p>
                ) : (
                  <select value={selectedHorse} onChange={(e) => setSelectedHorse(e.target.value)}>
                    <option value="">— Chọn ngựa —</option>
                    {horses.map((h: any) => {
                      const horse = h.horse || h.horseId || h
                      return <option key={horse._id} value={horse._id}>{horse.name}</option>
                    })}
                  </select>
                )}
              </div>
            )}

            {selectedRace && (
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
            )}

            {selectedRace && (
              <button
                className="btn btnPrimary"
                disabled={!selectedHorse || !betAmount || predLoading || !isPredOpen}
                onClick={handleSubmit}
                style={{ marginTop: 8 }}
              >
                {predLoading ? 'Đang xử lý...' : '✅ Xác nhận dự đoán'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
