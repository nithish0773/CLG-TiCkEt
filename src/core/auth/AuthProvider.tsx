import { useCallback, useMemo, useState, type ReactNode } from 'react'
import * as authService from './authService'
import { verifyDeveloperOtp } from './developerAuthService'
import { loadSession, saveSession } from './session'
import { AuthContext } from './context'

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser?: authService.User | null }) {
  const [user, setUser] = useState<authService.User | null>(() =>
    initialUser !== undefined ? initialUser : authService.getCurrentUser(),
  )

  const signIn = useCallback(async (email: string, otp: string, category?: authService.LoginCategory) => {
    const next = await authService.signIn(email, otp, category)
    setUser(next)
    return next
  }, [])

  const signInDeveloper = useCallback(async (email: string, otp: string) => {
    const next = await verifyDeveloperOtp(email, otp)
    setUser(next.user as any)
    return next.user as any
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setUser(null)
  }, [])

  const updateUser = useCallback((updates: Partial<authService.User>) => {
    setUser((prev) => {
      const base = prev ?? authService.getCurrentUser() ?? (updates as authService.User)
      const updated = { ...base, ...updates }
      const currentSession = loadSession()
      if (currentSession) {
        saveSession({ ...currentSession, user: updated })
      }
      return updated
    })
  }, [])

  const value = useMemo(
    () => ({ user, signIn, signInDeveloper, signOut, updateUser }),
    [user, signIn, signInDeveloper, signOut, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
