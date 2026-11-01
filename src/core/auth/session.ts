// The signed-in session (JWT + who it belongs to). Kept in sessionStorage so it ends with the tab.

export type Role = 'admin' | 'student' | 'faculty' | 'office_staff' | 'campus_manager' | 'developer'

export interface User {
  /** The user's email_id; the backend uses it as the user's key. */
  id: string
  name: string
  email: string
  email_id?: string
  role: Role
  team_id?: string
  institution_name?: string
  department?: string
  dept?: string | null
  designation?: string | null
  usn?: string | null
  phone_number?: string
  avatar_url?: string
  is_simulation?: boolean
  is_super_admin?: boolean
  is_developer?: boolean
  simulated_by?: string | null
}

export interface Session {
  accessToken: string
  /** Epoch ms after which the token is no longer accepted. */
  expiresAt: number
  user: User
}

const SESSION_KEY = 'campus-os:session'

export function normalizeDepartment(dept?: string | null): string {
  if (!dept) return ''
  return dept.trim().toLowerCase().replace(/\s+dept$/, '').trim()
}

export function isCampusMaintenanceStaff(user?: User | null): boolean {
  if (!user) return false
  return user.role === 'office_staff' && normalizeDepartment(user.dept || user.department) === 'campus maintenance'
}

export function isReporterUser(user?: User | null): boolean {
  if (!user) return false
  if (user.role === 'student' || user.role === 'faculty') return true
  if (user.role === 'office_staff' && !isCampusMaintenanceStaff(user)) return true
  return false
}

export function isAdminUser(user?: User | null): boolean {
  return user?.role === 'admin'
}

export function getRoleLandingPath(user: User): string {
  if (user.role === 'admin') return '/admin'
  if (isCampusMaintenanceStaff(user)) return '/operations'
  return '/dashboard'
}

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    return session.expiresAt > Date.now() ? session : null
  } catch {
    return null
  }
}

export function saveSession(session: Session | null) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // Storage unavailable: the session lives in memory only.
  }
}
