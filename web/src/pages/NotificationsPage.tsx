import { useEffect, useState } from 'react'
import type { NotificationItem } from '../types'
import { getMyNotifications } from '../api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { getNotificationTypeLabel } from '@/lib/status'
import { BellRing, Clock3, RefreshCw } from 'lucide-react'

function formatDate(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs} giờ trước`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

const TIME_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: '24h', label: '24 giờ gần đây' },
  { value: '7d', label: '7 ngày gần đây' },
  { value: '30d', label: '30 ngày gần đây' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
]

function getOptionLabel(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((option) => (option.value || 'all') === value)?.label || value
}

function isWithinWindow(dateValue: string, window: string) {
  if (window === 'all') return true
  const now = Date.now()
  const createdAt = new Date(dateValue).getTime()
  const windows: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }
  return now - createdAt <= windows[window]
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    getMyNotifications()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || data?.notifications || [])
        setItems(list)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [reloadKey])

  const unreadCount = items.filter((notification) => !notification.isRead).length

  const filteredItems = [...items]
    .filter((notification) => {
      if (filter === 'unread' && notification.isRead) return false
      if (filter === 'read' && !notification.isRead) return false
      return isWithinWindow(notification.createdAt, timeFilter)
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortOrder === 'oldest' ? diff : -diff
    })

  return (
    <div className="space-y-6">
      <Card className="border-slate-800/80 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl">
        <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-blue-500/10 p-3 ring-1 ring-blue-500/20">
                <BellRing className="h-7 w-7 text-blue-300" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl text-slate-50">Thông báo</CardTitle>
                <CardDescription className="max-w-2xl text-slate-300">
                  Lọc theo trạng thái đọc, thời gian và thứ tự để cập nhật thông báo nhanh hơn.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-200">Tổng {items.length}</Badge>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">{unreadCount} chưa đọc</Badge>
              <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-200">Đã đọc {items.length - unreadCount}</Badge>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:justify-end">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              className={`h-11 min-w-30 whitespace-nowrap ${filter === 'all' ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-900'}`}
              onClick={() => setFilter('all')}
            >
              Tất cả
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              className={`h-11 min-w-30 whitespace-nowrap ${filter === 'unread' ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-900'}`}
              onClick={() => setFilter('unread')}
            >
              Chưa đọc
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              className={`h-11 min-w-30 whitespace-nowrap ${filter === 'read' ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-900'}`}
              onClick={() => setFilter('read')}
            >
              Đã đọc
            </Button>

            <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value ?? 'all')}>
              <SelectTrigger className="h-11 w-45 shrink-0 border-slate-700 bg-slate-950/70 text-slate-100">
                {getOptionLabel(TIME_OPTIONS, timeFilter)}
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value ?? 'newest')}>
              <SelectTrigger className="h-11 w-45 shrink-0 border-slate-700 bg-slate-950/70 text-slate-100">
                {getOptionLabel(SORT_OPTIONS, sortOrder)}
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="h-11 min-w-30 whitespace-nowrap border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-900"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : filteredItems.length === 0 ? (
        <Card className="border-slate-800/80 bg-slate-950/70">
          <CardContent className="py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">🔔</div>
            <div className="text-lg font-semibold text-slate-100">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : filter === 'read' ? 'Không có thông báo đã đọc' : 'Chưa có thông báo nào'}
            </div>
            <p className="mt-2 text-sm text-slate-400">Hãy thay đổi bộ lọc hoặc kiểm tra lại sau.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((notification) => (
            <Card
              key={notification._id}
              className={`border-slate-800/80 bg-slate-950/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/40 ${!notification.isRead ? 'ring-1 ring-amber-500/20' : ''}`}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className={`mt-1 h-3 w-3 rounded-full ${notification.isRead ? 'bg-slate-500' : 'bg-amber-400'}`} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-100">{notification.message}</div>
                    <Badge variant="outline" className={notification.isRead ? 'border-slate-500/30 bg-slate-500/10 text-slate-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}>
                      {notification.isRead ? 'Đã đọc' : 'Chưa đọc'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDate(notification.createdAt)}
                    </span>
                    {notification.type && (
                      <Badge variant="outline" className="border-slate-700/60 bg-slate-900/60 text-slate-200">
                        {getNotificationTypeLabel(notification.type)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
