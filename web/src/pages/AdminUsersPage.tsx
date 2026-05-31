import { useEffect, useRef, useState, startTransition } from 'react'
import type { Role, User } from '../types'
import { getAdminUsers, updateUserRole, toggleUserStatus, deleteUser } from '../api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function avatarColorClass(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'avatar-admin',
    OWNER: 'avatar-owner',
    JOCKEY: 'avatar-jockey',
    REFEREE: 'avatar-referee',
    SPECTATOR: 'avatar-spectator',
  }
  return map[role] ?? 'avatar-default'
}

function roleBadgeClass(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'role-admin',
    OWNER: 'role-owner',
    JOCKEY: 'role-jockey',
    REFEREE: 'role-referee',
    SPECTATOR: 'role-spectator',
  }
  return map[role] ?? ''
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'Admin',
    OWNER: 'Horse Owner',
    JOCKEY: 'Jockey',
    REFEREE: 'Referee',
    SPECTATOR: 'Spectator',
  }
  return map[role] ?? role
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastItem = { id: number; type: 'success' | 'error' | 'warning'; message: string }
let toastIdCounter = 0

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const show = (message: string, type: ToastItem['type'] = 'success') => {
    const id = ++toastIdCounter
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }
  return { toasts, show }
}

const toastIcon = { success: '✅', error: '❌', warning: '⚠️' }

// ─── Dropdown row actions ─────────────────────────────────────────────────────

function ActionMenu({
  user,
  onEditRole,
  onToggle,
  onDelete,
}: {
  user: User
  onEditRole: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (user.role === 'ADMIN') {
    return <span className="muted text-xs">—</span>
  }

  return (
    <div className="dropdown-wrapper" ref={ref}>
      <button
        className="btn btn-sm btn-ghost btn-icon"
        onClick={() => setOpen((o) => !o)}
        title="Tác vụ"
      >
        ⋯
      </button>
      {open && (
        <div className="dropdown-menu">
          <button
            className="dropdown-item"
            onClick={() => { setOpen(false); onEditRole() }}
          >
            🔑 Phân quyền
          </button>
          <button
            className="dropdown-item"
            onClick={() => { setOpen(false); onToggle() }}
          >
            {user.status === 'ACTIVE' ? '🔒 Khóa tài khoản' : '🔓 Mở khóa'}
          </button>
          <div className="dropdown-divider" />
          <button
            className="dropdown-item dropdown-item-danger"
            onClick={() => { setOpen(false); onDelete() }}
          >
            🗑️ Xóa tài khoản
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Filters
  const [search, setSearch] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Edit Role Modal
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | ''>('')

  // Toast
  const { toasts, show: showToast } = useToast()

  const fetchUsers = () => {
    setLoading(true)
    setError(null)
    getAdminUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    })
      .then((data) => { setUsers(data); setLoading(false) })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách người dùng')
        setLoading(false)
      })
  }

  useEffect(() => { fetchUsers() }, [roleFilter, statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); fetchUsers() }

  const handleToggleStatus = async (user: User) => {
    if (user.role === 'ADMIN') return showToast('Không thể thay đổi trạng thái của Admin', 'warning')
    const isActive = user.status === 'ACTIVE'
    if (!window.confirm(`${isActive ? 'Khóa' : 'Mở khóa'} tài khoản của ${user.name}?`)) return
    try {
      await toggleUserStatus(user.id, !isActive)
      showToast(`Đã ${isActive ? 'khóa' : 'mở khóa'} tài khoản ${user.name}`)
      fetchUsers()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra', 'error')
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'ADMIN') return showToast('Không thể xóa tài khoản Admin', 'warning')
    if (!window.confirm(`Xóa tài khoản của ${user.name}? Thao tác này không thể hoàn tác.`)) return
    try {
      await deleteUser(user.id)
      showToast(`Đã xóa tài khoản ${user.name}`)
      fetchUsers()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra', 'error')
    }
  }

  const handleSaveRole = async () => {
    if (!editingUser || !selectedRole) return
    try {
      await updateUserRole(editingUser.id, selectedRole)
      showToast(`Đã phân quyền ${roleLabel(selectedRole)} cho ${editingUser.name}`)
      setEditingUser(null)
      fetchUsers()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra', 'error')
    }
  }

  // Stats
  const total = users?.length ?? 0
  const activeCount = users?.filter((u) => u.status === 'ACTIVE').length ?? 0
  const inactiveCount = total - activeCount

  return (
    <>
      {/* Toast */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{toastIcon[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div className="flex-between">
          <div>
            <h1>Quản lý Tài khoản</h1>
            <p className="muted text-sm">Phân quyền, kích hoạt/khóa và quản lý thành viên hệ thống.</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card stat-card-primary">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{loading ? '—' : total}</div>
            <div className="stat-label">Tổng tài khoản</div>
          </div>
          <div className="stat-card stat-card-info">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{loading ? '—' : activeCount}</div>
            <div className="stat-label">Đang hoạt động</div>
          </div>
          <div className="stat-card stat-card-danger">
            <div className="stat-icon">🔒</div>
            <div className="stat-value">{loading ? '—' : inactiveCount}</div>
            <div className="stat-label">Đã khóa</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="card" style={{ padding: '14px 18px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 260px' }}>
              <label style={{ marginBottom: 4 }}>Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ marginBottom: 4 }}>Vai trò</label>
              <select value={roleFilter} onChange={(e) => startTransition(() => setRoleFilter(e.target.value))}>
                <option value="">Tất cả vai trò</option>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Horse Owner</option>
                <option value="JOCKEY">Jockey</option>
                <option value="REFEREE">Referee</option>
                <option value="SPECTATOR">Spectator</option>
              </select>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ marginBottom: 4 }}>Trạng thái</label>
              <select value={statusFilter} onChange={(e) => startTransition(() => setStatusFilter(e.target.value))}>
                <option value="">Tất cả</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Đã khóa</option>
              </select>
            </div>
            <button type="submit" className="btn btnPrimary" style={{ height: 40, alignSelf: 'flex-end' }}>
              🔍 Tìm kiếm
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="card" style={{ background: 'var(--danger-light)', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Table */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '8px 0' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                    <div className="skeleton skeleton-text-sm" style={{ width: '60%' }} />
                  </div>
                  <div className="skeleton" style={{ width: 72, height: 22, borderRadius: 99 }} />
                  <div className="skeleton" style={{ width: 72, height: 22, borderRadius: 99 }} />
                  <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : !users || users.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">👤</span>
              <div className="empty-state-title">Không tìm thấy người dùng</div>
              <p className="empty-state-desc">Thử thay đổi bộ lọc tìm kiếm</p>
            </div>
          ) : (
            <div className="admin-table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Số điện thoại</th>
                    <th>Ngày tạo</th>
                    <th style={{ textAlign: 'right' }}>Tác vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex-gap-8">
                          <div className={`avatar ${avatarColorClass(u.role)}`}>
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: 'var(--text)' }}>{u.name}</div>
                            <div className="muted text-xs">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${roleBadgeClass(u.role)}`}>
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.status === 'ACTIVE' ? 'badge-approved' : 'badge-rejected'}`}>
                          {u.status === 'ACTIVE' ? '● Hoạt động' : '○ Đã khóa'}
                        </span>
                      </td>
                      <td className="muted text-sm">{u.phone || '—'}</td>
                      <td className="muted text-sm">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <ActionMenu
                          user={u}
                          onEditRole={() => { setEditingUser(u); setSelectedRole(u.role) }}
                          onToggle={() => handleToggleStatus(u)}
                          onDelete={() => handleDeleteUser(u)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Row count */}
        {users && users.length > 0 && (
          <p className="muted text-xs" style={{ textAlign: 'right', marginTop: -8 }}>
            Hiển thị {users.length} tài khoản
          </p>
        )}
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditingUser(null) }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>🔑 Thay đổi vai trò</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* User info */}
              <div className="flex-gap-12" style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                <div className={`avatar avatar-lg ${avatarColorClass(editingUser.role)}`}>
                  {getInitials(editingUser.name)}
                </div>
                <div>
                  <div className="font-bold" style={{ fontSize: 15 }}>{editingUser.name}</div>
                  <div className="muted text-sm">{editingUser.email}</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`badge ${roleBadgeClass(editingUser.role)}`}>
                      Hiện tại: {roleLabel(editingUser.role)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Chọn vai trò mới</label>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as Role)}>
                  <option value="SPECTATOR">👁️ Spectator — Xem & Dự đoán</option>
                  <option value="OWNER">🐎 Horse Owner — Quản lý ngựa</option>
                  <option value="JOCKEY">🏇 Jockey — Kỵ sĩ thi đấu</option>
                  <option value="REFEREE">⚖️ Referee — Trọng tài</option>
                </select>
              </div>

              {selectedRole && selectedRole !== editingUser.role && (
                <div style={{ padding: '10px 14px', background: 'var(--warning-light)', borderRadius: 'var(--radius)', fontSize: 13, color: '#92400e' }}>
                  ⚠️ Đang thay đổi từ <strong>{roleLabel(editingUser.role)}</strong> → <strong>{roleLabel(selectedRole)}</strong>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setEditingUser(null)}>Hủy</button>
              <button
                className="btn btnPrimary"
                onClick={handleSaveRole}
                disabled={!selectedRole || selectedRole === editingUser.role}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
