import { useEffect, useState } from 'react'
import type { Invite } from '../types'
import { getInvites } from '../api'

export function InvitesPage() {
  const [items, setItems] = useState<Invite[] | null>(null)

  useEffect(() => {
    getInvites().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Invites (Jockey)</h2>
      <p className="muted">Nhận lời mời điều khiển ngựa, xác nhận/từ chối… (placeholder)</p>

      {!items ? <p className="muted">Loading…</p> : null}
      {items ? (
        <ul>
          {items.map((i) => (
            <li key={i.id}>
              {i.horseName} — <span className="muted">{i.status}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}