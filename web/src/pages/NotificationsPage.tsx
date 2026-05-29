import { useEffect, useState } from 'react'
import type { NotificationItem } from '../types'
import { getMyNotifications } from '../api'

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

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    setLoading(true)
    const params: any = {}
    if (filter === 'unread') params.isRead = false
    getMyNotifications(params)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || data?.notifications || [])
        setItems(list)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [filter])

  const unreadCount = items.filter(n => !n.isRead).length

  return (
    <div>
      <div className="page-header">
        <h1>🔔 Thông báo</h1>
        {unreadCount > 0 && (
          <span className="badge badge-ongoing">{unreadCount} chưa đọc</span>
        )}
      </div>

      <div className="filter-bar">
        <button
          className={`btn btnSmall ${filter === 'all' ? 'btnPrimary' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả
        </button>
        <button
          className={`btn btnSmall ${filter === 'unread' ? 'btnPrimary' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Chưa đọc
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <div className="empty-state-text">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </div>
          </div>
        </div>
      ) : (
        <div>
          {items.map((n) => (
            <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
              {!n.isRead && <div className="notif-dot" />}
              <div className="notif-body">
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">{formatDate(n.createdAt)}</div>
                {n.type && <span className={`badge badge-${n.type.toLowerCase()}`} style={{ marginTop: 4 }}>{n.type}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
