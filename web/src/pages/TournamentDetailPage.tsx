import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Tournament, Race, LeaderboardEntry } from '../types'
import { getPublicTournament, getPublicRaces, getTournamentLeaderboard } from '../api'

function statusBadge(s: string) {
  return <span className={`badge badge-${s.toLowerCase()}`}>{s}</span>
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('vi-VN')
}

function formatMoney(n?: number) {
  if (!n) return '—'
  return n.toLocaleString('vi-VN') + ' ₫'
}

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [races, setRaces] = useState<Race[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'races' | 'leaderboard'>('races')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getPublicTournament(id).catch(() => null),
      getPublicRaces({ tournamentId: id }).catch(() => []),
      getTournamentLeaderboard(id).catch(() => []),
    ])
      .then(([t, r, lb]) => {
        if (!t) {
          setError('Không tìm thấy giải đấu')
        } else {
          setTournament(t)
        }
        const raceList = Array.isArray(r) ? r : (r?.races || r?.data || [])
        setRaces(raceList)
        const lbList = Array.isArray(lb) ? lb : (lb?.data || lb?.leaderboard || [])
        setLeaderboard(lbList)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (error) return <div className="card"><div className="alert alert-error">⚠️ {error}</div><Link to="/tournaments" className="back-link">← Quay lại</Link></div>

  if (!tournament) return null

  return (
    <div>
      <Link to="/tournaments" className="back-link">← Quay lại danh sách giải</Link>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex justify-between items-center flex-wrap gap-8">
          <div>
            <h1 style={{ margin: 0 }}>🏆 {tournament.name}</h1>
            {tournament.description && <p className="muted mt-8">{tournament.description}</p>}
          </div>
          {statusBadge(tournament.status || 'DRAFT')}
        </div>

        <div className="stat-grid mt-16">
          <div className="stat-card">
            <div className="stat-icon">📍</div>
            <div className="stat-label">Địa điểm</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{tournament.venue}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-label">Thời gian</div>
            <div className="stat-value" style={{ fontSize: 16 }}>{formatDate(tournament.startDate)} → {formatDate(tournament.endDate)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Tổng giải thưởng</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{formatMoney(tournament.prizePool)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🐴</div>
            <div className="stat-label">Số cuộc đua</div>
            <div className="stat-value">{races.length}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'races' ? 'active' : ''}`} onClick={() => setActiveTab('races')}>
            📅 Lịch đua ({races.length})
          </button>
          <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
            🥇 Bảng xếp hạng
          </button>
        </div>

        {activeTab === 'races' && (
          races.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-text">Chưa có cuộc đua nào trong giải</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table table-clickable">
                <thead>
                  <tr>
                    <th>Cuộc đua</th>
                    <th>Khoảng cách</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Giải thưởng</th>
                  </tr>
                </thead>
                <tbody>
                  {races.map((r) => (
                    <tr key={r._id} onClick={() => window.location.href = `/races/${r._id}`}>
                      <td className="fw-600">{r.name}</td>
                      <td>{r.distance ? `${r.distance}m` : '—'}</td>
                      <td className="fs-13">{formatDateTime(r.scheduledAt)}</td>
                      <td>{statusBadge(r.status)}</td>
                      <td className="money">{r.prizeFirst ? formatMoney(r.prizeFirst) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'leaderboard' && (
          leaderboard.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🥇</div>
              <div className="empty-state-text">Chưa có dữ liệu bảng xếp hạng</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tên</th>
                    <th>Số trận</th>
                    <th>Thắng</th>
                    <th>Tổng điểm</th>
                    <th>Giải thưởng</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className={`position-cell ${idx < 3 ? `rank-${idx + 1}` : ''}`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </span>
                      </td>
                      <td className="fw-600">{entry.horseName || entry.jockeyName || '—'}</td>
                      <td>{entry.races ?? '—'}</td>
                      <td>{entry.wins ?? '—'}</td>
                      <td className="fw-700">{entry.totalPoints ?? '—'}</td>
                      <td className="money">{formatMoney(entry.totalPrize)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
