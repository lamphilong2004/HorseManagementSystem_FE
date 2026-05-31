import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Race } from '../../types'
import { getRefereeRaces } from '@/api'

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

export function RefereeRacesPage() {
  const [items, setItems] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getRefereeRaces()
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setItems(list)
      })
      .catch(() => setError('Không thể tải danh sách cuộc đua'))
      .finally(() => setLoading(false))
  }, [])

  // Group by status
  const ongoing = items.filter(r => r.status === 'ONGOING')
  const scheduled = items.filter(r => r.status === 'SCHEDULED')
  const completed = items.filter(r => r.status === 'COMPLETED' || r.status === 'RESULT_CONFIRMED')
  const other = items.filter(r => !['ONGOING', 'SCHEDULED', 'COMPLETED', 'RESULT_CONFIRMED'].includes(r.status || ''))

  return (
    <div>
      <div className="page-header">
        <h1>⚖️ Quản lý cuộc đua — Trọng tài</h1>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-label">Tổng phân công</div>
          <div className="stat-value">{items.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-label">Đang diễn ra</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{ongoing.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-label">Sắp tới</div>
          <div className="stat-value" style={{ color: 'var(--info)' }}>{scheduled.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Hoàn thành</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{completed.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚖️</div>
            <div className="empty-state-text">Chưa được phân công cuộc đua nào</div>
          </div>
        </div>
      ) : (
        <>
          {/* Ongoing races first */}
          {ongoing.length > 0 && (
            <div className="section">
              <div className="section-title"><span className="live-dot" /> Đang diễn ra</div>
              <div className="grid-cards">
                {ongoing.map((r) => (
                  <Link key={r._id || r.id} to={`/referee/races/${r._id || r.id}`} style={{ textDecoration: 'none' }}>
                    <div className="grid-card" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
                      <div className="grid-card-header">
                        <div className="grid-card-title">{r.name}</div>
                        {statusBadge(r.status)}
                      </div>
                      <div className="grid-card-meta">
                        <span>🕐 {formatDateTime(r.scheduledAt)}</span>
                        {r.tournamentId?.name && <span>🏆 {r.tournamentId.name}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled */}
          {scheduled.length > 0 && (
            <div className="section">
              <div className="section-title">📅 Sắp diễn ra</div>
              <div className="grid-cards">
                {scheduled.map((r) => (
                  <Link key={r._id || r.id} to={`/referee/races/${r._id || r.id}`} style={{ textDecoration: 'none' }}>
                    <div className="grid-card">
                      <div className="grid-card-header">
                        <div className="grid-card-title">{r.name}</div>
                        {statusBadge(r.status)}
                      </div>
                      <div className="grid-card-meta">
                        <span>🕐 {formatDateTime(r.scheduledAt)}</span>
                        {r.tournamentId?.name && <span>🏆 {r.tournamentId.name}</span>}
                        {r.distance && <span>📏 {r.distance}m</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="section">
              <div className="section-title">✅ Đã hoàn thành</div>
              <div className="grid-cards">
                {completed.map((r) => (
                  <Link key={r._id || r.id} to={`/referee/races/${r._id || r.id}`} style={{ textDecoration: 'none' }}>
                    <div className="grid-card" style={{ opacity: 0.85 }}>
                      <div className="grid-card-header">
                        <div className="grid-card-title">{r.name}</div>
                        {statusBadge(r.status)}
                      </div>
                      <div className="grid-card-meta">
                        <span>🕐 {formatDateTime(r.scheduledAt)}</span>
                        {r.tournamentId?.name && <span>🏆 {r.tournamentId.name}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {other.length > 0 && (
            <div className="section">
              <div className="section-title">Khác</div>
              <div className="grid-cards">
                {other.map((r) => (
                  <Link key={r._id || r.id} to={`/referee/races/${r._id || r.id}`} style={{ textDecoration: 'none' }}>
                    <div className="grid-card">
                      <div className="grid-card-header">
                        <div className="grid-card-title">{r.name}</div>
                        {statusBadge(r.status)}
                      </div>
                      <div className="grid-card-meta">
                        <span>🕐 {formatDateTime(r.scheduledAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
