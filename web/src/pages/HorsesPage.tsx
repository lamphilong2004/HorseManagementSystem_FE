import { useEffect, useState, startTransition } from 'react'
import type { Horse, Race, Jockey } from '../types'
import {
  getHorses,
  createHorse,
  updateHorse,
  deleteHorse,
  getRaces,
  registerHorseRace,
  searchJockeys,
  sendJockeyInvitation,
  getHorseJockeys,
  confirmJockey,
} from '../api'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'my-horses' | 'race-registration' | 'hire-jockey' | 'invitations'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function horseAvatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg,#059669,#047857)',
    'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    'linear-gradient(135deg,#f59e0b,#d97706)',
    'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    'linear-gradient(135deg,#f97316,#ea580c)',
    'linear-gradient(135deg,#06b6d4,#0e7490)',
    'linear-gradient(135deg,#ec4899,#be185d)',
    'linear-gradient(135deg,#10b981,#059669)',
  ]
  const idx = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % colors.length
  return colors[idx]
}

function statusConfig(status: string) {
  const map: Record<string, { cls: string; label: string }> = {
    PENDING:  { cls: 'badge-pending',  label: '⏳ Chờ duyệt' },
    APPROVED: { cls: 'badge-approved', label: '✅ Đã duyệt' },
    REJECTED: { cls: 'badge-rejected', label: '❌ Bị từ chối' },
  }
  return map[status] ?? { cls: 'badge-pending', label: status }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastItem = { id: number; type: 'success' | 'error' | 'warning'; message: string }
let _toastId = 0

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const show = (message: string, type: ToastItem['type'] = 'success') => {
    const id = ++_toastId
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }
  return { toasts, show }
}

const toastIcon = { success: '✅', error: '❌', warning: '⚠️' }

// ─── Main ─────────────────────────────────────────────────────────────────────

export function HorsesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('my-horses')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [horses, setHorses] = useState<Horse[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [jockeys, setJockeys] = useState<Jockey[]>([])
  const [invitations, setInvitations] = useState<any[]>([])

  const [selectedHorseId, setSelectedHorseId] = useState<string>('')
  const [jockeySearch, setJockeySearch] = useState<string>('')
  const [inviteRaceId, setInviteRaceId] = useState<string>('')

  // Horse modal
  const [showHorseModal, setShowHorseModal] = useState(false)
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null)
  const [horseForm, setHorseForm] = useState({
    name: '', breed: '', age: 3, weight: 450, color: '', gender: 'MALE' as 'MALE' | 'FEMALE', origin: '', healthCertUrl: '',
  })

  const { toasts, show: showToast } = useToast()

  useEffect(() => { loadData() }, [activeTab])

  useEffect(() => {
    if (activeTab === 'invitations' && selectedHorseId) {
      getHorseJockeys(selectedHorseId).then(setInvitations).catch(() => setInvitations([]))
    }
  }, [selectedHorseId, activeTab])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const hList = await getHorses()
      setHorses(hList)
      if (!selectedHorseId && hList.length > 0) setSelectedHorseId(hList[0].id)

      if (activeTab === 'race-registration') {
        const rList = await getRaces()
        setRaces(rList.filter((r) => r.status === 'SCHEDULED'))
      } else if (activeTab === 'hire-jockey') {
        const [jList, rList] = await Promise.all([searchJockeys(), getRaces()])
        setJockeys(jList)
        setRaces(rList)
      } else if (activeTab === 'invitations' && selectedHorseId) {
        const iList = await getHorseJockeys(selectedHorseId)
        setInvitations(iList)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Horse CRUD ──────────────────────────────────────────────────────────────

  const openHorseModal = (h: Horse | null) => {
    setSelectedHorse(h)
    setHorseForm(
      h
        ? { name: h.name, breed: h.breed || '', age: h.age || 0, weight: h.weight || 0, color: h.color || '', gender: h.gender || 'MALE', origin: h.origin || '', healthCertUrl: h.healthCertUrl || '' }
        : { name: '', breed: '', age: 3, weight: 450, color: '', gender: 'MALE', origin: '', healthCertUrl: '' },
    )
    setShowHorseModal(true)
  }

  const handleSaveHorse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedHorse) {
        await updateHorse(selectedHorse.id, horseForm)
        showToast(`Đã cập nhật thông tin ngựa ${horseForm.name}`)
      } else {
        await createHorse(horseForm)
        showToast(`Đã thêm ngựa ${horseForm.name} — Đang chờ Admin duyệt`)
      }
      setShowHorseModal(false)
      loadData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi lưu hồ sơ ngựa', 'error')
    }
  }

  const handleDeleteHorse = async (id: string, name: string) => {
    if (!window.confirm(`Xóa ngựa "${name}"?`)) return
    try {
      await deleteHorse(id)
      showToast(`Đã xóa ngựa ${name}`)
      loadData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa (Ngựa đang tham gia cuộc đua)', 'error')
    }
  }

  // ── Race registration ───────────────────────────────────────────────────────

  const handleRegisterRace = async (race: Race) => {
    if (!selectedHorseId) return showToast('Vui lòng chọn ngựa', 'warning')
    const horse = horses.find((h) => h.id === selectedHorseId)
    if (horse?.status !== 'APPROVED') return showToast('Chỉ ngựa đã được Admin duyệt mới có thể đăng ký', 'warning')
    try {
      await registerHorseRace(selectedHorseId, race.id)
      showToast(`Đã đăng ký ngựa vào "${race.name}" — Đang chờ Admin duyệt`)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể đăng ký cuộc đua', 'error')
    }
  }

  // ── Jockey invitation ───────────────────────────────────────────────────────

  const handleInviteJockey = async (jockeyId: string, jockeyName: string) => {
    if (!selectedHorseId) return showToast('Vui lòng chọn ngựa', 'warning')
    if (!inviteRaceId) return showToast('Vui lòng chọn cuộc đua', 'warning')
    try {
      await sendJockeyInvitation(selectedHorseId, jockeyId, inviteRaceId, 'Mời bạn cưỡi ngựa của tôi')
      showToast(`Đã gửi lời mời đến Jockey ${jockeyName}`)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể gửi lời mời', 'error')
    }
  }

  const handleConfirmJockey = async (jockeyId: string, raceId: string, jockeyName: string) => {
    if (!selectedHorseId) return
    try {
      await confirmJockey(selectedHorseId, jockeyId, raceId)
      showToast(`Đã chốt Jockey ${jockeyName} thành công!`)
      const iList = await getHorseJockeys(selectedHorseId)
      setInvitations(iList)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể chốt Jockey', 'error')
    }
  }

  // Filtered jockeys
  const filteredJockeys = jockeys.filter((j) => {
    const name = (j.userId?.fullName || j.userId?.name || '').toLowerCase()
    return name.includes(jockeySearch.toLowerCase())
  })

  const selectedHorseObj = horses.find((h) => h.id === selectedHorseId)

  return (
    <>
      {/* Toast */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{toastIcon[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Page header */}
        <div className="flex-between">
          <div>
            <h1>🐎 Quản lý Ngựa</h1>
            <p className="muted text-sm">Hồ sơ ngựa, đăng ký đua, tuyển jockey</p>
          </div>
          {activeTab === 'my-horses' && (
            <button className="btn btnPrimary" onClick={() => openHorseModal(null)}>
              + Thêm ngựa mới
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs">
          {([
            { key: 'my-horses', label: 'Hồ Sơ Ngựa', icon: '🐎' },
            { key: 'race-registration', label: 'Đăng Ký Đua', icon: '🏆' },
            { key: 'hire-jockey', label: 'Tuyển Jockey', icon: '🤝' },
            { key: 'invitations', label: 'Quản Lý Lời Mời', icon: '📋' },
          ] as { key: Tab; label: string; icon: string }[]).map((tab) => (
            <button
              key={tab.key}
              className={`tab-link ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => startTransition(() => setActiveTab(tab.key))}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="card" style={{ background: 'var(--danger-light)', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── TAB 1: My Horses ── */}
        {activeTab === 'my-horses' && (
          <div>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card" style={{ height: 180 }}>
                    <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--radius-md)' }} />
                  </div>
                ))}
              </div>
            ) : horses.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <span className="empty-state-icon">🐴</span>
                  <div className="empty-state-title">Chưa có ngựa nào</div>
                  <p className="empty-state-desc">Thêm ngựa đầu tiên để bắt đầu tham gia giải đấu</p>
                  <button className="btn btnPrimary" onClick={() => openHorseModal(null)}>
                    + Thêm ngựa mới
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {horses.map((h) => {
                  const sc = statusConfig(h.status || 'PENDING')
                  return (
                    <div key={h.id} className="card card-hover" style={{ padding: 0, overflow: 'hidden' }}>
                      {/* Card header with color accent */}
                      <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div
                          className="horse-avatar"
                          style={{ background: horseAvatarColor(h.name), fontSize: 22, flexShrink: 0 }}
                        >
                          🐎
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: 16 }}>{h.name}</h3>
                            <span className={`badge ${sc.cls}`}>{sc.label}</span>
                          </div>
                          <p className="muted text-xs" style={{ marginTop: 2 }}>{h.breed} · {h.origin}</p>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '12px 18px', gap: 8 }}>
                        {[
                          { label: 'Tuổi', value: `${h.age} năm` },
                          { label: 'Cân nặng', value: `${h.weight} kg` },
                          { label: 'Giới tính', value: h.gender === 'MALE' ? '♂ Đực' : '♀ Cái' },
                        ].map((item) => (
                          <div key={item.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{item.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Health cert & actions */}
                      <div style={{ padding: '10px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTop: '1px solid var(--border)' }}>
                        {h.healthCertUrl ? (
                          <a href={h.healthCertUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                            📋 Health Cert ↗
                          </a>
                        ) : (
                          <span className="text-xs danger-text">⚠️ Thiếu Health Cert</span>
                        )}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm" onClick={() => openHorseModal(h)}>✏️ Sửa</button>
                          <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteHorse(h.id, h.name)}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Race Registration ── */}
        {activeTab === 'race-registration' && (
          <div className="card">
            <div className="section-header">
              <div className="section-title">Đăng Ký Tham Gia Cuộc Đua</div>
              <p className="section-desc">Chọn ngựa đã được Admin duyệt và đăng ký vào cuộc đua sắp diễn ra.</p>
            </div>

            {/* Horse selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 auto' }}>
                {selectedHorseObj && (
                  <div
                    className="horse-avatar"
                    style={{ background: horseAvatarColor(selectedHorseObj.name), fontSize: 20 }}
                  >
                    🐎
                  </div>
                )}
              </div>
              <div className="form-group" style={{ flex: '1 1 260px', marginBottom: 0 }}>
                <label>Ngựa tham gia (chỉ ngựa APPROVED)</label>
                <select value={selectedHorseId} onChange={(e) => setSelectedHorseId(e.target.value)}>
                  <option value="">— Chọn ngựa —</option>
                  {horses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} {h.status === 'APPROVED' ? '✅' : h.status === 'PENDING' ? '⏳' : '❌'}
                    </option>
                  ))}
                </select>
              </div>
              {selectedHorseObj && selectedHorseObj.status !== 'APPROVED' && (
                <div style={{ padding: '8px 14px', background: 'var(--warning-light)', borderRadius: 'var(--radius)', fontSize: 13, color: '#92400e' }}>
                  ⚠️ Ngựa này chưa được Admin duyệt
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>Đang tải...</div>
            ) : races.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">🏁</span>
                <div className="empty-state-title">Không có cuộc đua nào</div>
                <p className="empty-state-desc">Hiện tại chưa có cuộc đua nào ở trạng thái SCHEDULED</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {races.map((r) => (
                  <div key={r.id} className="card card-hover" style={{ background: 'var(--surface-2)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{r.name}</div>
                      <div className="flex-gap-8" style={{ flexWrap: 'wrap', gap: 12 }}>
                        <span className="text-xs muted">📏 {r.distance}m</span>
                        <span className="text-xs muted">📅 {new Date(r.scheduledAt).toLocaleString('vi-VN')}</span>
                        <span className="text-xs muted">👥 Tối đa {r.maxHorses} ngựa</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706', marginBottom: 6 }}>
                        🥇 {r.prizeFirst?.toLocaleString('vi-VN')} VND
                      </div>
                      <button
                        className="btn btnPrimary btn-sm"
                        onClick={() => handleRegisterRace(r)}
                      >
                        Đăng ký ngựa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: Hire Jockey ── */}
        {activeTab === 'hire-jockey' && (
          <div className="card">
            <div className="section-header">
              <div className="section-title">Tuyển Jockey</div>
              <p className="section-desc">Tìm và gửi lời mời đến các kỵ sĩ trong hệ thống.</p>
            </div>

            {/* Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Ngựa cần tuyển Jockey</label>
                <select value={selectedHorseId} onChange={(e) => setSelectedHorseId(e.target.value)}>
                  <option value="">— Chọn ngựa —</option>
                  {horses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Cuộc đua tương ứng</label>
                <select value={inviteRaceId} onChange={(e) => setInviteRaceId(e.target.value)}>
                  <option value="">— Chọn cuộc đua —</option>
                  {races.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({new Date(r.scheduledAt).toLocaleDateString('vi-VN')})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tìm kiếm Jockey</label>
                <input
                  placeholder="Nhập tên jockey..."
                  value={jockeySearch}
                  onChange={(e) => setJockeySearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <p className="muted">Đang tải...</p>
            ) : filteredJockeys.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">🏇</span>
                <div className="empty-state-title">Không tìm thấy Jockey</div>
                <p className="empty-state-desc">Thử thay đổi từ khóa tìm kiếm</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredJockeys.map((j) => {
                  const name = j.userId?.fullName || j.userId?.name || 'Jockey'
                  const winRate = j.winRate ?? 0
                  return (
                    <div key={j.id} className="card card-hover" style={{ background: 'var(--surface-2)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div className="avatar avatar-lg avatar-jockey" style={{ flexShrink: 0 }}>
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{name}</div>
                        <div className="flex-gap-8" style={{ gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                          <span className="text-xs muted">⏱️ {j.experience} năm KN</span>
                          <span className="text-xs muted">🏅 {j.races ?? 0} trận</span>
                          <span className="text-xs" style={{ color: 'var(--primary)', fontWeight: 600 }}>🏆 {j.wins ?? 0} thắng</span>
                          {j.specialties?.map((s) => (
                            <span key={s} className="badge badge-scheduled" style={{ fontSize: 10 }}>{s}</span>
                          ))}
                        </div>
                        {/* Win rate bar */}
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar-wrapper" style={{ maxWidth: 120 }}>
                            <div
                              className={`progress-bar-fill ${winRate >= 60 ? '' : winRate >= 30 ? 'progress-bar-fill-warning' : 'progress-bar-fill-danger'}`}
                              style={{ width: `${winRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: winRate >= 60 ? 'var(--success)' : winRate >= 30 ? 'var(--warning)' : 'var(--danger)' }}>
                            {winRate}% Win
                          </span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <span className={`badge ${j.status === 'AVAILABLE' ? 'badge-approved' : 'badge-rejected'}`} style={{ marginBottom: 8, display: 'block', textAlign: 'center' }}>
                          {j.status ?? 'AVAILABLE'}
                        </span>
                        <button
                          className="btn btnPrimary btn-sm"
                          onClick={() => handleInviteJockey(j.id, name)}
                          disabled={j.status !== 'AVAILABLE'}
                        >
                          ✉️ Gửi lời mời
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: Invitations ── */}
        {activeTab === 'invitations' && (
          <div className="card">
            <div className="section-header">
              <div className="section-title">Quản Lý Lời Mời</div>
              <p className="section-desc">Xem trạng thái và chốt Jockey tham gia chính thức.</p>
            </div>

            <div className="form-group" style={{ maxWidth: 300, marginBottom: 20 }}>
              <label>Chọn Ngựa</label>
              <select value={selectedHorseId} onChange={(e) => setSelectedHorseId(e.target.value)}>
                <option value="">— Chọn ngựa —</option>
                {horses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>

            {invitations.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">📭</span>
                <div className="empty-state-title">Chưa có lời mời nào</div>
                <p className="empty-state-desc">Chưa có lời mời nào được gửi cho ngựa này</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {invitations.map((inv) => {
                  const jockeyName = inv.jockeyId?.fullName || inv.jockeyId?.name || 'Jockey'
                  const exp = inv.jockeyId?.experience ?? 0
                  const winRate = inv.jockeyId?.winRate ?? 0
                  const invStatus = inv.status as string

                  const statusMap: Record<string, { cls: string; label: string; icon: string }> = {
                    PENDING:   { cls: 'badge-pending',  label: 'Đang chờ',     icon: '⏳' },
                    ACCEPTED:  { cls: 'badge-scheduled', label: 'Đã chấp nhận', icon: '✉️' },
                    REJECTED:  { cls: 'badge-rejected', label: 'Đã từ chối',   icon: '❌' },
                    CONFIRMED: { cls: 'badge-approved', label: 'Đã chốt',       icon: '✅' },
                  }
                  const sc = statusMap[invStatus] ?? { cls: 'badge-pending', label: invStatus, icon: '' }

                  return (
                    <div key={inv._id || inv.id} className="card" style={{ background: 'var(--surface-2)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div className="avatar avatar-lg avatar-jockey" style={{ flexShrink: 0 }}>
                        {jockeyName.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{jockeyName}</div>
                        <div className="flex-gap-8" style={{ gap: 10, flexWrap: 'wrap' }}>
                          <span className="text-xs muted">⏱️ {exp} năm KN</span>
                          <span className="text-xs" style={{ color: 'var(--primary)', fontWeight: 600 }}>🏆 {winRate}% Win Rate</span>
                        </div>
                        <div className="text-xs muted" style={{ marginTop: 4 }}>
                          🏁 Cuộc đua: <strong>{inv.raceId?.name || '—'}</strong>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className={`badge ${sc.cls}`} style={{ marginBottom: 8, display: 'block' }}>
                          {sc.icon} {sc.label}
                        </span>
                        {invStatus === 'ACCEPTED' && (
                          <button
                            className="btn btnPrimary btn-sm"
                            onClick={() => handleConfirmJockey(inv.jockeyId?._id || inv.jockeyId, inv.raceId?._id || inv.raceId, jockeyName)}
                          >
                            ✅ Chốt Jockey
                          </button>
                        )}
                        {invStatus === 'CONFIRMED' && (
                          <span className="success-text text-xs font-semibold">✓ Đã xác nhận</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Horse Modal ── */}
      {showHorseModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowHorseModal(false) }}>
          <div className="modal-content modal-content-lg">
            <div className="modal-header">
              <h3>🐎 {selectedHorse ? 'Chỉnh Sửa Hồ Sơ Ngựa' : 'Thêm Ngựa Mới'}</h3>
              <button className="modal-close" onClick={() => setShowHorseModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveHorse}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label>Tên ngựa *</label>
                    <input required placeholder="Tên ngựa" value={horseForm.name} onChange={(e) => setHorseForm({ ...horseForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Giống (Breed) *</label>
                    <input required placeholder="VD: Thoroughbred" value={horseForm.breed} onChange={(e) => setHorseForm({ ...horseForm, breed: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Tuổi (năm) *</label>
                    <input type="number" required min={1} max={30} value={horseForm.age} onChange={(e) => setHorseForm({ ...horseForm, age: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Cân nặng (kg) *</label>
                    <input type="number" required min={100} max={1200} value={horseForm.weight} onChange={(e) => setHorseForm({ ...horseForm, weight: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Màu sắc *</label>
                    <input required placeholder="VD: Bay, Chestnut, Grey" value={horseForm.color} onChange={(e) => setHorseForm({ ...horseForm, color: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Giới tính *</label>
                    <select value={horseForm.gender} onChange={(e) => setHorseForm({ ...horseForm, gender: e.target.value as 'MALE' | 'FEMALE' })}>
                      <option value="MALE">♂ Đực (MALE)</option>
                      <option value="FEMALE">♀ Cái (FEMALE)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nguồn gốc (Origin) *</label>
                    <input required placeholder="VD: Việt Nam, Úc, Anh..." value={horseForm.origin} onChange={(e) => setHorseForm({ ...horseForm, origin: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Link Chứng nhận Sức khỏe (URL) *</label>
                    <input required type="url" placeholder="https://..." value={horseForm.healthCertUrl} onChange={(e) => setHorseForm({ ...horseForm, healthCertUrl: e.target.value })} />
                  </div>
                </div>

                <div style={{ padding: '10px 14px', background: 'var(--info-light)', borderRadius: 'var(--radius)', fontSize: 13, color: '#1e3a8a', marginTop: 4 }}>
                  ℹ️ Sau khi thêm, ngựa sẽ ở trạng thái <strong>Chờ duyệt (PENDING)</strong> cho đến khi Admin xem xét hồ sơ.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowHorseModal(false)}>Hủy</button>
                <button type="submit" className="btn btnPrimary">
                  {selectedHorse ? '💾 Lưu thay đổi' : '+ Thêm ngựa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
