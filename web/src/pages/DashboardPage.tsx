import { Link, Navigate } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'

export function DashboardPage() {
  const { session } = useSession()

  // Admin does not have a dashboard, redirect to scheduling page
  if (session?.user.role === 'ADMIN') {
    return <Navigate to="/app/admin/scheduling" replace />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex-between">
        <div>
          <h1>👋 Xin chào, {session?.user.name}</h1>
          <p className="muted text-sm">
            Vai trò của bạn: <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>{session?.user.role}</strong>
          </p>
        </div>
      </div>

      <div className="grid-3">
        <Link to="/app/tournaments" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-icon">🏆</div>
          <div className="stat-value" style={{ fontSize: 18, marginTop: 12 }}>Xem Giải Đấu</div>
          <div className="stat-label">Khám phá các giải đang mở</div>
        </Link>
        <Link to="/app/races" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-icon">🏁</div>
          <div className="stat-value" style={{ fontSize: 18, marginTop: 12 }}>Xem Cuộc Đua</div>
          <div className="stat-label">Lịch trình & Kết quả</div>
        </Link>

        {session?.user.role === 'OWNER' && (
          <Link to="/app/horses" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-icon">🐎</div>
            <div className="stat-value" style={{ fontSize: 18, marginTop: 12 }}>Ngựa của tôi</div>
            <div className="stat-label">Đăng ký ngựa & Thuê Jockey</div>
          </Link>
        )}
        {session?.user.role === 'JOCKEY' && (
          <Link to="/app/invites" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-icon">✉️</div>
            <div className="stat-value" style={{ fontSize: 18, marginTop: 12 }}>Lời mời</div>
            <div className="stat-label">Quản lý lời mời thi đấu</div>
          </Link>
        )}
        {session?.user.role === 'SPECTATOR' && (
          <Link to="/app/predictions" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-icon">🔮</div>
            <div className="stat-value" style={{ fontSize: 18, marginTop: 12 }}>Dự đoán</div>
            <div className="stat-label">Đặt cược & Nhận thưởng</div>
          </Link>
        )}
        {session?.user.role === 'REFEREE' && (
          <Link to="/app/referee/races" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-icon">⚖️</div>
            <div className="stat-value" style={{ fontSize: 18, marginTop: 12 }}>Trọng tài</div>
            <div className="stat-label">Giám sát & Công bố kết quả</div>
          </Link>
        )}
      </div>
    </div>
  )
}
