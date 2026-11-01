import { createContext } from 'react'
import type { LoginCategory, User } from './authService'

export interface AuthContextValue {
  user: User | null
  signIn: (email: string, otp: string, category?: LoginCategory) => Promise<User>
  signInDeveloper?: (email: string, otp: string) => Promise<User>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
