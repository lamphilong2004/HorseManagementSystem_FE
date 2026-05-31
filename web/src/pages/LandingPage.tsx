import { Link } from 'react-router-dom'

const features = [
  {
    icon: '🏆',
    title: 'Quản lý Giải đấu',
    desc: 'Tạo và theo dõi giải đấu đua ngựa chuyên nghiệp với lịch trình chi tiết và kết quả thời gian thực.',
    color: 'var(--accent)',
  },
  {
    icon: '🐎',
    title: 'Hồ sơ Ngựa đua',
    desc: 'Đăng ký và quản lý hồ sơ ngựa đầy đủ: giống, sức khỏe, lịch sử thi đấu và thành tích.',
    color: 'var(--primary)',
  },
  {
    icon: '🏇',
    title: 'Kết nối Jockey',
    desc: 'Chủ ngựa dễ dàng tìm và thuê jockey chuyên nghiệp, theo dõi lời mời và xác nhận tham gia.',
    color: '#3b82f6',
  },
  {
    icon: '⚖️',
    title: 'Quản lý Trọng tài',
    desc: 'Phân công trọng tài, ghi nhận vi phạm, xác nhận kết quả và đảm bảo tính công bằng cuộc đua.',
    color: '#8b5cf6',
  },
  {
    icon: '🔮',
    title: 'Dự đoán & Cược',
    desc: 'Khán giả đặt cược và dự đoán kết quả cuộc đua. Hệ thống tự động tính toán và trả thưởng.',
    color: '#f97316',
  },
  {
    icon: '📊',
    title: 'Bảng xếp hạng',
    desc: 'Theo dõi thành tích, tiền thưởng và bảng xếp hạng tổng hợp của tất cả các cuộc đua.',
    color: '#10b981',
  },
]

const roles = [
  { icon: '👑', name: 'Horse Owner', desc: 'Đăng ký ngựa, tuyển jockey, theo dõi kết quả', color: '#059669' },
  { icon: '🏇', name: 'Jockey', desc: 'Nhận lời mời, tham gia đua, theo dõi thành tích', color: '#f97316' },
  { icon: '⚖️', name: 'Trọng tài', desc: 'Giám sát, xử lý vi phạm, xác nhận kết quả', color: '#3b82f6' },
  { icon: '🔮', name: 'Khán giả', desc: 'Xem giải đấu, dự đoán, tham gia cược', color: '#8b5cf6' },
]

const stats = [
  { value: '50+', label: 'Giải đấu' },
  { value: '200+', label: 'Cuộc đua' },
  { value: '1,000+', label: 'Ngựa đăng ký' },
  { value: '5,000+', label: 'Thành viên' },
]

export function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #071a12 0%, #0a1628 100%)', color: 'white', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Topbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7, 26, 18, 0.85)',
        backdropFilter: 'blur(16px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #059669, #047857)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🏇</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '-0.02em' }}>HorseRacing</span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {['Tính năng', 'Vai trò', 'Về chúng tôi'].map((label) => (
              <a key={label} href={`#${label === 'Tính năng' ? 'features' : label === 'Vai trò' ? 'roles' : 'about'}`}
                style={{ padding: '6px 14px', borderRadius: 999, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'all 0.15s', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              >
                {label}
              </a>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/login" style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)',
              color: 'white', textDecoration: 'none', transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
            >
              Đăng nhập
            </Link>
            <Link to="/register" style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: 'linear-gradient(135deg, #059669, #047857)',
              border: '1px solid #047857', color: 'white', textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(5,150,105,0.35)',
              transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(5,150,105,0.45)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(5,150,105,0.35)' }}
            >
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '100px 24px 80px' }}>
        {/* Background decorations */}
        <div style={{
          position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
          width: '900px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(5,150,105,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, right: '-100px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999,
            background: 'rgba(5,150,105,0.15)',
            border: '1px solid rgba(5,150,105,0.35)',
            marginBottom: 28, fontSize: 13, fontWeight: 600, color: '#34d399',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Nền tảng Quản lý Đua ngựa Chuyên nghiệp
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800,
            lineHeight: 1.08, letterSpacing: '-0.04em',
            margin: '0 0 24px',
            background: 'linear-gradient(135deg, #ffffff 40%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Hệ thống Đua Ngựa<br />
            <span style={{
              background: 'linear-gradient(135deg, #34d399, #059669)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Thông minh & Chuyên nghiệp</span>
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: '0 auto 40px', maxWidth: 620 }}>
            Quản lý toàn bộ quy trình đua ngựa — từ đăng ký ngựa, tuyển jockey, lên lịch thi đấu, 
            theo dõi kết quả đến hệ thống cược trực tuyến.
          </p>

          {/* CTA group */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 12, fontSize: 16, fontWeight: 700,
              background: 'linear-gradient(135deg, #059669, #047857)',
              border: '1px solid #047857', color: 'white', textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(5,150,105,0.4)',
            }}>
              🚀 Bắt đầu miễn phí
            </Link>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 12, fontSize: 16, fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)',
              color: 'white', textDecoration: 'none',
            }}>
              Đăng nhập →
            </Link>
          </div>
        </div>

        {/* Hero visual — animated stats strip */}
        <div style={{ maxWidth: 900, margin: '64px auto 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ padding: '24px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Tính năng nổi bật</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.03em', color: 'white' }}>
              Mọi thứ bạn cần để<br />quản lý giải đấu đua ngựa
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 520, margin: '0 auto' }}>
              Từ đăng ký đến công bố kết quả — một nền tảng duy nhất cho tất cả vai trò.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                padding: '28px 24px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                transition: 'all 0.2s',
                cursor: 'default',
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${f.color}22`,
                  border: `1px solid ${f.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, marginBottom: 16,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="roles" style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Vai trò trong hệ thống</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em', color: 'white' }}>
              Dành cho mọi người trong giải đấu
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {roles.map((r, i) => (
              <div key={i} style={{
                padding: '32px 24px', textAlign: 'center',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${r.color}33`,
                borderRadius: 16, transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${r.color}88`
                  ;(e.currentTarget as HTMLElement).style.background = `${r.color}0f`
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${r.color}33`
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 14 }}>{r.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 8 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section id="about" style={{ padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{
            padding: '60px 40px',
            background: 'linear-gradient(135deg, rgba(5,150,105,0.15) 0%, rgba(5,150,105,0.05) 100%)',
            border: '1px solid rgba(5,150,105,0.25)',
            borderRadius: 24,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Glow */}
            <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(5,150,105,0.25), transparent)', pointerEvents: 'none' }} />

            <div style={{ fontSize: 48, marginBottom: 16 }}>🏇</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.03em', color: 'white' }}>
              Sẵn sàng tham gia?
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', margin: '0 0 32px', lineHeight: 1.65 }}>
              Đăng ký tài khoản miễn phí ngay hôm nay và trải nghiệm<br />
              nền tảng quản lý đua ngựa chuyên nghiệp nhất.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" style={{
                padding: '13px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, #059669, #047857)',
                border: '1px solid #047857', color: 'white', textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(5,150,105,0.4)',
              }}>
                🚀 Đăng ký ngay
              </Link>
              <Link to="/login" style={{
                padding: '13px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.06)',
                color: 'white', textDecoration: 'none',
              }}>
                Đã có tài khoản
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#059669,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏇</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>HorseRacing</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
            © 2025 Horse Racing Management System · Dự án học thuật FPT
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'Đăng nhập', to: '/login' },
              { label: 'Đăng ký', to: '/register' },
            ].map((link) => (
              <Link key={link.to} to={link.to} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'white')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)')}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 640px) {
          nav div { flex-wrap: wrap; }
          section { padding: 60px 16px; }
        }
      `}</style>
    </div>
  )
}
