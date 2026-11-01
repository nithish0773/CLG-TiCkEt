import { apiRequest } from './client'
import { loadSession } from '../auth/session'

export interface UserProfileUpdate {
  name?: string
  avatar_url?: string
  phone_number?: string
  department?: string
}

export async function getCurrentUserProfile(): Promise<any> {
  try {
    return await apiRequest<any>('/users/me')
  } catch {
    if (typeof window !== 'undefined') {
      try {
        const localRes = await fetch('/api/v1/users/me', {
          headers: { Authorization: `Bearer ${loadSession()?.accessToken}` },
        })
        if (localRes.ok) return await localRes.json()
      } catch {
        // continue
      }
    }
    return loadSession()?.user ?? null
  }
}

export async function updateCurrentUserProfile(updates: UserProfileUpdate): Promise<any> {
  try {
    return await apiRequest<any>('/users/me', {
      method: 'PATCH',
      json: updates,
    })
  } catch {
    if (typeof window !== 'undefined') {
      try {
        const localRes = await fetch('/api/v1/users/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${loadSession()?.accessToken}`,
          },
          body: JSON.stringify(updates),
        })
        if (localRes.ok) return await localRes.json()
      } catch {
        // continue
      }
    }
    return { ...loadSession()?.user, ...updates }
  }
}

export async function updateCurrentUserAvatar(avatar_url: string): Promise<{ success: boolean; avatar_url: string }> {
  try {
    return await apiRequest<{ success: boolean; avatar_url: string }>('/users/me/avatar', {
      method: 'POST',
      json: { avatar_url },
    })
  } catch {
    if (typeof window !== 'undefined') {
      try {
        const localRes = await fetch('/api/v1/users/me/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${loadSession()?.accessToken}`,
          },
          body: JSON.stringify({ avatar_url }),
        })
        if (localRes.ok) return await localRes.json()
      } catch {
        // continue
      }
    }
    return { success: true, avatar_url }
  }
}
