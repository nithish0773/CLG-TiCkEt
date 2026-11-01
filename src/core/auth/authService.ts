// Auth against campus-os-backend.
// Everyone signs in with their email and the OTP provided by the admin.

import { ApiError, apiRequest } from '@/core/api'
import {
  loadSession,
  saveSession,
  normalizeDepartment,
  type Role,
  type User,
} from './session'

export type { Role, User } from './session'

export type LoginCategory = 'student_faculty' | 'maintenance' | 'admin'

interface RawProfile {
  role: Role
  team_id?: string
  institution_name?: string
  name: string
  email_id: string
  phone_number?: string
  usn?: string | null
  dept?: string | null
  designation?: string | null
  avatar_url?: string
}

interface TokenResponse {
  access_token: string
  token_type: 'bearer'
  /** Seconds until expiration */
  expires_in: number
  profile: RawProfile
}

export function getCurrentUser(): User | null {
  return loadSession()?.user ?? null
}

/**
 * Perform login against the actual backend API.
 * Admin endpoint: POST /api/v1/auth/admin/login
 * Non-admin endpoint: POST /api/v1/auth/login
 */
async function performLogin(email_id: string, otp: string, category?: LoginCategory): Promise<TokenResponse> {
  const json = { email_id, otp }

  // If user selected administrator tab, hit admin endpoint first
  if (category === 'admin') {
    return apiRequest<TokenResponse>('/auth/admin/login', { method: 'POST', json })
  }

  try {
    return await apiRequest<TokenResponse>('/auth/login', { method: 'POST', json })
  } catch (error) {
    // If an admin email hits the standard user login, the backend returns USE_ADMIN_LOGIN
    if (error instanceof ApiError && error.code === 'USE_ADMIN_LOGIN') {
      return apiRequest<TokenResponse>('/auth/admin/login', { method: 'POST', json })
    }
    throw error
  }
}

/**
 * Signs in the user, validates their selected account category against the returned profile,
 * and saves the active session.
 */
export async function signIn(email: string, otp: string, category?: LoginCategory): Promise<User> {
  const cleanEmail = email.trim().toLowerCase()
  const cleanOtp = otp.trim()

  const res = await performLogin(cleanEmail, cleanOtp, category)
  const { profile } = res

  // Category validation against returned profile
  if (category === 'admin') {
    if (profile.role !== 'admin') {
      throw new ApiError(
        403,
        'CATEGORY_MISMATCH',
        'Access denied. This account does not possess Administrator credentials.',
      )
    }
  } else if (category === 'maintenance') {
    const isMaintenance =
      profile.role === 'office_staff' &&
      normalizeDepartment(profile.dept) === 'campus maintenance'
    if (!isMaintenance && profile.role !== 'admin') {
      throw new ApiError(
        403,
        'CATEGORY_MISMATCH',
        'Access denied. This account is not registered under the Campus Maintenance department.',
      )
    }
  }

  const user: User = {
    id: profile.email_id,
    name: profile.name,
    email: profile.email_id,
    role: profile.role,
    team_id: profile.team_id,
    institution_name: profile.institution_name,
    dept: profile.dept ?? null,
    department: profile.dept ?? undefined,
    designation: profile.designation ?? null,
    usn: profile.usn ?? null,
    phone_number: profile.phone_number,
    avatar_url: profile.avatar_url,
  }

  saveSession({
    accessToken: res.access_token,
    expiresAt: Date.now() + res.expires_in * 1000,
    user,
  })

  return user
}

/** The backend has no logout endpoint; clearing the session token closes the session. */
export async function signOut(): Promise<void> {
  saveSession(null)
}
