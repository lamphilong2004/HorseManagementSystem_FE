import { useEffect, useRef, useState, startTransition, useMemo } from 'react'
import type { Role, User } from '../../types'
import { getAdminUsers, createAdminUser, updateUserRole, toggleUserStatus, deleteUser } from '@/api'
import { AnimatedTable, type ColumnDef, type SortDirection } from '@/components/ui/animated-table'
import { Users, CheckCircle, Lock, Search, Key, Trash2, Unlock, MoreHorizontal, AlertTriangle } from 'lucide-react'

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
        className="btn btn-sm btn-ghost btn-icon flex items-center justify-center p-0"
        onClick={() => setOpen((o) => !o)}
        title="Tác vụ"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="dropdown-menu">
          <button
            className="dropdown-item flex items-center gap-2"
            onClick={() => { setOpen(false); onEditRole() }}
          >
            <Key className="w-3.5 h-3.5 text-blue-400" />
            <span>Phân quyền</span>
          </button>
          <button
            className="dropdown-item flex items-center gap-2"
            onClick={() => { setOpen(false); onToggle() }}
          >
            {user.status === 'ACTIVE' ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Khóa tài khoản</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mở khóa</span>
              </>
            )}
          </button>
          <div className="dropdown-divider" />
          <button
            className="dropdown-item dropdown-item-danger flex items-center gap-2"
            onClick={() => { setOpen(false); onDelete() }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa tài khoản</span>
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

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [createName, setCreateName] = useState<string>('')
  const [createEmail, setCreateEmail] = useState<string>('')
  const [createPassword, setCreatePassword] = useState<string>('')
  const [createRole, setCreateRole] = useState<Role>('OWNER')
  const [createPhone, setCreatePhone] = useState<string>('')

  // Toast
  const { toasts, show: showToast } = useToast()
  const [lastModifiedUserId, setLastModifiedUserId] = useState<string | null>(null)

  // Sorting & Filtering state
  const [sortColumn, setSortColumn] = useState<string | undefined>()
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  const handleColumnFilterChange = (columnId: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [columnId]: value }))
    setPage(1)
  }

  // Pagination state
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const handleSort = (columnId: string, direction: SortDirection) => {
    setSortColumn(columnId)
    setSortDirection(direction)
  }

  const fetchUsers = (highlightId?: string) => {
    setLoading(true)
    setError(null)
    const targetId = highlightId || lastModifiedUserId
    getAdminUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      limit: 100
    })
      .then((data) => { 
        const sorted = [...data].sort((a, b) => {
          const aId = a.id || a._id
          const bId = b.id || b._id
          if (targetId) {
            if (aId === targetId) return -1
            if (bId === targetId) return 1
          }
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
        setUsers(sorted)
        setLoading(false) 
      })
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
      setLastModifiedUserId(user.id)
      showToast(`Đã ${isActive ? 'khóa' : 'mở khóa'} tài khoản ${user.name}`)
      fetchUsers(user.id)
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
      setLastModifiedUserId(editingUser.id)
      showToast(`Đã phân quyền ${roleLabel(selectedRole)} cho ${editingUser.name}`)
      setEditingUser(null)
      fetchUsers(editingUser.id)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra', 'error')
    }
  }

  const handleCreateUser = async () => {
    if (!createName || !createEmail || !createPassword || !createRole) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning')
      return
    }
    try {
      await createAdminUser({
        name: createName,
        email: createEmail,
        password: createPassword,
        role: createRole,
        phone: createPhone || undefined,
      })
      showToast(`Tạo thành công tài khoản cho ${createName}`)
      setShowCreateModal(false)
      fetchUsers()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản', 'error')
    }
  }

  // Memoized columns definition for AnimatedTable
  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      id: 'name',
      header: 'Người dùng',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: (row) => (
        <div className="flex-gap-8 items-center" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className={`avatar ${avatarColorClass(row.role)}`}>
            {getInitials(row.name)}
          </div>
          <div>
            <div className="font-bold text-[var(--text)]">{row.name}</div>
            <div className="muted text-xs">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      id: 'role',
      header: 'Vai trò',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Horse Owner', value: 'OWNER' },
        { label: 'Jockey', value: 'JOCKEY' },
        { label: 'Referee', value: 'REFEREE' },
        { label: 'Spectator', value: 'SPECTATOR' },
      ],
      cell: (row) => (
        <span className={`badge ${roleBadgeClass(row.role)}`}>
          {roleLabel(row.role)}
        </span>
      )
    },
    {
      id: 'status',
      header: 'Trạng thái',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Hoạt động', value: 'ACTIVE' },
        { label: 'Đã khóa', value: 'INACTIVE' },
      ],
      cell: (row) => (
        <span className={`badge ${row.status === 'ACTIVE' ? 'badge-approved' : 'badge-rejected'}`}>
          {row.status === 'ACTIVE' ? '● Hoạt động' : '○ Đã khóa'}
        </span>
      )
    },
    {
      id: 'phone',
      header: 'Số điện thoại',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: (row) => <span className="muted text-sm">{row.phone || '—'}</span>
    },
    {
      id: 'address',
      header: 'Địa chỉ',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: (row) => <span className="muted text-sm">{(row as any).address || '—'}</span>
    },
    {
      id: 'createdAt',
      header: 'Ngày tạo',
      sortable: true,
      cell: (row) => (
        <span className="muted text-sm">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString('vi-VN') : '—'}
        </span>
      )
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <ActionMenu
          user={row}
          onEditRole={() => { setEditingUser(row); setSelectedRole(row.role) }}
          onToggle={() => handleToggleStatus(row)}
          onDelete={() => handleDeleteUser(row)}
        />
      )
    }
  ], [setEditingUser, setSelectedRole, handleToggleStatus, handleDeleteUser])

  // Memoized sorted and filtered users list
  const filteredAndSortedUsers = useMemo(() => {
    if (!users) return null
    
    // Apply column filters first
    let result = users.filter((u) => {
      if (columnFilters.name) {
        const query = columnFilters.name.toLowerCase()
        if (!u.name.toLowerCase().includes(query) && !(u.email || '').toLowerCase().includes(query)) return false
      }
      if (columnFilters.phone) {
        if (!(u.phone || '').toLowerCase().includes(columnFilters.phone.toLowerCase())) return false
      }
      if (columnFilters.address) {
        if (!((u as any).address || '').toLowerCase().includes(columnFilters.address.toLowerCase())) return false
      }
      if (columnFilters.role && u.role !== columnFilters.role) return false
      if (columnFilters.status && u.status !== columnFilters.status) return false
      return true
    })

    if (!sortColumn || !sortDirection) return result

    return result.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof User]
      let bVal: any = b[sortColumn as keyof User]

      if (sortColumn === 'name') {
        aVal = a.name
        bVal = b.name
      } else if (sortColumn === 'createdAt') {
        aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0
        bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal, 'vi')
          : bVal.localeCompare(aVal, 'vi')
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      return 0
    })
  }, [users, sortColumn, sortDirection, columnFilters])

  // Memoized paginated users list
  const paginatedUsers = useMemo(() => {
    if (!filteredAndSortedUsers) return []
    const start = (page - 1) * pageSize
    return filteredAndSortedUsers.slice(start, start + pageSize)
  }, [filteredAndSortedUsers, page, pageSize])

  // Reset pagination page when data source changes
  useEffect(() => {
    setPage(1)
  }, [users])

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Header */}
        <div className="flex-between">
          <div>
            <h1>Quản lý Tài khoản</h1>
            <p className="muted text-sm">Phân quyền, kích hoạt/khóa và quản lý thành viên hệ thống.</p>
          </div>
          <button
            className="btn btnPrimary flex items-center gap-1.5"
            onClick={() => {
              setCreateName('')
              setCreateEmail('')
              setCreatePassword('')
              setCreateRole('OWNER')
              setCreatePhone('')
              setShowCreateModal(true)
            }}
          >
            <Users className="w-4 h-4" />
            <span>Tạo tài khoản mới</span>
          </button>
        </div>

        {/* Stat Cards */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="stat-value" style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>{loading ? '—' : total}</div>
              <div className="stat-label" style={{ fontSize: 11, fontWeight: 700 }}>Tổng tài khoản</div>
            </div>
          </div>
          <div className="stat-card flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="stat-value" style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>{loading ? '—' : activeCount}</div>
              <div className="stat-label" style={{ fontSize: 11, fontWeight: 700 }}>Đang hoạt động</div>
            </div>
          </div>
          <div className="stat-card flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <div className="stat-value" style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>{loading ? '—' : inactiveCount}</div>
              <div className="stat-label" style={{ fontSize: 11, fontWeight: 700 }}>Đã khóa</div>
            </div>
          </div>
        </div>

        <div className="card w-full" style={{ padding: '20px 24px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
            <button type="submit" className="btn btnPrimary flex items-center gap-1.5" style={{ height: 40, alignSelf: 'flex-end' }}>
              <Search className="w-4 h-4" />
              <span>Tìm kiếm</span>
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="card" style={{ background: 'var(--danger-light)', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Modern Animated Table */}
        <AnimatedTable
          data={paginatedUsers}
          columns={columns}
          loading={loading}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          columnFilters={columnFilters}
          onColumnFilterChange={handleColumnFilterChange}
          emptyMessage={
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <span className="empty-state-icon">👤</span>
              <div className="empty-state-title">Không tìm thấy người dùng</div>
              <p className="empty-state-desc">Thử thay đổi bộ lọc tìm kiếm</p>
            </div>
          }
          pagination={{
            page,
            pageSize,
            totalItems: filteredAndSortedUsers?.length || 0,
            onPageChange: setPage,
            onPageSizeChange: (size) => { setPageSize(size); setPage(1); }
          }}
        />

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
                  <option value="SPECTATOR">Spectator (Khán giả) — Xem & Dự đoán</option>
                  <option value="OWNER">Horse Owner (Chủ ngựa) — Quản lý ngựa</option>
                  <option value="JOCKEY">Jockey (Nài ngựa) — Kỵ sĩ thi đấu</option>
                  <option value="REFEREE">Referee (Trọng tài) — Trọng tài</option>
                </select>
              </div>

              {selectedRole && selectedRole !== editingUser.role && (
                <div className="flex items-center gap-2" style={{ padding: '10px 14px', background: 'var(--warning-light)', borderRadius: 'var(--radius)', fontSize: 13, color: '#92400e' }}>
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Đang thay đổi từ <strong>{roleLabel(editingUser.role)}</strong> → <strong>{roleLabel(selectedRole)}</strong></span>
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false) }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>👤 Tạo tài khoản mới</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Họ và tên <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Email <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Mật khẩu <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Số điện thoại</label>
                <input
                  type="text"
                  placeholder="0912345678"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Vai trò <span style={{ color: 'red' }}>*</span></label>
                <select value={createRole} onChange={(e) => setCreateRole(e.target.value as Role)}>
                  <option value="OWNER">Chủ ngựa (Horse Owner)</option>
                  <option value="JOCKEY">Kỵ sĩ (Jockey)</option>
                  <option value="REFEREE">Trọng tài (Referee)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowCreateModal(false)}>Hủy</button>
              <button
                className="btn btnPrimary"
                onClick={handleCreateUser}
                disabled={!createName || !createEmail || !createPassword || !createRole}
              >
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
