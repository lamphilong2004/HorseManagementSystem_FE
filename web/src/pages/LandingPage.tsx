import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div
      className="bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        // Define Glacier design system colors locally
        '--color-tertiary-fixed': '#e8d0ff',
        '--color-on-secondary': '#001f2e',
        '--color-inverse-primary': '#0a4c6e',
        '--color-surface-container-low': '#f8fafc',
        '--color-surface': '#ffffff',
        '--color-on-tertiary': '#1a002e',
        '--color-primary-fixed': '#c8eaff',
        '--color-primary-container': '#e0f2fe',
        '--color-inverse-surface': '#0f172a',
        '--color-surface-variant': '#f1f5f9',
        '--color-surface-container': '#f8fafc',
        '--color-on-secondary-container': '#075985',
        '--color-secondary': '#0ea5e9',
        '--color-on-tertiary-fixed-variant': '#4d2a73',
        '--color-primary': '#0ea5e9',
        '--color-surface-container-high': '#f1f5f9',
        '--color-on-surface': '#0f172a',
        '--color-error': '#ef4444',
        '--color-surface-container-lowest': '#ffffff',
        '--color-outline-variant': '#e2e8f0',
        '--color-surface-tint': '#0ea5e9',
        '--color-on-error-container': '#7f1d1d',
        '--color-error-container': '#fee2e2',
        '--color-on-tertiary-fixed': '#1a002e',
        '--color-inverse-on-surface': '#f8fafc',
        '--color-outline': '#94a3b8',
        '--color-surface-bright': '#ffffff',
        '--color-secondary-fixed-dim': '#7dd3fc',
        '--color-secondary-container': '#bae6fd',
        '--color-tertiary': '#a855f7',
        '--color-surface-dim': '#f1f5f9',
        '--color-surface-container-highest': '#e2e8f0',
        '--color-on-primary-fixed': '#001f2e',
        '--color-on-tertiary-container': '#3b0764',
        '--color-on-surface-variant': '#475569',
        '--color-background': '#f8fafc',
        '--color-on-secondary-fixed-variant': '#075985',
        '--color-on-primary-container': '#0369a1',
        '--color-on-primary-fixed-variant': '#0c4a6e',
        '--color-on-primary': '#ffffff',
        '--color-secondary-fixed': '#e0f2fe',
        '--color-on-background': '#0f172a',
        '--color-on-secondary-fixed': '#0c4a6e',
        '--color-tertiary-container': '#f3e8ff',
        '--color-primary-fixed-dim': '#7dd3fc',
        '--color-on-error': '#ffffff',
        '--color-tertiary-fixed-dim': '#c8a0f0',
      } as React.CSSProperties}
    >
      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(14, 165, 233, 0.1);
        }
        .glass-darker {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(14, 165, 233, 0.15);
          transition: all 0.3s ease;
        }
        .glass-darker:hover {
          box-shadow: 0 10px 40px rgba(14, 165, 233, 0.12) !important;
          transform: translateY(-8px);
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glow-subtle {
          box-shadow: 0 0 30px rgba(14, 165, 233, 0.08);
        }
      `}</style>

      {/* TopAppBar */}
      <header className="fixed top-0 z-50 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex justify-between items-center w-full px-6 md:px-12 h-16 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" data-icon="stadium">stadium</span>
            <span className="font-headline font-bold text-xl tracking-tight text-primary">Equestrian Admin Elite</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link className="text-primary font-bold border-b-2 border-primary pb-1 transition-colors duration-200" to="/">Home</Link>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200" href="#races">Races</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200" href="#features">Features</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200" href="#about">About</a>
          </nav>
          <Link to="/login" className="bg-primary text-on-primary px-6 py-2 rounded-full font-semibold hover:opacity-90 active:scale-95 transition-all text-center">
            Get Started
          </Link>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[921px] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover"
              alt="A majestic white horse galloping across a mist-covered field at sunrise"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBm_LN5oeZeYaR3sYCdiQp6wzE_iWsWveVll_Ty41EfiWwU-zloTjxlOrDuWhh8UcZq5RUBXDfQrzdK6z0hCt8XMLs9vxLE651q0OW2AjqnW9slOprPaxlJ1W2sA-Vo3lA8AfgS816nNMQxr9kuDMewIOpEk2tRlfXJss2ULlLp-fh_jjhhw-Y2fquvCd7biikftJIBaqQqYLhuJgBDQBkr6XhHUPPdZ38n2ovi-7eQu9xXNgEiYxKKaSIoPiW0L3DHdB1SVS9Pnddm"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent"></div>
          </div>
          <div className="container mx-auto px-6 md:px-12 relative z-10">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-extrabold text-on-surface leading-tight mb-6">
                Nâng Tầm Đẳng Cấp <br />
                <span className="text-primary">Đua Ngựa</span>
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant mb-10 font-medium">
                Hệ thống quản lý chuyên nghiệp, minh bạch và hiện đại hàng đầu dành cho các giải đua ngựa quốc tế. Trải nghiệm sự chính xác trong từng khoảnh khắc.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all active:scale-95 text-center">
                  Khám Phá Ngay
                </Link>
                <Link to="/login" className="glass px-8 py-4 rounded-xl font-bold text-lg border border-primary/20 text-on-surface hover:bg-surface transition-all active:scale-95 text-center">
                  Xem Tài Liệu
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section (Bento Inspired) */}
        <section className="py-20 bg-surface-container-lowest">
          <div className="container mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-darker p-8 rounded-3xl glow-subtle border-t border-white/50">
                <div className="text-primary-container bg-primary p-3 rounded-2xl w-fit mb-6">
                  <span className="material-symbols-outlined text-3xl text-white" data-icon="sports_score">sports_score</span>
                </div>
                <h3 className="text-4xl font-extrabold text-on-surface">128+</h3>
                <p className="text-on-surface-variant font-medium">Races Organized</p>
              </div>
              <div className="glass-darker p-8 rounded-3xl glow-subtle border-t border-white/50">
                <div className="text-primary-container bg-tertiary p-3 rounded-2xl w-fit mb-6">
                  <span className="material-symbols-outlined text-3xl text-white" data-icon="pets">pets</span>
                </div>
                <h3 className="text-4xl font-extrabold text-on-surface">500+</h3>
                <p className="text-on-surface-variant font-medium">Elite Horses</p>
              </div>
              <div className="glass-darker p-8 rounded-3xl glow-subtle border-t border-white/50">
                <div className="text-primary-container bg-secondary p-3 rounded-2xl w-fit mb-6">
                  <span className="material-symbols-outlined text-3xl text-white" data-icon="military_tech">military_tech</span>
                </div>
                <h3 className="text-4xl font-extrabold text-on-surface">10+</h3>
                <p className="text-on-surface-variant font-medium">Major Tournaments</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section (Asymmetric Layout) */}
        <section id="features" className="py-24 overflow-hidden">
          <div className="container mx-auto px-6 md:px-12">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="w-full lg:w-1/2 relative">
                <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 pt-12">
                    <div className="glass p-6 rounded-2xl border-primary/5">
                      <span className="material-symbols-outlined text-primary text-4xl mb-4" data-icon="verified_user">verified_user</span>
                      <h4 className="font-bold text-on-surface mb-2">Professional Management</h4>
                      <p className="text-sm text-on-surface-variant">Quy trình vận hành chuẩn quốc tế, bảo mật tuyệt đối.</p>
                    </div>
                    <div className="glass p-6 rounded-2xl border-primary/5">
                      <span className="material-symbols-outlined text-secondary text-4xl mb-4" data-icon="speed">speed</span>
                      <h4 className="font-bold text-on-surface mb-2">Real-time Results</h4>
                      <p className="text-sm text-on-surface-variant">Cập nhật kết quả tức thì với độ trễ gần như bằng không.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="glass p-6 rounded-2xl border-primary/5">
                      <span className="material-symbols-outlined text-tertiary text-4xl mb-4" data-icon="app_registration">app_registration</span>
                      <h4 className="font-bold text-on-surface mb-2">Seamless Registration</h4>
                      <p className="text-sm text-on-surface-variant">Đăng ký tham gia dễ dàng qua nền tảng trực tuyến.</p>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden h-64 shadow-xl">
                      <img
                        className="w-full h-full object-cover"
                        alt="Equestrian equipment closeup"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtOTgWfmVMjw7xB5k2S5yG0H-ofUucRCkWYxEPxHcVo0wHzEWe8Nl2Fxj8PKC0EG0pdDsYYg8b-nVA7I3GE-JuXZeyagtoghvEoZcuzP8gibEUmDPD2ad3lVCADdXErvp3PJRS5yYS4sRDPH1hHzXGGctzhTyTeN4GyUwVaS6mCwyeVW4ZHY0R4mADwjJvuf555KTjhVxoCokrGWHKR89HnMvgY4-M_MkgvIczU23rxJJlp3z6GatYyuZpxkeXoeLqj1iJkt7dniDL"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-1/2">
                <h2 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-8 leading-tight">Tính Năng Ưu Việt Cho <br /> <span className="text-primary">Quản Trị Viên Elite</span></h2>
                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <div className="bg-primary-container p-4 rounded-xl">
                      <span className="material-symbols-outlined text-primary" data-icon="monitoring">monitoring</span>
                    </div>
                    <div>
                      <h5 className="text-xl font-bold text-on-surface mb-2">Phân Tích Dữ Liệu Chuyên Sâu</h5>
                      <p className="text-on-surface-variant">Hệ thống báo cáo chi tiết về hiệu suất ngựa đua, nài ngựa và các thông số kỹ thuật sân bãi.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="bg-secondary-container p-4 rounded-xl">
                      <span className="material-symbols-outlined text-on-secondary-container" data-icon="security">security</span>
                    </div>
                    <div>
                      <h5 className="text-xl font-bold text-on-surface mb-2">Bảo Mật &amp; Minh Bạch</h5>
                      <p className="text-on-surface-variant">Công nghệ blockchain đảm bảo tính toàn vẹn của dữ liệu và kết quả mỗi vòng đua.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Giải Đua Nổi Bật (Glass Cards) */}
        <section id="races" className="py-24 bg-surface-container">
          <div className="container mx-auto px-6 md:px-12 text-center mb-16">
            <h2 className="text-4xl font-extrabold text-on-surface mb-4">Giải Đua Nổi Bật</h2>
            <div className="w-24 h-1.5 bg-primary mx-auto rounded-full"></div>
          </div>
          <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="glass-darker rounded-[2rem] overflow-hidden">
              <div className="h-56 relative">
                <img
                  className="w-full h-full object-cover"
                  alt="Premium horse racing track"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_-LGsB-NXPY1FIQ9-AbkVAt0zjgOABU7YKQ3ba_wNEuLWH8uT1grak3vUg1zP_bPSt1phKpPf1-c56j6uyW3rMrrNnI07jgQiIZDcH9JqZ_fu9GnjqN5iCZHHGoY1vtQLG6mgelbIjW5tGR5TZScEO7IBBd0UrzNrlFL0HfmUzGr1Eow0MTKTrvS280R8xk7kqHXUJon_UGFBIXvcOVS0tq4I-X6EaM9kzWl0eEK57MZ3Ssf8IzVenxJyTyLIBI0O3M_P18EqyCa1"
                />
                <div className="absolute top-4 right-4 bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Upcoming</div>
              </div>
              <div className="p-8">
                <h4 className="text-2xl font-bold text-on-surface mb-2">Grand National Cup</h4>
                <p className="text-on-surface-variant mb-6">Giải đấu quy mô lớn nhất năm với sự góp mặt của các chiến mã huyền thoại.</p>
                <div className="flex justify-between items-center pt-6 border-t border-outline-variant">
                  <span className="text-primary font-bold">25/12/2024</span>
                  <Link to="/login" className="text-on-surface font-semibold flex items-center gap-2 group">
                    Chi tiết <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="glass-darker rounded-[2rem] overflow-hidden">
              <div className="h-56 relative">
                <img
                  className="w-full h-full object-cover"
                  alt="Elegant horse in stable corridor"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1SbKBCegDjoAWAIpTG4fa2rNVldov6CYPM5etTwDVtMu5AQcdWaGqwvO1j7d-GD2lo_reMvtY7gTV3CGhYNxmnng_7PTHOROqMoQgHCU8EjXzO06jpfV3Qoom6RRJp9DVgNI8141aOuRAgOZmW7LfZ_el_f9-5VZj0QyhrYOdE7tLgdCEswrWsjvx_qtoXvSW5JtMmI_Zpw9-qxLP217biu7Ws3AAZ6KXcYPMAgK9w1JD40pb0rvDwg-AfLCnWrzInBw6h7NOdxkw"
                />
                <div className="absolute top-4 right-4 bg-tertiary text-on-tertiary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Live</div>
              </div>
              <div className="p-8">
                <h4 className="text-2xl font-bold text-on-surface mb-2">Glacier Sprint</h4>
                <p className="text-on-surface-variant mb-6">Tốc độ là tất cả. Những vòng chạy kịch tính trên mặt sân cỏ tiêu chuẩn.</p>
                <div className="flex justify-between items-center pt-6 border-t border-outline-variant">
                  <span className="text-tertiary font-bold">Đang diễn ra</span>
                  <Link to="/login" className="text-on-surface font-semibold flex items-center gap-2 group">
                    Xem ngay <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="play_circle">play_circle</span>
                  </Link>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="glass-darker rounded-[2rem] overflow-hidden">
              <div className="h-56 relative">
                <img
                  className="w-full h-full object-cover"
                  alt="Modern horse racing arena overhead"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOUhpcRB30Zfg9d5qFMxjtQs__nwcJwp7ubjHfTlVKHKb58kZaYix6gxIV0T_iLIYYzg300z8QuXs7ZW2AJXebXtfQQC3bY5ayFwGl1yYKK2dW-VkFM6cF_dj4-OrR5bfk6DRslxNOIY7D6Ipjv1f_PbI1D1aGCtoiPz526C6WSWoR0tHBOqRfQluNmLRFFiOucmgqsYSKteso9vCxgvxRrvuiBoa0Yh64eKzNyW5D7djO7USi4ZAJ2t6SCKyt6j31UnPmvZ3Vw3-U"
                />
                <div className="absolute top-4 right-4 bg-secondary text-on-secondary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Registration</div>
              </div>
              <div className="p-8">
                <h4 className="text-2xl font-bold text-on-surface mb-2">Winter Elite Derby</h4>
                <p className="text-on-surface-variant mb-6">Giải đua truyền thống trong không khí se lạnh, đòi hỏi sức bền vượt trội.</p>
                <div className="flex justify-between items-center pt-6 border-t border-outline-variant">
                  <span className="text-secondary font-bold">15/01/2025</span>
                  <Link to="/login" className="text-on-surface font-semibold flex items-center gap-2 group">
                    Đăng ký <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="edit_note">edit_note</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="about" className="py-24 relative overflow-hidden bg-primary/5">
          <div className="container mx-auto px-6 md:px-12 text-center max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-8">Sẵn Sàng Nâng Tầm Hệ Thống Của Bạn?</h2>
            <p className="text-xl text-on-surface-variant mb-12">Gia nhập cộng đồng quản trị viên chuyên nghiệp và trải nghiệm công nghệ hàng đầu thế giới ngay hôm nay.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/register" className="bg-primary text-on-primary px-10 py-5 rounded-2xl font-bold text-xl hover:shadow-xl transition-all hover:scale-105 active:scale-95 text-center">
                Bắt Đầu Miễn Phí
              </Link>
              <Link to="/login" className="glass px-10 py-5 rounded-2xl font-bold text-xl text-on-surface border border-primary/20 hover:bg-surface transition-all active:scale-95 text-center">
                Liên Hệ Tư Vấn
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-outline-variant">
        <div className="flex flex-col md:flex-row justify-between items-center w-full p-6 md:p-12 gap-8 max-w-[1440px] mx-auto pb-24 md:pb-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl" data-icon="stadium">stadium</span>
              <span className="font-headline font-bold text-lg text-primary">Equestrian Admin Elite</span>
            </div>
            <p className="text-on-surface-variant text-sm text-center md:text-left max-w-xs">
              © 2024 Equestrian Admin Elite. Precision Management for the Racing Industry.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link className="text-on-surface-variant hover:text-primary underline decoration-2 underline-offset-4 font-medium transition-colors" to="/login">Terms</Link>
            <Link className="text-on-surface-variant hover:text-primary underline decoration-2 underline-offset-4 font-medium transition-colors" to="/login">Privacy</Link>
            <Link className="text-on-surface-variant hover:text-primary underline decoration-2 underline-offset-4 font-medium transition-colors" to="/login">Support</Link>
            <Link className="text-on-surface-variant hover:text-primary underline decoration-2 underline-offset-4 font-medium transition-colors" to="/login">Contact</Link>
          </div>
        </div>
      </footer>

      {/* BottomNavBar (Mobile) */}
      <nav className="fixed bottom-0 w-full z-50 md:hidden bg-surface-container/90 backdrop-blur-md border-t border-outline-variant flex justify-around items-center py-3 px-4">
        <Link to="/" className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-1.5 active:scale-90 transition-transform">
          <span className="material-symbols-outlined" data-icon="home">home</span>
          <span className="text-[10px] font-semibold mt-0.5">Home</span>
        </Link>
        <Link to="/login" className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant px-5 py-1.5 rounded-full transition-colors">
          <span className="material-symbols-outlined" data-icon="sports_score">sports_score</span>
          <span className="text-[10px] font-semibold mt-0.5">Races</span>
        </Link>
        <Link to="/login" className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant px-5 py-1.5 rounded-full transition-colors">
          <span className="material-symbols-outlined" data-icon="groups">groups</span>
          <span className="text-[10px] font-semibold mt-0.5">Participants</span>
        </Link>
        <Link to="/login" className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant px-5 py-1.5 rounded-full transition-colors">
          <span className="material-symbols-outlined" data-icon="settings">settings</span>
          <span className="text-[10px] font-semibold mt-0.5">Settings</span>
        </Link>
      </nav>
    </div>
  )
}
