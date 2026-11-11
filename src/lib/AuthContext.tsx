import { createContext, useContext, type ReactNode } from 'react'
import { useSession } from './useSession'
import { useProfile } from './useProfile'

interface AuthContextValue {
  session: ReturnType<typeof useSession>['session']
  sessionLoading: boolean
  role: string | null
  roleLoading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession()
  const { profile, loading: roleLoading } = useProfile(session?.user?.id)

  const value: AuthContextValue = {
    session,
    sessionLoading,
    role: profile?.role ?? null,
    roleLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  }
  return ctx
}