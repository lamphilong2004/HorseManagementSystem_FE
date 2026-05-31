import { Link, Navigate } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Magnetic } from '@/components/ui/magnetic'
import { ShutterText } from '@/components/ui/shutter-text'

export function DashboardPage() {
  const { session } = useSession()

  // Admin does not have a dashboard, redirect to scheduling page
  if (session?.user.role === 'ADMIN') {
    return <Navigate to="/app/admin/scheduling" replace />
  }

  const role = session?.user.role
  const useShutter = role === 'SPECTATOR' || role === 'REFEREE'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: '12px 0' }}>
      {/* Header section with custom reveal animations */}
      <ScrollReveal direction="down" duration={0.8}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {useShutter ? (
              <ShutterText text="DASHBOARD" trigger="auto" className="text-xs font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase" />
            ) : (
              <span className="text-xs font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">DASHBOARD</span>
            )}
          </div>
          {useShutter ? (
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>👋</span>
              <ShutterText text={`Xin chào, ${session?.user.name || ''}`} trigger="auto" />
            </h1>
          ) : (
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, color: 'var(--text)' }}>
              👋 Xin chào, <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>{session?.user.name}</span>
            </h1>
          )}
          <p className="muted text-sm font-bold">
            Chào mừng bạn quay lại hệ thống. Vai trò của bạn: <strong style={{ color: 'var(--primary)', fontWeight: 800 }}>{role}</strong>
          </p>
        </div>
      </ScrollReveal>

      {/* Grid containing action cards with magnetic interaction */}
      <div className="grid-3">
        <ScrollReveal direction="up" duration={0.8} delay={0.1}>
          <Magnetic intensity={0.2} range={100}>
            <Link to="/app/tournaments" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
              <Card className="card card-hover border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg" style={{ cursor: 'pointer', height: '100%', padding: '32px 28px' }}>
                <CardHeader style={{ padding: 0 }}>
                  <div style={{ fontSize: '44px', marginBottom: 16 }}>🏆</div>
                  <CardTitle className="text-2xl font-black text-(--text)">
                    {useShutter ? (
                      <ShutterText text="Xem Giải Đấu" trigger="auto" />
                    ) : (
                      "Xem Giải Đấu"
                    )}
                  </CardTitle>
                  <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                    Khám phá các giải đấu đua ngựa hấp dẫn đang diễn ra, xem chi tiết lịch thi đấu và bảng xếp hạng thành tích.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </Magnetic>
        </ScrollReveal>

        <ScrollReveal direction="up" duration={0.8} delay={0.2}>
          <Magnetic intensity={0.2} range={100}>
            <Link to="/app/races" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
              <Card className="card card-hover border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg" style={{ cursor: 'pointer', height: '100%', padding: '32px 28px' }}>
                <CardHeader style={{ padding: 0 }}>
                  <div style={{ fontSize: '44px', marginBottom: 16 }}>🏁</div>
                  <CardTitle className="text-2xl font-black text-(--text)">
                    {useShutter ? (
                      <ShutterText text="Xem Cuộc Đua" trigger="auto" />
                    ) : (
                      "Xem Cuộc Đua"
                    )}
                  </CardTitle>
                  <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                    Cập nhật danh sách các cuộc đua, thông tin cự ly, thời gian xuất phát và theo dõi diễn biến kết quả thi đấu.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </Magnetic>
        </ScrollReveal>

        {role === 'OWNER' && (
          <ScrollReveal direction="up" duration={0.8} delay={0.3}>
            <Magnetic intensity={0.2} range={100}>
              <Link to="/app/horses" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <Card className="card card-hover border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg" style={{ cursor: 'pointer', height: '100%', padding: '32px 28px' }}>
                  <CardHeader style={{ padding: 0 }}>
                    <div style={{ fontSize: '44px', marginBottom: 16 }}>🐎</div>
                    <CardTitle className="text-2xl font-black text-(--text)">Ngựa Của Tôi</CardTitle>
                    <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                      Quản lý đội ngựa thi đấu cá nhân, đăng ký tham gia các vòng đua mới và gửi lời mời thuê nài ngựa (Jockey).
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Magnetic>
          </ScrollReveal>
        )}

        {role === 'JOCKEY' && (
          <ScrollReveal direction="up" duration={0.8} delay={0.3}>
            <Magnetic intensity={0.2} range={100}>
              <Link to="/app/invites" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <Card className="card card-hover border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg" style={{ cursor: 'pointer', height: '100%', padding: '32px 28px' }}>
                  <CardHeader style={{ padding: 0 }}>
                    <div style={{ fontSize: '44px', marginBottom: 16 }}>✉️</div>
                    <CardTitle className="text-2xl font-black text-(--text)">Lời Mời Của Tôi</CardTitle>
                    <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                      Xem và phản hồi các yêu cầu mời điều khiển ngựa từ những chủ ngựa khác, theo dõi lịch trình nhận việc.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Magnetic>
          </ScrollReveal>
        )}

        {role === 'SPECTATOR' && (
          <ScrollReveal direction="up" duration={0.8} delay={0.3}>
            <Magnetic intensity={0.2} range={100}>
              <Link to="/app/predictions" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <Card className="card card-hover border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg" style={{ cursor: 'pointer', height: '100%', padding: '32px 28px' }}>
                  <CardHeader style={{ padding: 0 }}>
                    <div style={{ fontSize: '44px', marginBottom: 16 }}>🔮</div>
                    <CardTitle className="text-2xl font-black text-(--text)">
                      <ShutterText text="Dự Đoán Kết Quả" trigger="auto" />
                    </CardTitle>
                    <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                      Sử dụng điểm thưởng ảo để tham gia dự đoán kết quả những chú ngựa chiến thắng và nhận phần quà hấp dẫn.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Magnetic>
          </ScrollReveal>
        )}

        {role === 'REFEREE' && (
          <ScrollReveal direction="up" duration={0.8} delay={0.3}>
            <Magnetic intensity={0.2} range={100}>
              <Link to="/app/referee/races" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <Card className="card card-hover border-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg" style={{ cursor: 'pointer', height: '100%', padding: '32px 28px' }}>
                  <CardHeader style={{ padding: 0 }}>
                    <div style={{ fontSize: '44px', marginBottom: 16 }}>⚖️</div>
                    <CardTitle className="text-2xl font-black text-(--text)">
                      <ShutterText text="Bảng Trọng Tài" trigger="auto" />
                    </CardTitle>
                    <CardDescription className="text-muted font-semibold mt-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                      Giám sát cuộc đua được phân công, ghi nhận vi phạm, kiểm tra an toàn ngựa đua và công bố kết quả chính thức.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Magnetic>
          </ScrollReveal>
        )}
      </div>
    </div>
  )
}
