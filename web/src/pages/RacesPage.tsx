import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Race } from '../types'
import { getPublicRaces } from '../api'

const STATUS_OPTIONS = ['', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']

function statusBadge(s: string) {
  return <span className={`badge badge-${s.toLowerCase()}`}>
    {s === 'ONGOING' && <span className="live-dot" />}
    {s}
  </span>
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('vi-VN')
}

export function RacesPage() {
  const [items, setItems] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params: any = {}
    if (statusFilter) params.status = statusFilter
    getPublicRaces(params)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.races || data?.data || [])
        setItems(list)
      })
      .catch(() => setError('Không thể tải danh sách cuộc đua'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <div>
      <div className="page-header">
        <h1>🏇 Cuộc đua</h1>
      </div>

      <div className="filter-bar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 180 }}
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏇</div>
          <div className="empty-state-text">Chưa có cuộc đua nào</div>
        </div>
      ) : (
        <div className="grid-cards">
          {items.map((r) => (
            <Link key={r._id} to={`/races/${r._id}`} style={{ textDecoration: 'none' }}>
              <div className="grid-card">
                <div className="grid-card-header">
                  <div className="grid-card-title">{r.name}</div>
                  {statusBadge(r.status)}
                </div>
                <div className="grid-card-meta">
                  <span>🕐 {formatDateTime(r.scheduledAt)}</span>
                  {r.distance ? <span>📏 {r.distance}m</span> : null}
                  {r.tournamentId?.name ? <span>🏆 {r.tournamentId.name}</span> : null}
                  {r.maxHorses ? <span>🐴 Tối đa {r.maxHorses} ngựa</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
