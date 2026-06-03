import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { authApi, type AuthResponse } from '@/services/api'

/* ── Types ── */
interface AuthUser {
  userCode: string
  username: string
  displayName: string
  role: string
  permissions: string[]
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

/* ── Context ── */
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/* ── Provider ── */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /* On mount: verify existing token */
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setIsLoading(false)
      return
    }
    authApi
      .me()
      .then((res) => setUser(toAuthUser(res)))
      .catch(() => {
        localStorage.removeItem('accessToken')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const res: AuthResponse = await authApi.login({ username, password })
    localStorage.setItem('accessToken', res.accessToken)
    setUser(toAuthUser(res))
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/* ── Hook ── */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/* ── Helper ── */
const toAuthUser = (res: AuthResponse): AuthUser => ({
  userCode: res.userCode,
  username: res.username,
  displayName: res.displayName,
  role: res.role,
  permissions: res.permissions ?? [],
})
