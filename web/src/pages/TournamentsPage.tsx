import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Tournament } from '../types'
import { getPublicTournaments } from '../api'

const STATUS_OPTIONS = ['', 'DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED']

function statusBadge(s: string) {
  const cls = `badge badge-${s.toLowerCase()}`
  return <span className={cls}>{s}</span>
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatMoney(n?: number) {
  if (!n) return '—'
  return n.toLocaleString('vi-VN') + ' ₫'
}

export function TournamentsPage() {
  const [items, setItems] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params: any = {}
    if (statusFilter) params.status = statusFilter
    getPublicTournaments(params)
      .then((data) => {
        setItems(data.tournaments || [])
      })
      .catch(() => setError('Không thể tải danh sách giải đấu'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <div>
      <div className="page-header">
        <h1>🏆 Giải đấu</h1>
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
          <div className="empty-state-text">Chưa có giải đấu nào</div>
        </div>
      ) : (
        <div className="grid-cards">
          {items.map((t) => (
            <Link key={t._id} to={`/tournaments/${t._id}`} style={{ textDecoration: 'none' }}>
              <div className="grid-card">
                <div className="grid-card-header">
                  <div className="grid-card-title">{t.name}</div>
                  {statusBadge(t.status || 'DRAFT')}
                </div>
                <div className="grid-card-meta">
                  <span>📍 {t.venue || 'Chưa xác định'}</span>
                  <span>📅 {formatDate(t.startDate)} → {formatDate(t.endDate)}</span>
                  {t.prizePool ? <span>💰 {formatMoney(t.prizePool)}</span> : null}
                  {t.maxHorses ? <span>🐴 Tối đa {t.maxHorses} ngựa</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
