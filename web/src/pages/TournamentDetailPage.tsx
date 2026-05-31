import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import type { Tournament, Race, LeaderboardEntry } from '../types'
import { getPublicTournament, getPublicRaces, getTournamentLeaderboard } from '@/api'
import { AnimatedTable } from '../components/ui/animated-table'

function statusBadge(s?: string) {
  if (!s) return null
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
  return n.toLocaleString('vi-VN') + ' VND'
}

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
      getPublicRaces({ tournamentId: id }).catch(() => [] as any),
      getTournamentLeaderboard(id).catch(() => [] as any),
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

  const racesColumns = [
    {
      id: 'name',
      header: 'Cuộc đua',
      cell: (r: Race) => <span className="fw-600">{r.name}</span>,
    },
    {
      id: 'distance',
      header: 'Khoảng cách',
      cell: (r: Race) => <span>{r.distance ? `${r.distance}m` : '—'}</span>,
    },
    {
      id: 'scheduledAt',
      header: 'Thời gian',
      cell: (r: Race) => <span className="fs-13">{formatDateTime(r.scheduledAt)}</span>,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (r: Race) => statusBadge(r.status),
    },
    {
      id: 'prizeFirst',
      header: 'Giải thưởng',
      align: 'right' as const,
      cell: (r: Race) => <span className="money">{r.prizeFirst ? formatMoney(r.prizeFirst) : '—'}</span>,
    },
  ]

  const leaderboardColumns = [
    {
      id: 'rank',
      header: '#',
      cell: (_: LeaderboardEntry, idx: number) => (
        <span className={`position-cell ${idx < 3 ? `rank-${idx + 1}` : ''}`}>
          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Tên',
      cell: (entry: LeaderboardEntry) => <span className="fw-600">{entry.horseName || entry.jockeyName || '—'}</span>,
    },
    {
      id: 'races',
      header: 'Số trận',
      cell: (entry: LeaderboardEntry) => <span>{entry.races ?? '—'}</span>,
    },
    {
      id: 'wins',
      header: 'Thắng',
      cell: (entry: LeaderboardEntry) => <span>{entry.wins ?? '—'}</span>,
    },
    {
      id: 'totalPoints',
      header: 'Tổng điểm',
      cell: (entry: LeaderboardEntry) => <span className="fw-700">{entry.totalPoints ?? '—'}</span>,
    },
    {
      id: 'totalPrize',
      header: 'Giải thưởng',
      align: 'right' as const,
      cell: (entry: LeaderboardEntry) => <span className="money">{formatMoney(entry.totalPrize)}</span>,
    },
  ]

  const racesWithId = races.map((r) => ({ ...r, id: r.id || r._id || '' }))
  const leaderboardWithId = leaderboard.map((entry, idx) => ({ ...entry, id: entry.id || entry._id || String(idx) }))

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
        <div className="tabs" style={{ marginBottom: 16 }}>
          <button className={`tab-btn ${activeTab === 'races' ? 'active' : ''}`} onClick={() => setActiveTab('races')}>
            📅 Lịch đua ({races.length})
          </button>
          <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
            🥇 Bảng xếp hạng
          </button>
        </div>

        {activeTab === 'races' && (
          <AnimatedTable
            data={racesWithId}
            columns={racesColumns}
            onRowClick={(r: any) => navigate(`/races/${r._id}`)}
            emptyMessage={
              <div className="empty-state py-8">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-text">Chưa có cuộc đua nào trong giải</div>
              </div>
            }
          />
        )}

        {activeTab === 'leaderboard' && (
          <AnimatedTable
            data={leaderboardWithId}
            columns={leaderboardColumns as any}
            emptyMessage={
              <div className="empty-state py-8">
                <div className="empty-state-icon">🥇</div>
                <div className="empty-state-text">Chưa có dữ liệu bảng xếp hạng</div>
              </div>
            }
          />
        )}
      </div>
    </div>
  )
}
