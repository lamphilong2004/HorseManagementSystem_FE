import { useEffect, useState } from 'react'
import type { Race } from '../types'
import { getRefereeRaces } from '@/api'

export function RefereeRacesPage() {
  const [items, setItems] = useState<Race[] | null>(null)

  useEffect(() => {
    getRefereeRaces().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Race Operations (Referee)</h2>
      <p className="muted">Kiểm tra trước đua, theo dõi, xử lý vi phạm, xác nhận kết quả…</p>

      {!items ? <p className="muted">Loading…</p> : null}
      {items ? (
        <ul>
          {items.map((r) => (
            <li key={r.id}>
              {r.name} — <span className="muted">{r.status}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
