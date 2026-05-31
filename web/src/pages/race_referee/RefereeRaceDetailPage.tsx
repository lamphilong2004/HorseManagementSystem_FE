import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Race, RaceHorseRegistration, Violation, RaceResult } from '../../types'
import {
  getPublicRace, getRefereeRaceHorses, getRefereeViolations,
  createViolation, resolveViolation, confirmRaceResult, getRaceResults,
} from '../../api'
import { AnimatedTable } from '../../components/ui/animated-table'

const VIOLATION_TYPES = ['FALSE_START', 'INTERFERENCE', 'OVERWEIGHT', 'DOPING', 'OTHER']
const PENALTY_TYPES = ['WARNING', 'DISQUALIFY', 'FINE']

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
  return n.toLocaleString('vi-VN') + ' VND'
}

type Tab = 'horses' | 'monitor' | 'violations' | 'results'

export function RefereeRaceDetailPage() {
  const { raceId } = useParams<{ raceId: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('horses')
  const [race, setRace] = useState<Race | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tab data
  const [horses, setHorses] = useState<RaceHorseRegistration[]>([])
  const [horsesLoading, setHorsesLoading] = useState(false)
  const [violations, setViolations] = useState<Violation[]>([])
  const [violationsLoading, setViolationsLoading] = useState(false)
  const [results, setResults] = useState<RaceResult[]>([])

  // Violation form
  const [showViolationForm, setShowViolationForm] = useState(false)
  const [vForm, setVForm] = useState({ horseId: '', jockeyId: '', type: 'FALSE_START', description: '', penalty: 'WARNING', fineAmount: '' })
  const [vLoading, setVLoading] = useState(false)
  const [vMsg, setVMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Resolve violation
  const [resolveId, setResolveId] = useState<string | null>(null)
  const [resolveNote, setResolveNote] = useState('')
  const [resolveLoading, setResolveLoading] = useState(false)

  // Confirm result
  const [rankings, setRankings] = useState<Array<{ position: number; horseId: string; jockeyId: string; finishTime: string }>>([])
  const [resultNotes, setResultNotes] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmMsg, setConfirmMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load race info
  useEffect(() => {
    if (!raceId) return
    setLoading(true)
    getPublicRace(raceId)
      .then(setRace)
      .catch(() => setError('Không tìm thấy cuộc đua'))
      .finally(() => setLoading(false))
  }, [raceId])

  // Load tab data
  useEffect(() => {
    if (!raceId) return

    if (activeTab === 'horses') {
      setHorsesLoading(true)
      getRefereeRaceHorses(raceId)
        .then((data) => setHorses(data?.horses || []))
        .catch(() => setHorses([]))
        .finally(() => setHorsesLoading(false))
    }

    if (activeTab === 'violations') {
      setViolationsLoading(true)
      getRefereeViolations(raceId)
        .then((data) => setViolations(data?.violations || []))
        .catch(() => setViolations([]))
        .finally(() => setViolationsLoading(false))
    }

    if (activeTab === 'monitor' || activeTab === 'results') {
      getRaceResults(raceId).then((r) => setResults(Array.isArray(r) ? r : [])).catch(() => setResults([]))
      // Also load horses for confirm result
      getRefereeRaceHorses(raceId)
        .then((data) => setHorses(data?.horses || []))
        .catch(() => {})
    }
  }, [raceId, activeTab])

  // Create violation
  async function handleCreateViolation() {
    if (!raceId) return
    setVLoading(true)
    setVMsg(null)
    try {
      await createViolation(raceId, {
        ...vForm,
        fineAmount: vForm.fineAmount ? Number(vForm.fineAmount) : undefined,
      })
      setVMsg({ type: 'success', text: 'Ghi nhận vi phạm thành công!' })
      setShowViolationForm(false)
      setVForm({ horseId: '', jockeyId: '', type: 'FALSE_START', description: '', penalty: 'WARNING', fineAmount: '' })
      // Refresh violations
      const data = await getRefereeViolations(raceId)
      setViolations(data?.violations || [])
    } catch (e: any) {
      setVMsg({ type: 'error', text: e?.response?.data?.message || 'Lỗi khi ghi nhận vi phạm' })
    } finally {
      setVLoading(false)
    }
  }

  // Resolve violation
  async function handleResolve(vId: string) {
    setResolveLoading(true)
    try {
      await resolveViolation(vId, resolveNote)
      setResolveId(null)
      setResolveNote('')
      if (raceId) {
        const data = await getRefereeViolations(raceId)
        setViolations(data?.violations || [])
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Lỗi khi xử lý vi phạm')
    } finally {
      setResolveLoading(false)
    }
  }

  // Confirm result
  async function handleConfirmResult() {
    if (!raceId || rankings.length === 0) return
    setConfirmLoading(true)
    setConfirmMsg(null)
    try {
      await confirmRaceResult(raceId, rankings, resultNotes)
      setConfirmMsg({ type: 'success', text: 'Xác nhận kết quả thành công!' })
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || 'Lỗi khi xác nhận kết quả'
      setConfirmMsg({ type: 'error', text: msg })
    } finally {
      setConfirmLoading(false)
    }
  }

  // Add ranking row
  function addRankingRow() {
    setRankings([...rankings, { position: rankings.length + 1, horseId: '', jockeyId: '', finishTime: '' }])
  }

  function updateRanking(idx: number, field: string, value: string) {
    const copy = [...rankings]
    ;(copy[idx] as any)[field] = field === 'position' ? Number(value) : value
    setRankings(copy)
  }

  function removeRanking(idx: number) {
    setRankings(rankings.filter((_, i) => i !== idx))
  }

  const horseInspectionColumns = [
    {
      id: 'index',
      header: '#',
      cell: (_: any, idx: number) => idx + 1,
    },
    {
      id: 'name',
      header: 'Tên ngựa',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return <span className="fw-700">{horse.name}</span>
      },
    },
    {
      id: 'breed',
      header: 'Giống',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.breed || '—'
      },
    },
    {
      id: 'age',
      header: 'Tuổi',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.age ?? '—'
      },
    },
    {
      id: 'weight',
      header: 'Cân nặng',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.weight ? `${horse.weight} kg` : '—'
      },
    },
    {
      id: 'color',
      header: 'Màu',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.color || '—'
      },
    },
    {
      id: 'gender',
      header: 'Giới tính',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.gender || '—'
      },
    },
    {
      id: 'origin',
      header: 'Nguồn gốc',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.origin || '—'
      },
    },
    {
      id: 'status',
      header: 'Trạng thái ĐK',
      cell: (h: RaceHorseRegistration) => statusBadge(h.registrationStatus || 'PENDING'),
    },
  ]

  const monitorHorsesColumns = [
    {
      id: 'index',
      header: '#',
      cell: (_: any, idx: number) => idx + 1,
    },
    {
      id: 'name',
      header: 'Ngựa',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return <span className="fw-600">{horse.name}</span>
      },
    },
    {
      id: 'breed',
      header: 'Giống',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.breed || '—'
      },
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (h: RaceHorseRegistration) => statusBadge(h.registrationStatus || 'PENDING'),
    },
  ]

  const monitorResultsColumns = [
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
      cell: (r: RaceResult) => <span className="fw-600">{r.horseId?.name || '—'}</span>,
    },
    {
      id: 'jockey',
      header: 'Nài ngựa',
      cell: (r: RaceResult) => r.jockeyId?.fullName || r.jockeyId?.name || '—',
    },
    {
      id: 'time',
      header: 'Thời gian',
      cell: (r: RaceResult) => <span className="fw-600">{r.finishTime || '—'}</span>,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (r: RaceResult) => statusBadge(r.status || ''),
    },
  ]

  const violationsColumns = [
    {
      id: 'type',
      header: 'Loại',
      cell: (v: Violation) => (
        <span className={`badge badge-${v.type === 'DOPING' || v.type === 'INTERFERENCE' ? 'disqualify' : 'warning'}`}>
          {v.type}
        </span>
      ),
    },
    {
      id: 'description',
      header: 'Mô tả',
      cell: (v: Violation) => v.description,
    },
    {
      id: 'penalty',
      header: 'Hình phạt',
      cell: (v: Violation) => <span className={`badge badge-${v.penalty.toLowerCase()}`}>{v.penalty}</span>,
    },
    {
      id: 'fine',
      header: 'Phạt tiền',
      cell: (v: Violation) => (v.fineAmount ? formatMoney(v.fineAmount) : '—'),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (v: Violation) => statusBadge(v.status),
    },
    {
      id: 'action',
      header: 'Hành động',
      cell: (v: Violation) => {
        return v.status === 'OPEN' ? (
          resolveId === v._id ? (
            <div className="flex flex-col gap-8" onClick={(e) => e.stopPropagation()}>
              <input
                placeholder="Ghi chú xử lý..."
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                style={{ width: 200 }}
              />
              <div className="flex gap-8">
                <button className="btn btnSmall btnSuccess" disabled={resolveLoading} onClick={() => handleResolve(v._id)}>
                  {resolveLoading ? '...' : '✅ Xử lý'}
                </button>
                <button className="btn btnSmall" onClick={() => setResolveId(null)}>Hủy</button>
              </div>
            </div>
          ) : (
            <button className="btn btnSmall btnSuccess" onClick={(e) => { e.stopPropagation(); setResolveId(v._id) }}>
              Xử lý
            </button>
          )
        ) : (
          <span className="muted fs-13">{v.resolutionNote || 'Đã xử lý'}</span>
        )
      },
    },
  ]

  const horsesWithId = horses.map((h, idx) => {
    const horse = (h.horse || h) as any
    return {
      ...h,
      id: horse._id || idx,
    }
  })

  const resultsWithId = [...results]
    .sort((a, b) => a.position - b.position)
    .map((r, idx) => ({ ...r, id: r._id || idx }))

  const violationsWithId = violations.map((v, idx) => ({
    ...v,
    id: v._id || idx,
  }))

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (error) return (
    <div className="card">
      <Link to="/referee/races" className="back-link">← Quay lại</Link>
      <div className="alert alert-error">⚠️ {error}</div>
    </div>
  )
  if (!race) return null

  const openViolations = violations.filter(v => v.status === 'OPEN').length

  return (
    <div>
      <Link to="/referee/races" className="back-link">← Quay lại danh sách</Link>

      {/* Race Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex justify-between items-center flex-wrap gap-8">
          <div>
            <h1 style={{ margin: 0 }}>⚖️ {race.name}</h1>
            {race.tournamentId?.name && <p className="muted mt-8">🏆 {race.tournamentId.name}</p>}
          </div>
          <div className="flex items-center gap-8">
            {statusBadge(race.status)}
            <Link to={`/referee/report/${raceId}`} className="btn btnPrimary">
              📝 Biên bản
            </Link>
          </div>
        </div>

        <div className="stat-grid mt-16">
          <div className="stat-card">
            <div className="stat-label">Thời gian</div>
            <div className="stat-value" style={{ fontSize: 14 }}>{formatDateTime(race.scheduledAt)}</div>
          </div>
          {race.distance && (
            <div className="stat-card">
              <div className="stat-label">Khoảng cách</div>
              <div className="stat-value">{race.distance}m</div>
            </div>
          )}
          <div className="stat-card">
            <div className="stat-label">Ngựa tham gia</div>
            <div className="stat-value">{horses.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Vi phạm mở</div>
            <div className="stat-value" style={{ color: openViolations > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {openViolations}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'horses' ? 'active' : ''}`} onClick={() => setActiveTab('horses')}>
            🐴 Kiểm tra ngựa
          </button>
          <button className={`tab-btn ${activeTab === 'monitor' ? 'active' : ''}`} onClick={() => setActiveTab('monitor')}>
            👁️ Theo dõi đua
          </button>
          <button className={`tab-btn ${activeTab === 'violations' ? 'active' : ''}`} onClick={() => setActiveTab('violations')}>
            ⚠️ Vi phạm {openViolations > 0 && `(${openViolations})`}
          </button>
          <button className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            🏅 Xác nhận kết quả
          </button>
        </div>

        {/* ===== TAB 1: Horse Inspection ===== */}
        {activeTab === 'horses' && (
          <AnimatedTable
            data={horsesWithId}
            columns={horseInspectionColumns}
            loading={horsesLoading}
            emptyMessage={
              <div className="empty-state">
                <div className="empty-state-icon">🐴</div>
                <div className="empty-state-text">Chưa có ngựa đăng ký</div>
              </div>
            }
          />
        )}

        {/* ===== TAB 2: Race Monitor ===== */}
        {activeTab === 'monitor' && (
          <div>
            {race.status === 'ONGOING' && (
              <div className="alert alert-warning">
                <span className="live-dot" /> Cuộc đua đang diễn ra
              </div>
            )}

            {race.status === 'SCHEDULED' && (
              <div className="alert alert-info">
                📅 Cuộc đua chưa bắt đầu — dự kiến {formatDateTime(race.scheduledAt)}
              </div>
            )}

            <div className="section-title mt-16 mb-4">🐴 Ngựa tham gia ({horses.length})</div>
            {horses.length > 0 && (
              <div className="mb-6">
                <AnimatedTable
                  data={horsesWithId}
                  columns={monitorHorsesColumns}
                  emptyMessage="Chưa có ngựa tham gia"
                />
              </div>
            )}

            {results.length > 0 && (
              <>
                <div className="section-title mb-4">🏅 Kết quả hiện tại</div>
                <AnimatedTable
                  data={resultsWithId}
                  columns={monitorResultsColumns}
                  emptyMessage="Chưa có kết quả"
                />
              </>
            )}
          </div>
        )}

        {/* ===== TAB 3: Violations ===== */}
        {activeTab === 'violations' && (
          <div>
            {vMsg && <div className={`alert ${vMsg.type === 'success' ? 'alert-success' : 'alert-error'} mb-16`}>{vMsg.text}</div>}

            <div className="flex justify-between items-center mb-16">
              <div className="section-title" style={{ marginBottom: 0 }}>
                ⚠️ Danh sách vi phạm ({violations.length})
              </div>
              <button className="btn btnDanger" onClick={() => setShowViolationForm(true)}>
                + Ghi nhận vi phạm
              </button>
            </div>

            <AnimatedTable
              data={violationsWithId}
              columns={violationsColumns}
              loading={violationsLoading}
              emptyMessage={
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <div className="empty-state-text">Không có vi phạm nào</div>
                </div>
              }
            />

            {/* Violation Form Modal */}
            {showViolationForm && (
              <div className="modal-overlay" onClick={() => setShowViolationForm(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>⚠️ Ghi nhận vi phạm mới</h2>
                    <button className="modal-close" onClick={() => setShowViolationForm(false)}>✕</button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Ngựa vi phạm</label>
                      <select value={vForm.horseId} onChange={(e) => setVForm({ ...vForm, horseId: e.target.value })}>
                        <option value="">— Chọn ngựa —</option>
                        {horses.map((h) => {
                          const horse = (h.horse || h) as any
                          return <option key={horse._id} value={horse._id}>{horse.name}</option>
                        })}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nài ngựa (Jockey ID)</label>
                      <input value={vForm.jockeyId} onChange={(e) => setVForm({ ...vForm, jockeyId: e.target.value })} placeholder="Nhập Jockey ID" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Loại vi phạm</label>
                      <select value={vForm.type} onChange={(e) => setVForm({ ...vForm, type: e.target.value })}>
                        {VIOLATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Hình phạt</label>
                      <select value={vForm.penalty} onChange={(e) => setVForm({ ...vForm, penalty: e.target.value })}>
                        {PENALTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {vForm.penalty === 'FINE' && (
                    <div className="form-group">
                      <label>Số tiền phạt (VND)</label>
                      <input type="number" value={vForm.fineAmount} onChange={(e) => setVForm({ ...vForm, fineAmount: e.target.value })} placeholder="5000000" />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Mô tả chi tiết</label>
                    <textarea value={vForm.description} onChange={(e) => setVForm({ ...vForm, description: e.target.value })} placeholder="Mô tả vi phạm..." rows={3} />
                  </div>

                  <div className="flex gap-8 mt-16">
                    <button className="btn flex-1" onClick={() => setShowViolationForm(false)}>Hủy</button>
                    <button className="btn btnDanger flex-1" disabled={!vForm.horseId || !vForm.description || vLoading} onClick={handleCreateViolation}>
                      {vLoading ? 'Đang xử lý...' : '⚠️ Ghi nhận vi phạm'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 4: Confirm Results ===== */}
        {activeTab === 'results' && (
          <div>
            {confirmMsg && <div className={`alert ${confirmMsg.type === 'success' ? 'alert-success' : 'alert-error'} mb-16`}>{confirmMsg.text}</div>}

            {openViolations > 0 && (
              <div className="alert alert-warning mb-16">
                ⚠️ Còn {openViolations} vi phạm chưa xử lý. Vui lòng xử lý hết trước khi xác nhận kết quả.
              </div>
            )}

            {/* Existing results */}
            {results.length > 0 && (
              <div className="mb-16">
                <div className="section-title mb-4">📊 Kết quả hiện tại</div>
                <AnimatedTable
                  data={resultsWithId}
                  columns={monitorResultsColumns}
                  emptyMessage="Chưa có kết quả"
                />
              </div>
            )}

            <div className="section-title">🏅 Nhập bảng xếp hạng</div>

            {rankings.map((r, idx) => (
              <div key={idx} className="form-row mb-8" style={{ alignItems: 'end' }}>
                <div className="form-group" style={{ maxWidth: 80 }}>
                  <label>Hạng</label>
                  <input type="number" min="1" value={r.position} onChange={(e) => updateRanking(idx, 'position', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Ngựa</label>
                  <select value={r.horseId} onChange={(e) => updateRanking(idx, 'horseId', e.target.value)}>
                    <option value="">— Chọn —</option>
                    {horses.map((h) => {
                      const horse = (h.horse || h) as any
                      return <option key={horse._id} value={horse._id}>{horse.name}</option>
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Jockey ID</label>
                  <input value={r.jockeyId} onChange={(e) => updateRanking(idx, 'jockeyId', e.target.value)} placeholder="Jockey ID" />
                </div>
                <div className="form-group">
                  <label>Thời gian</label>
                  <input value={r.finishTime} onChange={(e) => updateRanking(idx, 'finishTime', e.target.value)} placeholder="1:12.345" />
                </div>
                <button className="btn btnSmall btnDanger" onClick={() => removeRanking(idx)} style={{ marginBottom: 14 }}>✕</button>
              </div>
            ))}

            <button className="btn mb-16" onClick={addRankingRow}>+ Thêm hàng</button>

            <div className="form-group">
              <label>Ghi chú</label>
              <textarea value={resultNotes} onChange={(e) => setResultNotes(e.target.value)} placeholder="Ghi chú về cuộc đua..." rows={2} />
            </div>

            <button
              className="btn btnPrimary"
              disabled={rankings.length === 0 || confirmLoading || openViolations > 0}
              onClick={handleConfirmResult}
            >
              {confirmLoading ? 'Đang xử lý...' : '✅ Xác nhận kết quả cuộc đua'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
