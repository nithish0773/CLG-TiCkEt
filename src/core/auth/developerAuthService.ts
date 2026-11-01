import { ApiError, apiRequest } from '@/core/api'
import { saveSession, type User } from './session'

export interface SendOtpResult {
  success: boolean
  message: string
  cooldown_seconds?: number
  expires_in_seconds?: number
}

export interface VerifyOtpResult {
  success: boolean
  access_token: string
  token_type: string
  expires_in: number
  user: {
    id: string
    email_id?: string
    email?: string
    name: string
    role: string
    is_super_admin?: boolean
    is_developer?: boolean
  }
}

export function getConfiguredDeveloperGmail(): string {
  return (import.meta.env.VITE_SUPER_ADMIN_GMAIL || 'superadmin.team13@gmail.com').trim().toLowerCase()
}

export async function sendDeveloperOtp(email: string): Promise<SendOtpResult> {
  const json = { email: email.trim().toLowerCase() }
  try {
    return await apiRequest<SendOtpResult>('/developer/auth/send-otp', {
      method: 'POST',
      json,
    })
  } catch (error) {
    if (typeof window !== 'undefined') {
      try {
        const localRes = await fetch('/api/v1/developer/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        })
        const data = await localRes.json()
        if (localRes.ok) return data
        const errMsg = data?.error?.message || data?.message || 'Failed to dispatch verification code'
        throw new ApiError(localRes.status, data?.error?.code || 'SEND_OTP_FAILED', errMsg, data?.error?.details)
      } catch (inner: any) {
        if (inner instanceof ApiError) throw inner
      }
    }
    throw error
  }
}

export async function verifyDeveloperOtp(email: string, otp: string): Promise<VerifyOtpResult> {
  const json = { email: email.trim().toLowerCase(), otp: otp.trim() }
  try {
    return await apiRequest<VerifyOtpResult>('/developer/auth/verify-otp', {
      method: 'POST',
      json,
    })
  } catch (error) {
    if (typeof window !== 'undefined') {
      try {
        const localRes = await fetch('/api/v1/developer/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        })
        const data = await localRes.json()
        if (localRes.ok) return data
        const errMsg = data?.error?.message || data?.message || 'Invalid verification code'
        throw new ApiError(localRes.status, data?.error?.code || 'VERIFY_OTP_FAILED', errMsg, data?.error?.details)
      } catch (inner: any) {
        if (inner instanceof ApiError) throw inner
      }
    }
    throw error
  }
}

export async function signInDeveloper(email: string, otp: string): Promise<User> {
  const res = await verifyDeveloperOtp(email, otp)
  const user: User = {
    id: res.user.email_id || res.user.email || email,
    name: res.user.name || 'Developer Super Admin',
    email: res.user.email_id || res.user.email || email,
    role: 'developer',
    is_super_admin: true,
    is_developer: true,
  }

  saveSession({
    accessToken: res.access_token,
    expiresAt: Date.now() + (res.expires_in || 86400) * 1000,
    user,
  })

  return user
}

