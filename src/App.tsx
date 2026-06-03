import { useEffect } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import LoginPage from '@/pages/LoginPage'
import AttendancePage from '@/pages/AttendancePage'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

/* ── Inner router — reads auth state ── */
const AppRouter = () => {
  const { isAuthenticated, isLoading } = useAuth()

useEffect(() => {
    // Update page title based on auth state
    document.title = isAuthenticated ? 'Bảng chấm công' : 'Vinh Gia'
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f1f5f9',
          gap: 16,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.9s linear infinite' }}>
          <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>Đang xác thực...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return isAuthenticated ? <AttendancePage /> : <LoginPage />
}

/* ── Root — wraps everything in AuthProvider ── */
function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <AppRouter />
    </AuthProvider>
  )
}

export default App
