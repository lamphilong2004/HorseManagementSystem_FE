import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Race } from '../../types'
import { getRefereeRaces } from '@/api'
import { AnimatedTable, type ColumnDef, type SortDirection } from '@/components/ui/animated-table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStatusClassName, getStatusLabel } from '@/lib/status'
import { Scale, ClipboardList, Activity, Calendar, CheckCircle2 } from 'lucide-react'

function statusBadge(s?: string) {
  if (!s) return null
  return (
    <Badge variant="outline" className={getStatusClassName(s, 'race') + ' font-bold'}>
      {s === 'ONGOING' && <span className="live-dot mr-2" />}
      {getStatusLabel(s, 'race')}
    </Badge>
  )
}

function formatDateTime(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN')
}

export function RefereeRacesPage() {
  const [items, setItems] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    getRefereeRaces()
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setItems(list)
      })
      .catch(() => setError('Không thể tải danh sách cuộc đua'))
      .finally(() => setLoading(false))
  }, [])

  const itemsWithId = useMemo(() => items.map((r, i) => ({ ...r, id: r._id ?? r.id ?? String(i) })), [items])

  const [sortColumn, setSortColumn] = useState<string | undefined>()
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)

  const handleSort = (columnId: string, direction: SortDirection) => {
    setSortColumn(columnId)
    setSortDirection(direction)
  }

  const handleColumnFilterChange = (columnId: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [columnId]: value }))
    setPage(1)
  }

  const filteredAndSortedItems = useMemo(() => {
    let result = [...itemsWithId]
    
    // Filters
    if (columnFilters.name) {
      result = result.filter(r => r.name?.toLowerCase().includes(columnFilters.name.toLowerCase()))
    }
    if (columnFilters.tournament) {
      result = result.filter(r => (r.tournamentId?.name || '').toLowerCase().includes(columnFilters.tournament.toLowerCase()))
    }
    if (columnFilters.status) {
      result = result.filter(r => r.status === columnFilters.status)
    }

    // Sort
    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        let aVal: any = a[sortColumn as keyof typeof a]
        let bVal: any = b[sortColumn as keyof typeof b]
        if (sortColumn === 'tournament') {
          aVal = a.tournamentId?.name || ''
          bVal = b.tournamentId?.name || ''
        } else if (sortColumn === 'scheduledAt') {
          aVal = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
          bVal = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
        }
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
        }
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      })
    }
    return result
  }, [itemsWithId, sortColumn, sortDirection, columnFilters])

  const paginatedItems = useMemo(() => {
    return filteredAndSortedItems.slice((page - 1) * 10, page * 10)
  }, [filteredAndSortedItems, page])

  const columns: ColumnDef<any>[] = [
    {
      id: 'name',
      header: 'Tên cuộc đua',
      accessorKey: 'name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: (r: any) => (
        <Link to={`/referee/races/${r._id ?? r.id}`} className="font-bold hover:underline">
          {r.name}
        </Link>
      ),
    },
    {
      id: 'scheduledAt',
      header: 'Thời gian',
      accessorKey: 'scheduledAt',
      sortable: true,
      cell: (r: any) => formatDateTime(r.scheduledAt),
    },
    {
      id: 'tournament',
      header: 'Giải đấu',
      accessorKey: 'tournamentId',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: (r: any) => r.tournamentId?.name || '—',
    },
    {
      id: 'distance',
      header: 'Khoảng cách',
      accessorKey: 'distance',
      sortable: true,
      cell: (r: any) => (r.distance ? `${r.distance} m` : '—'),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      accessorKey: 'status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Sắp tới', value: 'SCHEDULED' },
        { label: 'Đang diễn ra', value: 'ONGOING' },
        { label: 'Hoàn thành', value: 'COMPLETED' },
        { label: 'Xác nhận kết quả', value: 'RESULT_CONFIRMED' },
        { label: 'Đã hủy', value: 'CANCELLED' },
      ],
      cell: (r: any) => statusBadge(r.status),
    },
    {
      id: 'actions',
      header: 'Hành động',
      cell: (r: any) => (
        <div className="flex items-center gap-2">
          <button className="btn-link" onClick={() => navigate(`/referee/races/${r._id ?? r.id}`)}>Chi tiết</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-3xl font-black text-[var(--text)] tracking-tight flex items-center gap-2.5">
          <Scale className="h-8 w-8 text-emerald-500 shrink-0" />
          <span>Quản lý cuộc đua — Trọng tài</span>
        </h1>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thống kê phân công</CardTitle>
          <CardDescription>Thông tin nhanh về công việc trọng tài hiện tại</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
            {/* Thẻ 1: Tổng phân công */}
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 transition-all hover:bg-white/[0.04]">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <ClipboardList className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Tổng phân công</span>
                <span className="text-xs font-bold text-[var(--text)] truncate">{items.length}</span>
              </div>
            </div>

            {/* Thẻ 2: Đang diễn ra */}
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 transition-all hover:bg-white/[0.04]">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Activity className="h-4.5 w-4.5 text-amber-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Đang diễn ra</span>
                <span className="text-xs font-bold text-amber-400 truncate">{items.filter(r => r.status === 'ONGOING').length}</span>
              </div>
            </div>

            {/* Thẻ 3: Sắp tới */}
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 transition-all hover:bg-white/[0.04]">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Calendar className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Sắp tới</span>
                <span className="text-xs font-bold text-purple-400 truncate">{items.filter(r => r.status === 'SCHEDULED').length}</span>
              </div>
            </div>

            {/* Thẻ 4: Hoàn thành */}
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 transition-all hover:bg-white/[0.04]">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Hoàn thành</span>
                <span className="text-xs font-bold text-emerald-400 truncate">{items.filter(r => r.status === 'COMPLETED' || r.status === 'RESULT_CONFIRMED').length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Danh sách cuộc đua</CardTitle>
          <CardDescription>Quản lý và truy cập chi tiết mỗi cuộc đua</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : (
            <AnimatedTable
              data={paginatedItems}
              columns={columns}
              onRowClick={(r: any) => navigate(`/referee/races/${r._id ?? r.id}`)}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              columnFilters={columnFilters}
              onColumnFilterChange={handleColumnFilterChange}
              pagination={{
                page,
                pageSize: 10,
                totalItems: filteredAndSortedItems.length,
                onPageChange: setPage,
                pageSizeOptions: [10, 20, 50]
              }}
              emptyMessage={
                <div className="empty-state py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Scale className="h-6 w-6" />
                  </div>
                  <div className="text-base font-bold text-[var(--text)]">Chưa được phân công cuộc đua nào</div>
                  <p className="text-sm text-[var(--muted)] mt-1">Khi ban tổ chức phân công giám sát cuộc đua, danh sách sẽ hiển thị ở đây.</p>
                </div>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
