
import { createContext, useContext, type ReactNode } from 'react'
import { useSession } from './useSession'

type AuthContextValue = ReturnType<typeof useSession>

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // useSession() HANYA dipanggil di sini, satu-satunya instance di seluruh app
  const value = useSession()
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  }
  return ctx
}