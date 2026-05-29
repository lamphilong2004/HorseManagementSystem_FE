import { useEffect, useState } from 'react'
import type { Horse } from '../types'
import { getHorses } from '../api'

export function HorsesPage() {
  const [items, setItems] = useState<Horse[] | null>(null)

  useEffect(() => {
    getHorses().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Horses (Owner)</h2>
      <p className="muted">Quản lý thông tin ngựa, đăng ký tham gia, chọn/thuê jockey… (placeholder)</p>

      {!items ? <p className="muted">Loading…</p> : null}
      {items ? (
        <ul>
          {items.map((h) => (
            <li key={h._id}>{h.name}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
