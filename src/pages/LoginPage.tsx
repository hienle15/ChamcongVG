import { useState, type FormEvent, type CSSProperties } from 'react'
import { useAuth } from '@/contexts/AuthContext'

/* ─────────────────────────── Design tokens ────────────────────────────── */
const C = {
  primary: 'var(--brand)',
  primaryHover: '#13546c',
  primaryText: '#ffffff',
  primaryLight: '#e8f3f6',
  secondaryText: '#505f76',
  surfaceBg: '#ffffff',
  pageBg: '#f7f9fb',
  inputBg: '#ffffff',
  inputBorder: '#c4c6d3',
  inputBorderFocus: '#1e40af',
  textMain: '#191c1e',
  textMuted: '#434651',
  outline: '#747782',
  divider: '#e0e3e5',
  errorRed: '#ba1a1a',
  blue: '#0284c7',
} as const

/* ─────────────────────────── Interfaces ───────────────────────────────── */
interface LoginFormData {
  username: string
  password: string
  rememberMe: boolean
}

/* ─────────────────────────── Component ────────────────────────────────── */
const LoginPage = () => {
  const { login } = useAuth()
  const [form, setForm] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [btnHovered, setBtnHovered] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoginError(null)
    setIsLoading(true)
    try {
      await login(form.username, form.password)
      // AuthContext sets user → App.tsx redirects automatically
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Inline style helpers ── */
  const inputWrapStyle = (field: string): CSSProperties => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    border: `1.5px solid ${focusedField === field ? C.inputBorderFocus : C.inputBorder}`,
    borderRadius: 10,
    background: C.inputBg,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? `0 0 0 3px rgba(0,30,82,0.12)` : 'none',
    overflow: 'hidden',
  })

  return (
    <div style={styles.page}>

      {/* ═══════════════════ LEFT PANEL ═══════════════════ */}
      <div style={styles.leftPanel}>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKI5HEeZefrwSXumrF2HwvvIuIUjaKLcj-u5g1Kp4sGBX3ABj84JwX8jBx4RL6lre2g1Uk86grSjUPg_z2wlRj3vyeXZwfHVreSOpUZ5F4FC21hMVEGy1qUo7XtdtSjNx1DRy4w-XVTl5HpZ66Z5ZyTxftSZu0mPEQuZ3CgF39NeiaZvQn_aehlQ9M-Dx_lZz2x9xwm6RUqN0UBNcGDD6eC9mtd8RN7zh03blNqMc2nLozkb7Oq1iL2uIDMuOfFX7k-U88Fg3ww5P0"
          alt="Văn phòng hiện đại"
          style={styles.leftImg}
        />
        {/* Gradient overlay */}
        <div style={styles.leftOverlay} />

        {/* Brand badge */}
        <div style={styles.leftBadge}>
          <div style={styles.leftBadgeIcon}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 28 }}>schedule</span>
          </div>
          <span style={styles.leftBadgeText}>Vinh Gia</span>
        </div>

        {/* Bottom content */}
        <div style={styles.leftBottom}>
          <div style={styles.leftStats}>
            {[
              { icon: 'groups', val: '5.000+', label: 'Nhân viên đang dùng' },
              { icon: 'verified', val: '99.9%', label: 'Uptime đảm bảo' },
              { icon: 'trending_up', val: '40%', label: 'Tăng hiệu suất' },
            ].map((s) => (
              <div key={s.label} style={styles.statItem}>
                <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20 }}>{s.icon}</span>
                <div>
                  <div style={styles.statVal}>{s.val}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <h2 style={styles.leftTitle}>Nâng tầm hiệu suất<br />công việc.</h2>
          <p style={styles.leftSubtitle}>
            Giải pháp quản lý chấm công & nhân sự tối ưu cho doanh nghiệp hiện đại — nhanh, chính xác, an toàn.
          </p>
        </div>
      </div>

      {/* ═══════════════════ RIGHT PANEL ═══════════════════ */}
      <div style={styles.rightPanel}>

        {/* Form card */}
        <main style={styles.main}>
          <div style={styles.card}>

            {/* Greeting */}
            <div style={styles.greeting}>
              <div style={styles.greetingBadge}>
                <span style={styles.greetingBadgeDot} />
                Hệ thống đang hoạt động
              </div>
              <h1 style={styles.greetingTitle}>Chào mừng trở lại 👋</h1>
              <p style={styles.greetingSubtitle}>Vui lòng nhập thông tin để truy cập hệ thống</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate style={styles.form}>

              {/* Username */}
              <div style={styles.field}>
                <label htmlFor="username" style={styles.label}>Tên đăng nhập</label>
                <div style={inputWrapStyle('username')}>
                  <span className="material-symbols-outlined" style={styles.inputIcon(focusedField === 'username')}>person</span>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="nguyen.van.a"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={styles.field}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="password" style={styles.label}>Mật khẩu</label>
                  <a href="#" style={styles.forgotLink}>Quên mật khẩu?</a>
                </div>
                <div style={inputWrapStyle('password')}>
                  <span className="material-symbols-outlined" style={styles.inputIcon(focusedField === 'password')}>lock</span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...styles.input, paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={styles.eyeBtn}
                  >
                    <span className="material-symbols-outlined" style={{ color: C.outline, fontSize: 20 }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div style={styles.rememberRow}>
                <input
                  id="remember"
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                  style={styles.checkbox}
                />
                <label htmlFor="remember" style={styles.rememberLabel}>Ghi nhớ đăng nhập</label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
                style={{
                  ...styles.submitBtn,
                  background: btnHovered && !isLoading ? C.primaryHover : C.primary,
                  transform: isLoading ? 'scale(1)' : btnHovered ? 'translateY(-1px)' : 'scale(1)',
                  boxShadow: btnHovered && !isLoading
                    ? '0 8px 24px rgba(0,30,82,0.35)'
                    : '0 4px 12px rgba(0,30,82,0.2)',
                }}
              >
                {isLoading ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Error message */}
            {loginError && (
              <div style={{
                marginTop: 16,
                padding: '12px 14px',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#dc2626',
                fontWeight: 500,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                {loginError}
              </div>
            )}

          </div>
        </main>

        {/* Footer */}
        <footer style={styles.footer}>
          <span style={styles.footerCopy}>© 2026 Hệ thống chấm công Vinh Gia.</span>

        </footer>

      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #9aa3b2; }
        input:focus { outline: none; }
        button:focus-visible { outline: 2px solid ${C.primary}; outline-offset: 2px; }
        a:hover { color: ${C.primary} !important; }
        .sso-btn:hover {
          background: #f0f4f8 !important;
          border-color: ${C.primary} !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  )
}

/* ─────────────────────────── SSO Button ───────────────────────────────── */
interface SSOButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

const SSOButton = ({ icon, label, onClick }: SSOButtonProps) => (
  <button
    type="button"
    className="sso-btn"
    onClick={onClick}
    style={styles.ssoBtn}
  >
    {icon}
    <span style={{ fontSize: 14, fontWeight: 500, color: '#191c1e' }}>{label}</span>
  </button>
)

/* ─────────────────────────── Styles ───────────────────────────────────── */
const styles = {
  page: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
  } as CSSProperties,

  /* Left */
  leftPanel: {
    display: 'none',
    position: 'relative',
    overflow: 'hidden',
    flex: '0 0 50%',
    '@media (min-width: 1024px)': { display: 'block' },
  } as CSSProperties,
  leftImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  } as CSSProperties,
  leftOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(160deg, rgba(0,30,82,0.55) 0%, rgba(0,30,82,0.82) 100%)',
  } as CSSProperties,
  leftBadge: {
    position: 'absolute',
    top: 32,
    left: 40,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    zIndex: 2,
  } as CSSProperties,
  leftBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.25)',
  } as CSSProperties,
  leftBadgeText: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: '-0.01em',
  } as CSSProperties,
  leftBottom: {
    position: 'absolute',
    bottom: 48,
    left: 40,
    right: 40,
    zIndex: 2,
  } as CSSProperties,
  leftStats: {
    display: 'flex',
    gap: 24,
    marginBottom: 32,
  } as CSSProperties,
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as CSSProperties,
  statVal: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
    lineHeight: '1.2',
  } as CSSProperties,
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    lineHeight: '1.3',
    fontWeight: 400,
  } as CSSProperties,
  leftTitle: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 700,
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    marginBottom: 12,
  } as CSSProperties,
  leftSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    lineHeight: '1.6',
    fontWeight: 400,
    maxWidth: 380,
  } as CSSProperties,

  /* Right */
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#f7f9fb',
    overflow: 'hidden',
    position: 'relative',
  } as CSSProperties,

  /* Header */
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    background: '#ffffff',
    borderBottom: '1px solid #e0e3e5',
    flexShrink: 0,
  } as CSSProperties,
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as CSSProperties,
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: '#1e40af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,
  logoText: {
    fontWeight: 700,
    fontSize: 17,
    color: '#1e40af',
    letterSpacing: '-0.01em',
  } as CSSProperties,
  headerActions: {
    display: 'flex',
    gap: 4,
  } as CSSProperties,
  iconBtn: {
    width: 36,
    height: 36,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  } as CSSProperties,

  /* Main scroll area */
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    overflow: 'auto',
  } as CSSProperties,

  /* Card */
  card: {
    background: '#ffffff',
    borderRadius: 20,
    padding: '40px 40px 36px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 4px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
    border: '1px solid #e8eaed',
    animation: 'fadeUp 0.4s ease both',
  } as CSSProperties,

  greeting: { marginBottom: 28 } as CSSProperties,
  greetingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#e8f5e9',
    color: '#2e7d32',
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 20,
    marginBottom: 12,
  } as CSSProperties,
  greetingBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#4caf50',
    display: 'inline-block',
    boxShadow: '0 0 0 2px rgba(76,175,80,0.3)',
  } as CSSProperties,
  greetingTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: '#191c1e',
    letterSpacing: '-0.02em',
    lineHeight: '1.25',
    marginBottom: 6,
  } as CSSProperties,
  greetingSubtitle: {
    fontSize: 14,
    color: '#505f76',
    fontWeight: 400,
    lineHeight: '1.5',
  } as CSSProperties,

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  } as CSSProperties,

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  } as CSSProperties,

  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#434651',
    lineHeight: '1',
  } as CSSProperties,

  inputIcon: (focused: boolean): CSSProperties => ({
    position: 'absolute',
    left: 14,
    color: focused ? '#1e40af' : '#9aa3b2',
    fontSize: 20,
    transition: 'color 0.2s',
    flexShrink: 0,
    pointerEvents: 'none',
  }),

  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    padding: '13px 14px 13px 44px',
    fontSize: 15,
    color: '#191c1e',
    width: '100%',
    fontFamily: "'Inter', sans-serif",
  } as CSSProperties,

  eyeBtn: {
    position: 'absolute',
    right: 12,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 4,
    borderRadius: 4,
  } as CSSProperties,

  rememberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as CSSProperties,

  checkbox: {
    width: 17,
    height: 17,
    cursor: 'pointer',
    accentColor: '#1e40af',
    flexShrink: 0,
  } as CSSProperties,

  rememberLabel: {
    fontSize: 13,
    color: '#434651',
    cursor: 'pointer',
    userSelect: 'none',
    fontWeight: 500,
  } as CSSProperties,

  forgotLink: {
    fontSize: 13,
    fontWeight: 500,
    color: '#1e40af',
    textDecoration: 'none',
    transition: 'opacity 0.15s',
  } as CSSProperties,

  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '14px 24px',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.01em',
    marginTop: 4,
  } as CSSProperties,

  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '24px 0',
  } as CSSProperties,
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#e0e3e5',
  } as CSSProperties,
  dividerText: {
    fontSize: 12,
    fontWeight: 500,
    color: '#9aa3b2',
    whiteSpace: 'nowrap',
  } as CSSProperties,

  ssoRow: {
    display: 'flex',
    gap: 12,
  } as CSSProperties,

  ssoBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '11px 16px',
    border: '1.5px solid #e0e3e5',
    borderRadius: 10,
    background: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    fontFamily: "'Inter', sans-serif",
  } as CSSProperties,

  /* Footer */
  footer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: '14px 24px',
    background: '#ffffff',
    borderTop: '1px solid #e0e3e5',
    flexShrink: 0,
  } as CSSProperties,
  footerCopy: {
    fontSize: 14,
    color: '#9aa3b2',
    fontWeight: 600,
  } as CSSProperties,
  footerLinks: {
    display: 'flex',
    gap: 20,
  } as CSSProperties,
  footerLink: {
    fontSize: 12,
    color: '#9aa3b2',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color 0.15s',
  } as CSSProperties,
}

/* ── Responsive: show left panel on large screens ── */
const mediaStyle = `
  @media (min-width: 1024px) {
    [data-left-panel] { display: block !important; }
  }
`

const LoginPageWrapper = () => (
  <>
    <style>{mediaStyle}</style>
    <LoginPage />
  </>
)

export default LoginPageWrapper
