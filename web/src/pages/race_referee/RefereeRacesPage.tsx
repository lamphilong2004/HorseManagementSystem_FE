import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Race } from '../../types'
import { getRefereeRaces } from '@/api'
import { AnimatedTable, type ColumnDef } from '@/components/ui/animated-table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function statusBadge(s?: string) {
  if (!s) return null
  return (
    <Badge variant="outline" className="font-bold">
      {s === 'ONGOING' && <span className="live-dot mr-2" />}
      {s}
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

  const columns: ColumnDef<any>[] = [
    {
      id: 'name',
      header: 'Tên cuộc đua',
      accessorKey: 'name',
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
      cell: (r: any) => formatDateTime(r.scheduledAt),
    },
    {
      id: 'tournament',
      header: 'Giải đấu',
      accessorKey: 'tournamentId',
      cell: (r: any) => r.tournamentId?.name || '—',
    },
    {
      id: 'distance',
      header: 'Khoảng cách',
      accessorKey: 'distance',
      cell: (r: any) => (r.distance ? `${r.distance} m` : '—'),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      accessorKey: 'status',
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
    <div>
      <div className="page-header">
        <h1>⚖️ Quản lý cuộc đua — Trọng tài</h1>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thống kê phân công</CardTitle>
          <CardDescription>Thông tin nhanh về công việc trọng tài hiện tại</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-label">Tổng phân công</div>
              <div className="stat-value">{items.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔴</div>
              <div className="stat-label">Đang diễn ra</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{items.filter(r => r.status === 'ONGOING').length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-label">Sắp tới</div>
              <div className="stat-value" style={{ color: 'var(--info)' }}>{items.filter(r => r.status === 'SCHEDULED').length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-label">Hoàn thành</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{items.filter(r => r.status === 'COMPLETED' || r.status === 'RESULT_CONFIRMED').length}</div>
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
              data={itemsWithId}
              columns={columns}
              onRowClick={(r: any) => navigate(`/referee/races/${r._id ?? r.id}`)}
              emptyMessage={
                <div className="empty-state py-8">
                  <div className="empty-state-icon">⚖️</div>
                  <div className="empty-state-text">Chưa được phân công cuộc đua nào</div>
                </div>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
