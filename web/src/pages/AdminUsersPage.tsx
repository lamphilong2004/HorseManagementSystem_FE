import { useEffect, useState } from 'react'
import type { Role } from '../types'
import { getAdminUsers } from '../api'

export function AdminUsersPage() {
  const [items, setItems] = useState<Array<{ id: string; name: string; role: Role }> | null>(null)

  useEffect(() => {
    getAdminUsers().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>User Management (Admin)</h2>
      <p className="muted">Quản lý tài khoản & phân quyền… (placeholder)</p>

      {!items ? <p className="muted">Loading…</p> : null}
      {items ? (
        <ul>
          {items.map((u) => (
            <li key={u.id}>
              {u.name} — <span className="muted">{u.role}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}