import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJockeyRaces, getInvites, acceptInvite, rejectInvite } from '@/api'
import type { Invite } from '@/types'

export function JockeyRacesPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [invites, setInvites] = useState<Invite[] | null>(null)
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getJockeyRaces().then(setData).catch(() => setError('Failed to load races'))
    loadInvites()
  }, [])

  function loadInvites() {
    getInvites().then(setInvites).catch(() => setInvites([]))
  }

  async function handleAccept(id: string) {
    setLoading((prev) => ({ ...prev, [id]: true }))
    try { await acceptInvite(id); loadInvites() }
    catch { alert('Failed to accept invitation') }
    finally { setLoading((prev) => ({ ...prev, [id]: false })) }
  }

  async function handleReject(id: string) {
    setLoading((prev) => ({ ...prev, [id]: true }))
    try { await rejectInvite(id); loadInvites() }
    catch { alert('Failed to reject invitation') }
    finally { setLoading((prev) => ({ ...prev, [id]: false })) }
  }

  const pendingInvites = invites?.filter((i) => i.status === 'PENDING') || []

  return (
    <div>
      {/* Pending Invites Section */}
      {invites && pendingInvites.length > 0 ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>📩 Lời mời đang chờ ({pendingInvites.length})</h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {pendingInvites.map((i) => (
              <li key={i.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong>{i.horseName || 'Ngựa thi đấu'}</strong>
                {i.message ? <span className="muted">— "{i.message}"</span> : null}
                <button className="btn btn-sm" disabled={loading[i.id]} onClick={() => handleAccept(i.id)}>
                  {loading[i.id] ? '...' : 'Accept'}
                </button>
                <button className="btn btn-sm" disabled={loading[i.id]} onClick={() => handleReject(i.id)}>
                  {loading[i.id] ? '...' : 'Reject'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* My Races Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Cuộc đua của tôi</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/app/invites" className="btn btn-sm">📩 Lời mời</Link>
            <Link to="/app/jockey/results" className="btn btn-sm">Xem kết quả</Link>
          </div>
        </div>
        <p className="muted">Danh sách cuộc đua được phân công.</p>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {!data && !error ? <p className="muted">Loading…</p> : null}
        {data && data.data && data.data.length === 0 ? <p className="muted">Chưa có cuộc đua nào được phân công.</p> : null}
        {data && data.data && data.data.length > 0 ? (
          <ul>
            {data.data.map((race: any) => (
              <li key={race._id} style={{ marginBottom: 8 }}>
                <Link to={`/app/jockey/races/${race.raceId}`}><strong>{race.raceName}</strong></Link>
                <span className="muted"> — {race.location} ({race.status})</span>
                {race.scheduledTime ? <span className="muted" style={{ display: 'block', fontSize: '0.85em' }}>{new Date(race.scheduledTime).toLocaleString()}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* All Invites History */}
      {invites && invites.length > 0 && invites.some((i) => i.status !== 'PENDING') ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Lịch sử lời mời</h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {invites.filter((i) => i.status !== 'PENDING').map((i) => (
              <li key={i.id} style={{ marginBottom: 4 }}>
                {i.horseName || 'Ngựa thi đấu'} — <span className="muted">{i.status}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
